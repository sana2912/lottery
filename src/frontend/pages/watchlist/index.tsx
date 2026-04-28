"use client";

import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, MetricCard } from "@/frontend/components";
import { Badge, Button, Card, Input, Label, SectionHeading, Textarea } from "@/frontend/primitives";
import { apiGet, apiPost, apiRequest } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import {
  createWatchlistItemSchema,
  type WatchlistItem,
  type WatchlistReadModel,
  watchlistItemSchema,
  watchlistReadModelSchema
} from "@/schema/app/watchlist.schema";

type WatchlistFormState = {
  note: string;
  number: string;
  tags: string;
};

const defaultFormState: WatchlistFormState = {
  note: "",
  number: "",
  tags: ""
};

export function WatchlistPage() {
  const [formState, setFormState] = useState(defaultFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistReadModel | null>(null);

  const loadWatchlist = useCallback(async () => {
    try {
      const response = await apiGet<WatchlistReadModel>(apiRoutes.watchlist, {
        schema: watchlistReadModelSchema
      });
      setWatchlist(response);
    } catch {
      setError("Unable to load the global watchlist.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadWatchlist();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadWatchlist]);

  async function handleAddItem() {
    setIsSaving(true);
    setError(null);

    const payload = createWatchlistItemSchema.parse({
      note: formState.note || undefined,
      number: formState.number,
      source: "MANUAL",
      tags: formState.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    });

    try {
      const item = await apiPost<WatchlistItem>(apiRoutes.watchlist, payload, {
        schema: watchlistItemSchema
      });
      setWatchlist((current) =>
        current
          ? {
              ...current,
              items: [item, ...current.items]
            }
          : {
              generatedAt: new Date().toISOString(),
              items: [item],
              scope: "global",
              source: "api"
            }
      );
      setFormState(defaultFormState);
    } catch {
      setError("Unable to add this number to the global watchlist.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteItem(id: string) {
    setError(null);

    try {
      await apiRequest(`${apiRoutes.watchlist}/${id}`, { method: "DELETE" });
      setWatchlist((current) =>
        current
          ? {
              ...current,
              items: current.items.filter((item) => item.id !== id)
            }
          : current
      );
    } catch {
      setError("Unable to delete this watchlist item.");
    }
  }

  const items = watchlist?.items ?? [];

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--watchlist)]">
            Global Watchlist
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            Saved numbers for the current MVP workspace
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            This watchlist is shared globally because authentication is not enabled yet. Future auth
            work will scope saved numbers by user.
          </p>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Scope" title="Global preset" />
          <div className="mt-5 grid gap-3">
            <MetricCard
              hint="Items currently returned from /api/watchlist."
              label="Saved numbers"
              tone="watchlist"
              value={String(items.length)}
            />
            <MetricCard
              hint="Temporary no-auth ownership mode."
              label="Scope"
              value={watchlist?.scope ?? "global"}
            />
          </div>
        </Card>
      </section>

      <Card className="p-6">
        <SectionHeading eyebrow="Add number" title="Manual watchlist entry" />
        <div className="mt-5 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
          <div className="space-y-2">
            <Label htmlFor="watchlist-number">Number</Label>
            <Input
              id="watchlist-number"
              onChange={(event) =>
                setFormState((current) => ({ ...current, number: event.target.value }))
              }
              placeholder="09"
              value={formState.number}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="watchlist-note">Note</Label>
            <Textarea
              id="watchlist-note"
              onChange={(event) =>
                setFormState((current) => ({ ...current, note: event.target.value }))
              }
              placeholder="Why this number is being watched"
              value={formState.note}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="watchlist-tags">Tags</Label>
            <Input
              id="watchlist-tags"
              onChange={(event) =>
                setFormState((current) => ({ ...current, tags: event.target.value }))
              }
              placeholder="manual, family"
              value={formState.tags}
            />
          </div>
        </div>
        <div className="mt-5">
          <Button disabled={isSaving || !formState.number} onClick={handleAddItem} type="button">
            {isSaving ? <Loader2 className="animate-spin" /> : <Plus />}
            Add to global watchlist
          </Button>
        </div>
      </Card>

      {error ? (
        <EmptyState description={error} icon={<AlertCircle />} title="Watchlist error" />
      ) : null}

      {isLoading ? (
        <Card className="p-6">
          <p className="text-sm text-[var(--color-text-muted)]">Loading watchlist records...</p>
        </Card>
      ) : null}

      {!isLoading && items.length === 0 ? (
        <EmptyState
          description="Add a number manually or save a generated candidate from Prediction Lab."
          title="No watchlist items"
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card className="p-5" key={item.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-3xl font-bold text-[var(--color-text-primary)]">
                  {item.number}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="watchlist">{item.source}</Badge>
                  <Badge variant="neutral">{item.scope}</Badge>
                </div>
              </div>
              <Button
                aria-label={`Delete ${item.number}`}
                onClick={() => handleDeleteItem(item.id)}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <Trash2 />
              </Button>
            </div>

            {item.note ? (
              <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
                {item.note}
              </p>
            ) : null}

            {item.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <Badge key={`${item.id}-${tag}`} variant="muted">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}

            <p className="mt-4 text-xs text-[var(--color-text-muted)]">
              Updated {new Date(item.updatedAt).toLocaleDateString("th-TH")}
            </p>
          </Card>
        ))}
      </section>
    </main>
  );
}
