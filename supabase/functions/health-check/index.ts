import { handleHealthCheck } from "../_shared/job-command-center-ai.ts";

Deno.serve((req) => handleHealthCheck(req));
