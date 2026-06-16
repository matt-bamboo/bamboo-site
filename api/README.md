# Read To Me Narration

The story reader supports two narration modes.

## Fastest publish path: static audio

Generate the ElevenLabs chapter MP3s once and publish them with the site:

```sh
ELEVENLABS_API_KEY=... node tools/generate-elizabeth-scarlet-audio.mjs
```

The files are written to:

```text
assets/stories/elizabeth-scarlet/audio/ch1.mp3
assets/stories/elizabeth-scarlet/audio/ch2.mp3
...
```

GitHub Pages can serve those audio files directly. This avoids Supabase or
Google Cloud for the first launch, keeps the API key out of the browser, and
still lets the player highlight and scroll as audio plays.

Optional generator settings:

- `ELEVENLABS_VOICE_ID`
- `ELEVENLABS_MODEL_ID`
- `ELEVENLABS_OUTPUT_FORMAT`
- `ELEVENLABS_STABILITY`
- `ELEVENLABS_SIMILARITY_BOOST`
- `ELEVENLABS_STYLE`
- `NARRATION_MAX_CHARS`

## Optional live API path

If live generation is preferred later, set this before the page's narration
script runs:

```html
<script>
  window.STORY_NARRATION_ENDPOINT = "https://your-function-url/narrate";
</script>
```

The included `/api/narrate.js` handler is for a serverless Node host. The
included `supabase/functions/narrate/index.ts` function is for Supabase Edge
Functions.

GitHub Pages cannot run the live ElevenLabs proxy because it is static hosting.
GitHub can host the story and the prebuilt MP3s, but the private API key must
stay in a server function if audio is generated live.

Google Cloud Run is a good live option because it can keep secrets in server
environment variables and stream the ElevenLabs response back to the browser.
It still requires a billing account, and usage above the free tier is billed.

Required server environment variable:

- `ELEVENLABS_API_KEY`

Optional server environment variables:

- `ELEVENLABS_VOICE_ID`
- `ELEVENLABS_MODEL_ID`
- `ELEVENLABS_OUTPUT_FORMAT`
- `NARRATION_ALLOWED_ORIGIN`
- `NARRATION_MAX_CHARS`
- `STORY_PAGE_URL`

Do not put the ElevenLabs key in `stories/elizabeth-scarlet/index.html`.
