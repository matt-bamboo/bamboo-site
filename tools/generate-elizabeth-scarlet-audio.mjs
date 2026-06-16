import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STORY_FILE = path.join(ROOT, "stories", "elizabeth-scarlet", "index.html");
const AUDIO_DIR = path.join(ROOT, "assets", "stories", "elizabeth-scarlet", "audio");
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

async function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env.local");
  try {
    const contents = await fs.readFile(envPath, "utf8");
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
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

function textFromChapter(html, chapterId) {
  if (!/^ch([1-9]|1[0-9]|2[0-5])$/.test(chapterId)) {
    throw new Error(`Unknown chapter: ${chapterId}`);
  }

  const start = html.indexOf(`<section class="chapter" id="${chapterId}">`);
  if (start === -1) throw new Error(`Chapter not found: ${chapterId}`);

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

function splitText(text, maxChars) {
  const paragraphs = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const chunks = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) chunks.push(current);
    if (paragraph.length <= maxChars) {
      current = paragraph;
      continue;
    }
    const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [paragraph];
    current = "";
    for (const sentence of sentences.map((part) => part.trim()).filter(Boolean)) {
      const sentenceNext = current ? `${current} ${sentence}` : sentence;
      if (sentenceNext.length <= maxChars) current = sentenceNext;
      else {
        if (current) chunks.push(current);
        current = sentence;
      }
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

async function renderChunk(text, index, total) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID;
  const elevenUrl = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`);
  elevenUrl.searchParams.set("output_format", process.env.ELEVENLABS_OUTPUT_FORMAT || "mp3_44100_128");

  const response = await fetch(elevenUrl, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
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

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`ElevenLabs failed on chunk ${index}/${total}: ${response.status} ${detail.slice(0, 180)}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  await loadLocalEnv();

  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error("Set ELEVENLABS_API_KEY before generating narration audio.");
  }

  const chapterArg = process.argv.find((arg) => arg.startsWith("--chapter="));
  const force = process.argv.includes("--force");
  const maxChars = envNumber("NARRATION_MAX_CHARS", 4500);
  const requestedChapters = chapterArg
    ? [chapterArg.split("=")[1]]
    : Array.from({ length: 25 }, (_, index) => `ch${index + 1}`);

  await fs.mkdir(AUDIO_DIR, { recursive: true });
  const html = await fs.readFile(STORY_FILE, "utf8");
  const manifest = [];

  for (const chapter of requestedChapters) {
    const output = path.join(AUDIO_DIR, `${chapter}.mp3`);
    try {
      if (!force) {
        await fs.access(output);
        console.log(`${chapter}: already exists`);
        manifest.push({ chapter, file: `${chapter}.mp3`, skipped: true });
        continue;
      }
    } catch {}

    const text = textFromChapter(html, chapter);
    const chunks = splitText(text, maxChars);
    console.log(`${chapter}: rendering ${chunks.length} chunk${chunks.length === 1 ? "" : "s"}`);
    const audio = [];
    for (let index = 0; index < chunks.length; index += 1) {
      audio.push(await renderChunk(chunks[index], index + 1, chunks.length));
    }
    const bytes = Buffer.concat(audio);
    await fs.writeFile(output, bytes);
    manifest.push({ chapter, file: `${chapter}.mp3`, bytes: bytes.length, chunks: chunks.length });
  }

  await fs.writeFile(
    path.join(AUDIO_DIR, "manifest.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), chapters: manifest }, null, 2)}\n`,
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
