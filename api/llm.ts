import { getCache } from "@vercel/functions";

export const config = {
  runtime: "edge",
};

const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

const systemInstruction = `Bạn là một trợ lý dịch thuật. Hãy giải thích ngữ cảnh và ý nghĩa của các câu được cung cấp một cách chi tiết bằng tiếng Việt. Trả lời đi thẳng vào vấn đề, ngắn gọn, súc tích và tập trung giải quyết câu hỏi. Tuyệt đối KHÔNG sử dụng các câu giao tiếp thừa thãi (ví dụ: "Tuyệt vời", "Đó là một câu hỏi hay", "Dưới đây là...", "Tôi xin giải thích..."). Chỉ trả lời nội dung chính.`;

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing prompt in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        "Chưa cấu hình API Key cho AI (vui lòng thêm OPENAI_API_KEY hoặc GEMINI_API_KEY vào .env)",
        { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    // Initialize Vercel Runtime Cache API
    const cache = getCache();
    const cacheKey = `ai-llm:${prompt}`;

    // Return cached response if available
    const cached = await cache.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        status: 200,
        headers: { 
          "Content-Type": "text/plain; charset=utf-8",
          "X-Cache": "HIT"
        },
      });
    }

    const isGemini = apiKey.startsWith("AIza");
    let response: Response;

    if (isGemini) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { temperature: 0.3 }
          }),
        }
      );
    } else {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          stream: true,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      return new Response("Đã xảy ra lỗi khi gọi AI API.", {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullContentAccumulator = "";

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last line in the buffer as it might be incomplete
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              let content = "";
              if (isGemini) {
                content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
              } else {
                content = data.choices?.[0]?.delta?.content || "";
              }
              if (content) {
                fullContentAccumulator += content;
                controller.enqueue(encoder.encode(content));
              }
            } catch (e) {
              // Ignore parse errors on incomplete chunks
            }
          }
        }
      },
      async flush(controller) {
        if (buffer.startsWith('data: ') && buffer.trim() !== 'data: [DONE]') {
          try {
            const data = JSON.parse(buffer.slice(6));
            let content = "";
            if (isGemini) {
              content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            } else {
              content = data.choices?.[0]?.delta?.content || "";
            }
            if (content) {
              fullContentAccumulator += content;
              controller.enqueue(encoder.encode(content));
            }
          } catch (e) {}
        }
        
        // Cache the fully accumulated text
        if (fullContentAccumulator.length > 0) {
          try {
            await cache.set(cacheKey, fullContentAccumulator, { ttl: CACHE_TTL_SECONDS });
          } catch (err) {
            console.error("Failed to cache AI response:", err);
          }
        }
      }
    });

    return new Response(response.body!.pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        "X-Cache": "MISS"
      },
    });

  } catch (error) {
    console.error("Error in AI API:", error);
    return new Response("Đã xảy ra lỗi hệ thống khi gọi AI API.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
