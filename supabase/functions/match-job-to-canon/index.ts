import { handleWorkflowAction } from "../_shared/job-command-center-ai.ts";

Deno.serve((req) => handleWorkflowAction(req, "match-job-to-canon"));
