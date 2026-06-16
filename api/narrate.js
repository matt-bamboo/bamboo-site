const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");

const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
const STORY_FILE = path.join(process.cwd(), "stories", "elizabeth-scarlet", "index.html");

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function decodeHtml(value) {
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

function textFromChapter(chapterId) {
  if (!/^ch([1-9]|1[0-9]|2[0-5])$/.test(chapterId)) {
    throw new Error("Unknown chapter.");
  }

  const html = fs.readFileSync(STORY_FILE, "utf8");
  const start = html.indexOf(`<section class="chapter" id="${chapterId}">`);
  if (start === -1) throw new Error("Chapter not found.");

  const next = html.indexOf('<section class="chapter"', start + 1);
  const section = html.slice(start, next === -1 ? html.indexOf("</main>", start) : next);
  const heading = section.match(/<h2>([\s\S]*?)<\/h2>/)?.[1] || "";
  const paragraphs = [...section.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
    .map(match => match[1])
    .filter(text => !/scenebreak|^\s*ROYAL DETECTIVE HEADQUARTERS\s*$/i.test(text))
    .map(text => text.replace(/<[^>]*>/g, " "))
    .map(text => decodeHtml(text).replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return [`Chapter ${chapterId.replace("ch", "")}: ${decodeHtml(heading)}`, ...paragraphs].join("\n\n");
}

module.exports = async function narrate(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.NARRATION_ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Use GET." });
    return;
  }
  if (req.query.probe === "1") {
    if (!process.env.ELEVENLABS_API_KEY) {
      sendJson(res, 500, { ready: false, error: "Narration is not configured." });
      return;
    }
    sendJson(res, 200, { ready: true, provider: "elevenlabs", mode: "stream" });
    return;
  }
  if (!process.env.ELEVENLABS_API_KEY) {
    sendJson(res, 500, { error: "Narration is not configured." });
    return;
  }

  try {
    const chapter = String(req.query.chapter || "ch1");
    const text = textFromChapter(chapter).slice(0, Number(process.env.NARRATION_MAX_CHARS || 9500));
    const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
    const modelId = process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID;
    const elevenUrl = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`);
    elevenUrl.searchParams.set("output_format", process.env.ELEVENLABS_OUTPUT_FORMAT || "mp3_44100_128");

    const elevenResponse = await fetch(elevenUrl, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg"
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: Number(process.env.ELEVENLABS_STABILITY || 0.46),
          similarity_boost: Number(process.env.ELEVENLABS_SIMILARITY_BOOST || 0.82),
          style: Number(process.env.ELEVENLABS_STYLE || 0.34),
          use_speaker_boost: true
        }
      })
    });

    if (!elevenResponse.ok || !elevenResponse.body) {
      const errorText = await elevenResponse.text().catch(() => "");
      sendJson(res, elevenResponse.status || 502, {
        error: "ElevenLabs narration failed.",
        detail: errorText.slice(0, 240)
      });
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    Readable.fromWeb(elevenResponse.body).pipe(res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Narration failed." });
  }
};
