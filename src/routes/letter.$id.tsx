import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { decodeLetter } from "@/lib/letter";
import { fetchLetter, buildLetterSnapshot, type LetterRecord } from "@/lib/letter-store";
import { LetterView } from "@/components/LetterView";

export const Route = createFileRoute("/letter/$id")({
  component: LetterPage,
  head: () => ({
    meta: [
      { title: "A letter written beneath the same sky" },
      { name: "description", content: "A celestial letter — the moon that hung above a chosen night." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type LoadState =
  | { status: "loading" }
  | { status: "ready"; record: LetterRecord }
  | { status: "notfound" };

/**
 * The letter route only resolves the saved letter, then hands off to the
 * dedicated <LetterView>. It never renders the homepage result screen —
 * the full keepsake experience (scroll → message → moon → year timeline)
 * lives entirely inside LetterView.
 */
function LetterPage() {
  const { id } = Route.useParams();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    (async () => {
      const rec = await fetchLetter(id);
      if (cancelled) return;
      if (rec) { setState({ status: "ready", record: rec }); return; }
      // Backward compatibility: legacy self-contained encoded token.
      const decoded = decodeLetter(id);
      if (decoded) { setState({ status: "ready", record: { payload: decoded, snapshot: buildLetterSnapshot(decoded) } }); return; }
      setState({ status: "notfound" });
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (state.status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <p className="font-display text-xs tracking-[0.3em] text-muted-foreground uppercase">Opening the sky…</p>
      </main>
    );
  }

  if (state.status === "notfound") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div>
          <p className="font-display text-xs tracking-[0.3em] text-muted-foreground uppercase">Letter not found</p>
          <h1 className="mt-3 font-display text-3xl">This letter could not be opened</h1>
          <p className="mt-3 text-sm text-muted-foreground">The link may be incomplete, expired, or mistyped.</p>
          <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Create a Moon Letter</Link>
        </div>
      </main>
    );
  }

  // Remount on id change so the scroll animation always replays from the seal.
  return <LetterView key={id} record={state.record} />;
}
