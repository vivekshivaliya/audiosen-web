"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { AiAssistantAction, AiAssistantMessage } from "@/lib/ai-assistant";
import { saveAiContactPrefill } from "@/lib/ai-assistant-storage";
import { trackEvent } from "@/lib/analytics";
import { readHearingTestSummary } from "@/lib/hearing-test-storage";

type ChatMessage = AiAssistantMessage & {
  id: string;
};

type AssistantApiResponse = {
  ok: boolean;
  reply?: string;
  suggestedActions?: AiAssistantAction[];
  contactPrefill?: string | null;
  error?: string;
};

const CHAT_SESSION_KEY = "audiosen_ai_chat_messages_v1";
const SUPPORT_PHONE = "+91 8383993592";

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hi, I am Audiosen's hearing care assistant. Ask me about services, hearing aids, rentals, your online screening result, or booking a consultation.",
  },
];

const quickPrompts = [
  "Explain my screening report",
  "Which hearing aid style may suit me?",
  "I want to book a consultation",
];

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return { id, role, content };
}

function readStoredMessages(): ChatMessage[] {
  if (typeof window === "undefined") return initialMessages;

  const raw = window.sessionStorage.getItem(CHAT_SESSION_KEY);
  if (!raw) return initialMessages;

  try {
    const parsed = JSON.parse(raw) as ChatMessage[];
    const valid = parsed.filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    );

    return valid.length > 0 ? valid.slice(-12) : initialMessages;
  } catch {
    return initialMessages;
  }
}

function buildContactPrefill(messages: ChatMessage[], providedPrefill?: string | null): string {
  if (providedPrefill && providedPrefill.trim().length > 0) {
    return providedPrefill.trim();
  }

  const recent = messages
    .filter((message) => message.id !== "welcome")
    .slice(-6)
    .map((message) => `${message.role === "user" ? "Patient" : "Assistant"}: ${message.content}`)
    .join("\n");

  return [
    "Hello Audiosen team,",
    "",
    "I used the Audiosen AI assistant and would like to book a hearing care consultation.",
    recent ? "" : undefined,
    recent ? "Chat summary:" : undefined,
    recent || undefined,
  ]
    .filter(Boolean)
    .join("\n");
}

function getTelHref(): string {
  return `tel:${SUPPORT_PHONE.replace(/\s+/g, "")}`;
}

export function AiPatientAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<AiAssistantAction[]>([]);
  const [lastContactPrefill, setLastContactPrefill] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(readStoredMessages());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(messages.slice(-12)));
  }, [hydrated, messages]);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open, loading]);

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || loading) return;

    const userMessage = createMessage("user", trimmed);
    const nextMessages = [...messages, userMessage].slice(-12);

    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);
    setSuggestedActions([]);
    trackEvent("ai_assistant_message_send", {
      page_path: pathname || "/",
    });

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((message) => message.id !== "welcome")
            .slice(-8)
            .map(({ role, content }) => ({ role, content })),
          currentPath: pathname || "/",
          hearingSummary: readHearingTestSummary(),
        }),
      });

      const payload = (await response.json()) as AssistantApiResponse;

      if (!response.ok || !payload.ok || !payload.reply) {
        setError(payload.error || "The assistant could not reply right now.");
        return;
      }

      const assistantMessage = createMessage("assistant", payload.reply);
      setMessages((current) => [...current, assistantMessage].slice(-12));
      setSuggestedActions(payload.suggestedActions || []);
      setLastContactPrefill(payload.contactPrefill || null);
      trackEvent("ai_assistant_reply", {
        page_path: pathname || "/",
        has_booking_prefill: payload.contactPrefill ? "yes" : "no",
      });
    } catch {
      setError("Network error. Please try again or use the contact form.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleBookConsultation(prefill?: string | null) {
    saveAiContactPrefill(buildContactPrefill(messages, prefill || lastContactPrefill));
    trackEvent("ai_assistant_book_consultation", {
      page_path: pathname || "/",
    });
    setOpen(false);
    window.location.href = "/#contact";
  }

  function handleAction(action: AiAssistantAction) {
    if (action.type === "book") {
      handleBookConsultation(lastContactPrefill || action.message);
      return;
    }

    if (action.type === "call") {
      window.location.href = getTelHref();
      return;
    }

    void sendMessage(action.message);
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[80] flex justify-end sm:left-auto">
      {open ? (
        <section
          aria-label="Audiosen AI patient assistant"
          className="flex max-h-[calc(100vh-7rem)] w-full max-w-[25rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl sm:max-h-[38rem]"
        >
          <header className="border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-200">
                  Audiosen AI
                </p>
                <h2 className="mt-0.5 text-base font-bold">Hearing care assistant</h2>
              </div>
              <button
                type="button"
                aria-label="Close AI assistant"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 text-sm font-bold text-white transition hover:bg-white/10"
              >
                X
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[85%] rounded-2xl bg-sky-700 px-4 py-3 text-sm leading-relaxed text-white"
                      : "mr-auto max-w-[90%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm"
                  }
                >
                  {message.content}
                </div>
              ))}

              {loading ? (
                <div className="mr-auto max-w-[90%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
                  Thinking...
                </div>
              ) : null}

              {error ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
              ) : null}

              <div ref={endRef} />
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {(suggestedActions.length > 0
                ? suggestedActions
                : quickPrompts.map((prompt) => ({
                    label: prompt,
                    message: prompt,
                    type: "ask" as const,
                  }))
              ).map((action) => (
                <button
                  key={`${action.type}-${action.label}`}
                  type="button"
                  disabled={loading}
                  onClick={() => handleAction(action)}
                  className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {action.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <label className="sr-only" htmlFor="ai-assistant-message">
                Ask Audiosen AI
              </label>
              <textarea
                id="ai-assistant-message"
                value={input}
                rows={2}
                maxLength={900}
                disabled={loading}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage(input);
                  }
                }}
                className="min-h-12 flex-1 resize-none rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 disabled:bg-slate-100"
                placeholder="Ask about hearing care..."
              />
              <button
                type="submit"
                disabled={loading || input.trim().length === 0}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-sky-700 px-4 text-sm font-bold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Send
              </button>
            </form>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => handleBookConsultation(lastContactPrefill)}
                className="font-bold text-sky-800 transition hover:text-sky-950"
              >
                Book consultation
              </button>
              <a href={getTelHref()} className="font-bold text-slate-700 transition hover:text-slate-950">
                Call {SUPPORT_PHONE}
              </a>
            </div>
          </div>
        </section>
      ) : (
        <button
          type="button"
          aria-label="Open Audiosen AI assistant"
          onClick={() => {
            setOpen(true);
            trackEvent("ai_assistant_open", {
              page_path: pathname || "/",
            });
          }}
          className="inline-flex min-h-14 items-center gap-3 rounded-full border border-sky-200 bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-slate-900"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-xs">
            AI
          </span>
          Ask Audiosen
        </button>
      )}
    </div>
  );
}
