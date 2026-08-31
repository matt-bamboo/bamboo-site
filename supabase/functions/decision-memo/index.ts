import { handleOpenAiAction } from "../_shared/job-command-center-ai.ts";

Deno.serve((req) => handleOpenAiAction(req, "decision-memo"));
