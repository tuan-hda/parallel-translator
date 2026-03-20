export const config = {
  runtime: "edge",
};

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
        JSON.stringify({ 
          text: "Chưa cấu hình API Key cho AI (vui lòng thêm OPENAI_API_KEY hoặc GEMINI_API_KEY vào .env)"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determine if it's Gemini or OpenAI based on the key
    if (apiKey.startsWith("AIza")) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: "Bạn là một trợ lý dịch thuật xuất sắc. Hãy giải thích ngữ cảnh và ý nghĩa của các câu được cung cấp một cách chi tiết bằng tiếng Việt." }] },
            generationConfig: { temperature: 0.7 }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không có phản hồi từ AI";
      
      return new Response(JSON.stringify({ text }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // OpenAI format
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Bạn là một trợ lý dịch thuật xuất sắc. Hãy giải thích ngữ cảnh và ý nghĩa của các câu được cung cấp một cách chi tiết bằng tiếng Việt." },
            { role: "user", content: prompt }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "Không có phản hồi từ AI";

      return new Response(JSON.stringify({ text }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

  } catch (error) {
    console.error("Error in AI API:", error);
    return new Response(JSON.stringify({ text: "Đã xảy ra lỗi khi gọi AI API." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
