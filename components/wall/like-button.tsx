"use client";

import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { toggleLike } from "@/app/(public)/the-wall/actions";

/** One like per post per browser, taken back with a second press. While votes are closed, the count alone is shown. */
export function LikeButton({ postId, count, liked, open }: { postId: string; count: number; liked: boolean; open: boolean }) {
  const [state, setState] = useState({ count, liked });
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <span className="inline-flex min-h-10 items-center gap-2 px-1 text-small font-semibold text-jade">
        <Heart aria-hidden className="size-4" strokeWidth={1.75} />
        <span className="tabular">{count}</span>
        <span className="sr-only">j&apos;aime</span>
      </span>
    );
  }

  function press() {
    // screen size and time zone complete the device fingerprint the server uses to hold suspect votes
    const hint = `${window.screen.width}x${window.screen.height}|${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
    startTransition(async () => {
      const result = await toggleLike(postId, hint);
      if (result.ok) {
        setState({ count: result.count, liked: result.liked });
        setMessage("");
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={press}
        disabled={pending}
        aria-pressed={state.liked}
        className={`inline-flex min-h-10 items-center gap-2 border px-4 text-small font-semibold transition-colors duration-150 disabled:cursor-wait disabled:opacity-70 ${
          state.liked ? "border-emerald bg-emerald text-white hover:bg-jade" : "border-jade text-jade hover:bg-mist"
        }`}
      >
        <Heart aria-hidden className="size-4" strokeWidth={1.75} fill={state.liked ? "currentColor" : "none"} />
        J&apos;aime
        <span className="tabular">{state.count}</span>
      </button>
      <span aria-live="polite" className="text-small text-danger empty:hidden">
        {message}
      </span>
    </span>
  );
}
