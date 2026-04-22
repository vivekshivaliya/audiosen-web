"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  eventName: string;
  eventLabel: string;
};

type WindowWithGtag = Window & {
  gtag?: (...args: unknown[]) => void;
};

export function TrackedLink({
  eventName,
  eventLabel,
  onClick,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        const browserWindow = window as WindowWithGtag;
        browserWindow.gtag?.("event", eventName, {
          event_category: "lead",
          event_label: eventLabel,
        });
        onClick?.(event);
      }}
    />
  );
}
