"use client";

import { AlertCircle, Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, MetricCard } from "@/frontend/components";
import { watchlistContent } from "@/frontend/pages/watchlist/watchlist.content";
import {
  defaultWatchlistFormState,
  toCreateWatchlistPayload,
  toUpdateWatchlistPayload,
  type WatchlistEditState
} from "@/frontend/pages/watchlist/watchlist.mappers";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  SectionHeading,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea
} from "@/frontend/primitives";
import { apiGet, apiPost, apiRequest } from "@/lib/api/http";
import { apiRoutes } from "@/lib/api/routes";
import {
  createWatchlistItemSchema,
  deleteWatchlistItemResponseSchema,
  updateWatchlistItemSchema,
  type WatchlistItem,
  type WatchlistReadModel,
  type WatchlistSource,
  watchlistItemSchema,
  watchlistReadModelSchema
} from "@/schema/app/watchlist.schema";

export function WatchlistPage() {
  const [formState, setFormState] = useState(defaultWatchlistFormState);
  const [editState, setEditState] = useState<WatchlistEditState | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistReadModel | null>(null);

  const loadWatchlist = useCallback(async () => {
    try {
      const response = await apiGet<WatchlistReadModel>(apiRoutes.watchlist, {
        schema: watchlistReadModelSchema
      });
      setWatchlist(response);
    } catch {
      setError(watchlistContent.errorMessages.loadFailed);
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

    const payload = createWatchlistItemSchema.parse(toCreateWatchlistPayload(formState));

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
      setFormState(defaultWatchlistFormState);
    } catch {
      setError(watchlistContent.errorMessages.addFailed);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteItem(id: string) {
    setError(null);

    try {
      await apiRequest(`${apiRoutes.watchlist}/${id}`, {
        method: "DELETE",
        schema: deleteWatchlistItemResponseSchema
      });
      setWatchlist((current) =>
        current
          ? {
              ...current,
              items: current.items.filter((item) => item.id !== id)
            }
          : current
      );
    } catch {
      setError(watchlistContent.errorMessages.deleteFailed);
    }
  }

  function handleStartEditing(item: WatchlistItem) {
    setEditingItemId(item.id);
    setEditState({
      note: item.note ?? "",
      source: item.source,
      tags: item.tags.join(", ")
    });
  }

  function handleCancelEditing() {
    setEditingItemId(null);
    setEditState(null);
  }

  async function handleUpdateItem(item: WatchlistItem) {
    if (!editState) {
      return;
    }

    setUpdatingItemId(item.id);
    setError(null);

    const payload = updateWatchlistItemSchema.parse(toUpdateWatchlistPayload(editState));

    try {
      const updatedItem = await apiRequest<WatchlistItem>(`${apiRoutes.watchlist}/${item.id}`, {
        json: payload,
        method: "PATCH",
        schema: watchlistItemSchema
      });

      setWatchlist((current) =>
        current
          ? {
              ...current,
              items: current.items.map((entry) => (entry.id === item.id ? updatedItem : entry))
            }
          : current
      );
      handleCancelEditing();
    } catch {
      setError(watchlistContent.errorMessages.updateFailed);
    } finally {
      setUpdatingItemId(null);
    }
  }

  const items = watchlist?.items ?? [];

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--watchlist)]">
            {watchlistContent.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-normal text-[var(--color-text-primary)]">
            {watchlistContent.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            {watchlistContent.hero.description}
          </p>
        </Card>

        <Card className="p-6">
          <SectionHeading
            eyebrow={watchlistContent.sections.scope.eyebrow}
            title={watchlistContent.sections.scope.title}
          />
          <div className="mt-5 grid gap-3">
            <MetricCard
              hint={watchlistContent.metrics.savedNumbers.hint}
              label={watchlistContent.metrics.savedNumbers.label}
              tone="watchlist"
              value={String(items.length)}
            />
            <MetricCard
              hint={watchlistContent.metrics.statCoverage.hint}
              label={watchlistContent.metrics.statCoverage.label}
              value={String(items.filter((item) => item.stats).length)}
            />
            <MetricCard
              hint={watchlistContent.metrics.scope.hint}
              label={watchlistContent.metrics.scope.label}
              value={watchlist?.scope ?? "global"}
            />
          </div>
        </Card>
      </section>

      <Card className="p-6">
        <SectionHeading
          eyebrow={watchlistContent.sections.addNumber.eyebrow}
          title={watchlistContent.sections.addNumber.title}
          description={watchlistContent.sections.addNumber.description}
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
          <div className="space-y-2">
            <Label htmlFor="watchlist-number">{watchlistContent.fields.number.label}</Label>
            <Input
              id="watchlist-number"
              onChange={(event) =>
                setFormState((current) => ({ ...current, number: event.target.value }))
              }
              placeholder={watchlistContent.fields.number.placeholder}
              value={formState.number}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="watchlist-note">{watchlistContent.fields.note.label}</Label>
            <Textarea
              id="watchlist-note"
              onChange={(event) =>
                setFormState((current) => ({ ...current, note: event.target.value }))
              }
              placeholder={watchlistContent.fields.note.placeholder}
              value={formState.note}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="watchlist-tags">{watchlistContent.fields.tags.label}</Label>
            <Input
              id="watchlist-tags"
              onChange={(event) =>
                setFormState((current) => ({ ...current, tags: event.target.value }))
              }
              placeholder={watchlistContent.fields.tags.placeholder}
              value={formState.tags}
            />
          </div>
        </div>
        <div className="mt-5">
          <Button disabled={isSaving || !formState.number} onClick={handleAddItem} type="button">
            {isSaving ? <Loader2 className="animate-spin" /> : <Plus />}
            {watchlistContent.actions.addButton}
          </Button>
        </div>
      </Card>

      {error ? (
        <EmptyState
          description={error}
          icon={<AlertCircle />}
          title={watchlistContent.emptyStates.error.title}
        />
      ) : null}

      {isLoading ? (
        <Card className="p-6">
          <p className="text-sm text-[var(--color-text-muted)]">
            {watchlistContent.emptyStates.loading}
          </p>
        </Card>
      ) : null}

      {!isLoading && items.length === 0 ? (
        <EmptyState
          description={watchlistContent.emptyStates.empty.description}
          title={watchlistContent.emptyStates.empty.title}
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
              <div className="flex items-center gap-1">
                <Button
                  aria-label={`${watchlistContent.fields.startEditAriaLabel} ${item.number}`}
                  onClick={() => handleStartEditing(item)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Pencil />
                </Button>
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
            </div>

            {editingItemId === item.id && editState ? (
              <div className="mt-4 space-y-4 border-t border-[var(--color-border-soft)] pt-4">
                <div className="space-y-2">
                  <Label htmlFor={`watchlist-note-${item.id}`}>
                    {watchlistContent.fields.note.label}
                  </Label>
                  <Textarea
                    id={`watchlist-note-${item.id}`}
                    onChange={(event) =>
                      setEditState((current) =>
                        current
                          ? {
                              ...current,
                              note: event.target.value
                            }
                          : current
                      )
                    }
                    placeholder={watchlistContent.fields.note.placeholder}
                    value={editState.note}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
                  <div className="space-y-2">
                    <Label htmlFor={`watchlist-tags-${item.id}`}>
                      {watchlistContent.fields.tags.label}
                    </Label>
                    <Input
                      id={`watchlist-tags-${item.id}`}
                      onChange={(event) =>
                        setEditState((current) =>
                          current
                            ? {
                                ...current,
                                tags: event.target.value
                              }
                            : current
                        )
                      }
                      placeholder={watchlistContent.fields.tags.placeholder}
                      value={editState.tags}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`watchlist-source-${item.id}`}>
                      {watchlistContent.fields.source.label}
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        setEditState((current) =>
                          current
                            ? {
                                ...current,
                                source: value as WatchlistSource
                              }
                            : current
                        )
                      }
                      value={editState.source}
                    >
                      <SelectTrigger className="h-11 w-full" id={`watchlist-source-${item.id}`}>
                        <SelectValue placeholder={watchlistContent.fields.source.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {watchlistContent.sourceOptions.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={updatingItemId === item.id}
                    onClick={() => void handleUpdateItem(item)}
                    type="button"
                  >
                    {updatingItemId === item.id ? <Loader2 className="animate-spin" /> : <Check />}
                    {watchlistContent.actions.saveChanges}
                  </Button>
                  <Button onClick={handleCancelEditing} type="button" variant="outline">
                    <X />
                    {watchlistContent.actions.cancel}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {item.stats ? (
                  <div className="mt-4 grid gap-3 border-t border-[var(--color-border-soft)] pt-4 sm:grid-cols-2">
                    <div className="rounded-none bg-[var(--color-bg-subtle)] p-3">
                      <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                        {watchlistContent.statSummary.prizeTypeLabel}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">
                        {item.stats.prizeType}
                      </p>
                    </div>
                    <div className="rounded-none bg-[var(--color-bg-subtle)] p-3">
                      <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                        {watchlistContent.statSummary.frequencyLabel}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">
                        {item.stats.frequencyPercent}%
                      </p>
                    </div>
                    <div className="rounded-none bg-[var(--color-bg-subtle)] p-3">
                      <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                        {watchlistContent.statSummary.hitsLabel}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">
                        {item.stats.hitCount}
                      </p>
                    </div>
                    <div className="rounded-none bg-[var(--color-bg-subtle)] p-3">
                      <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                        {watchlistContent.statSummary.missingLabel}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">
                        {item.stats.missingDrawCount}
                      </p>
                    </div>
                    <div className="rounded-none bg-[var(--color-bg-subtle)] p-3 sm:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                        {watchlistContent.statSummary.lastSeenLabel}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">
                        {item.stats.lastSeenDrawDate
                          ? new Date(item.stats.lastSeenDrawDate).toLocaleDateString("th-TH")
                          : "-"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 border-t border-[var(--color-border-soft)] pt-4 text-sm leading-6 text-[var(--color-text-muted)]">
                    {watchlistContent.statSummary.unavailable}
                  </p>
                )}

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
              </>
            )}

            <p className="mt-4 text-xs text-[var(--color-text-muted)]">
              {watchlistContent.updatedLabel} {new Date(item.updatedAt).toLocaleDateString("th-TH")}
            </p>
          </Card>
        ))}
      </section>
    </main>
  );
}
