"use client";

import { useEffect } from "react";

export function ConsumeThankYouContext() {
  useEffect(() => {
    void fetch("/api/thank-you/consume", {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-Audiosen-Context": "consume" },
    });
  }, []);

  return null;
}
