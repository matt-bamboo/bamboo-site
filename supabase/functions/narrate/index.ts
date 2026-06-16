const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
const DEFAULT_STORY_URL = "https://bamboo.holdings/stories/elizabeth-scarlet/";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("NARRATION_ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function textFromChapter(html: string, chapterId: string): string {
  if (!/^ch([1-9]|1[0-9]|2[0-5])$/.test(chapterId)) {
    throw new Error("Unknown chapter.");
  }

  const start = html.indexOf(`<section class="chapter" id="${chapterId}">`);
  if (start === -1) throw new Error("Chapter not found.");

  const next = html.indexOf('<section class="chapter"', start + 1);
  const mainEnd = html.indexOf("</main>", start);
  const section = html.slice(start, next === -1 ? mainEnd : next);
  const heading = section.match(/<h2>([\s\S]*?)<\/h2>/)?.[1] || "";
  const paragraphs = [...section.matchAll(/<p([^>]*)>([\s\S]*?)<\/p>/g)]
    .filter((match) => !/scenebreak/i.test(match[1]))
    .map((match) => match[2])
    .filter((text) => !/^\s*ROYAL DETECTIVE HEADQUARTERS\s*$/i.test(text))
    .map((text) => text.replace(/<[^>]*>/g, " "))
    .map((text) => decodeHtml(text).replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return [`Chapter ${chapterId.replace("ch", "")}: ${decodeHtml(heading)}`, ...paragraphs].join("\n\n");
}

function envNumber(name: string, fallback: number): number {
  const value = Number(Deno.env.get(name));
  return Number.isFinite(value) ? value : fallback;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Use GET." }, 405);

  const url = new URL(req.url);
  const apiKey = Deno.env.get("ELEVENLABS_API_KEY");

  if (url.searchParams.get("probe") === "1") {
    if (!apiKey) return json({ ready: false, error: "Narration is not configured." }, 500);
    return json({ ready: true, provider: "elevenlabs", mode: "stream" });
  }

  if (!apiKey) return json({ error: "Narration is not configured." }, 500);

  try {
    const chapter = url.searchParams.get("chapter") || "ch1";
    const storyUrl = Deno.env.get("STORY_PAGE_URL") || DEFAULT_STORY_URL;
    const storyResponse = await fetch(storyUrl, { headers: { Accept: "text/html" } });
    if (!storyResponse.ok) throw new Error("Story page could not be loaded.");

    const html = await storyResponse.text();
    const maxChars = envNumber("NARRATION_MAX_CHARS", 9500);
    const text = textFromChapter(html, chapter).slice(0, maxChars);
    const voiceId = Deno.env.get("ELEVENLABS_VOICE_ID") || DEFAULT_VOICE_ID;
    const modelId = Deno.env.get("ELEVENLABS_MODEL_ID") || DEFAULT_MODEL_ID;
    const elevenUrl = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`);
    elevenUrl.searchParams.set("output_format", Deno.env.get("ELEVENLABS_OUTPUT_FORMAT") || "mp3_44100_128");

    const elevenResponse = await fetch(elevenUrl, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: envNumber("ELEVENLABS_STABILITY", 0.46),
          similarity_boost: envNumber("ELEVENLABS_SIMILARITY_BOOST", 0.82),
          style: envNumber("ELEVENLABS_STYLE", 0.34),
          use_speaker_boost: true,
        },
      }),
    });

    if (!elevenResponse.ok || !elevenResponse.body) {
      const detail = await elevenResponse.text().catch(() => "");
      return json({ error: "ElevenLabs narration failed.", detail: detail.slice(0, 240) }, elevenResponse.status || 502);
    }

    return new Response(elevenResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Narration failed.";
    return json({ error: message }, 500);
  }
});
