import { app, type HttpRequest, type InvocationContext, type Timer } from "@azure/functions";
import {
  evaluateOutboxHealth,
  evaluateOutboxLiveness,
  executeOutboxTimer,
} from "./runtime";

app.timer("processEmailOutbox", {
  schedule: "%EMAIL_OUTBOX_TIMER_SCHEDULE%",
  runOnStartup: false,
  useMonitor: true,
  handler: async (timer: Timer, context: InvocationContext) => {
    await executeOutboxTimer(timer, context);
  },
});

app.http("emailOutboxHealth", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health/outbox",
  handler: async (_request: HttpRequest, context: InvocationContext) => {
    return evaluateOutboxLiveness(context);
  },
});

app.http("emailOutboxReadiness", {
  methods: ["GET"],
  authLevel: "function",
  route: "health/outbox/readiness",
  handler: async (_request: HttpRequest, context: InvocationContext) => {
    return evaluateOutboxHealth(context);
  },
});
