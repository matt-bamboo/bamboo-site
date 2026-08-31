import { handleGeminiAction } from "../_shared/job-command-center-ai.ts";

Deno.serve((req) => handleGeminiAction(req, "gemini-document-quality-check"));
