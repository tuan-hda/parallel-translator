import { getCache } from "@vercel/functions";

export const config = {
  runtime: "edge",
};

const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Missing text in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Initialize Vercel Runtime Cache API
    const cache = getCache();
    const cacheKey = `en-vi:${text}`;

    // Return cached response if available
    const cached = await cache.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }

    const azureKey = process.env.AZURE_TRANSLATOR_KEY;
    const azureRegion = process.env.AZURE_TRANSLATOR_REGION;

    if (!azureKey || !azureRegion) {
      console.error(
        "Missing Azure Translator credentials in environment variables.",
      );
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const response = await fetch(
      "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=vi",
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": azureKey,
          "Ocp-Apim-Subscription-Region": azureRegion,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ text }]),
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Azure Translator API error:", response.status, errorData);
      return new Response(
        JSON.stringify({ error: "Failed to translate text" }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();
    const responseBody = JSON.stringify(data);

    // Store in Runtime Cache with TTL
    await cache.set(cacheKey, responseBody, { ttl: CACHE_TTL_SECONDS });

    return new Response(responseBody, {
      status: 200,
      headers: { "Content-Type": "application/json", "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("Error in translate API:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
