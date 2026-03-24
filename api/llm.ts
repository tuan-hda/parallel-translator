import { getCache } from "@vercel/functions";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

export const config = {
  runtime: "edge",
};

const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const PROVIDER_TIMEOUT_MS = 5_000; // 5s to establish connection before trying next provider

const systemInstruction = `Bạn là một trợ lý dịch thuật. Hãy giải thích ngữ cảnh và ý nghĩa của các câu được cung cấp một cách chi tiết bằng tiếng Việt. Trả lời đi thẳng vào vấn đề, ngắn gọn, súc tích và tập trung giải quyết câu hỏi. Tuyệt đối KHÔNG sử dụng các câu giao tiếp thừa thãi (ví dụ: "Tuyệt vời", "Đó là một câu hỏi hay", "Dưới đây là...", "Tôi xin giải thích..."). Chỉ trả lời nội dung chính.`;

// ---------------------------------------------------------------------------
// Provider types
// ---------------------------------------------------------------------------

type ProviderName = "gemini" | "groq";

interface Provider {
  name: ProviderName;
  /** Returns a ReadableStream of text chunks, or throws on transient error */
  call: (prompt: string) => Promise<ReadableStream<Uint8Array>>;
}

/** Status codes that warrant trying the next provider */
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

// ---------------------------------------------------------------------------
// Helper: race a promise against a timeout
// ---------------------------------------------------------------------------

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
    ),
  ]);
}

// ---------------------------------------------------------------------------
// Provider implementations
// ---------------------------------------------------------------------------

function makeGeminiProvider(apiKey: string): Provider {
  const encoder = new TextEncoder();
  return {
    name: "gemini",
    async call(prompt: string) {
      const ai = new GoogleGenAI({ apiKey });

      // withTimeout wraps the initial stream creation (connection phase)
      const responseStream = await withTimeout(
        ai.models.generateContentStream({
          model: "gemini-3.1-flash-lite-preview",
          contents: prompt,
          config: { systemInstruction, temperature: 0.3 },
        }),
        PROVIDER_TIMEOUT_MS,
      );

      return new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            for await (const chunk of responseStream) {
              if (chunk.text) {
                controller.enqueue(encoder.encode(chunk.text));
              }
            }
            controller.close();
          } catch (e) {
            controller.error(e);
          }
        },
      });
    },
  };
}

function makeGroqProvider(apiKey: string): Provider {
  const encoder = new TextEncoder();
  return {
    name: "groq",
    async call(prompt: string) {
      const groq = new Groq({ apiKey });

      // withTimeout covers the initial connection/handshake phase
      const stream = await withTimeout(
        groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          stream: true,
          temperature: 0.3,
          messages: [
            { role: "user", content: systemInstruction },
            { role: "user", content: prompt },
          ],
        }),
        PROVIDER_TIMEOUT_MS,
      );

      return new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content ?? "";
              if (content) controller.enqueue(encoder.encode(content));
            }
            controller.close();
          } catch (e) {
            controller.error(e);
          }
        },
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Build provider list from env vars (in priority order)
// ---------------------------------------------------------------------------

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) providers.push(makeGeminiProvider(geminiKey));

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) providers.push(makeGroqProvider(groqKey));

  return providers;
}

// ---------------------------------------------------------------------------
// Try providers in order, return first successful stream
// ---------------------------------------------------------------------------

async function tryProviders(
  providers: Provider[],
  prompt: string,
): Promise<{ stream: ReadableStream<Uint8Array>; provider: ProviderName }> {
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const stream = await provider.call(prompt);
      return { stream, provider: provider.name };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[llm] Provider "${provider.name}" failed: ${msg}`);
      errors.push(`${provider.name}: ${msg}`);
    }
  }

  throw new Error(`All providers failed — ${errors.join(" | ")}`);
}

// ---------------------------------------------------------------------------
// Cache-aware stream wrapper: accumulates text and caches after completion
// ---------------------------------------------------------------------------

function wrapWithCache(
  stream: ReadableStream<Uint8Array>,
  cache: ReturnType<typeof getCache>,
  cacheKey: string,
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  let accumulated = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          controller.enqueue(value);
        }
        controller.close();

        if (accumulated.length > 0) {
          cache
            .set(cacheKey, accumulated, { ttl: CACHE_TTL_SECONDS })
            .catch((err) => console.error("Cache write failed:", err));
        }
      } catch (e) {
        controller.error(e);
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

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
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const providers = buildProviders();

    if (providers.length === 0) {
      return new Response(
        "Chưa cấu hình API Key cho AI (vui lòng thêm GEMINI_API_KEY hoặc GROQ_API_KEY vào .env)",
        {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        },
      );
    }

    // Check cache first
    const cache = getCache();
    // Include a fingerprint of systemInstruction so cache is busted when it changes
    const sysHash =
      systemInstruction.length.toString(36) +
      systemInstruction.charCodeAt(0).toString(36) +
      systemInstruction.charCodeAt(systemInstruction.length - 1).toString(36);
    const cacheKey = `ai-llm:${sysHash}:${prompt}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Cache": "HIT",
        },
      });
    }

    // Try providers with fallback
    const { stream, provider } = await tryProviders(providers, prompt);

    // Wrap stream to accumulate + cache response after completion
    const cachedStream = wrapWithCache(stream, cache, cacheKey);

    return new Response(cachedStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        "X-Cache": "MISS",
        "X-Provider": provider,
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
