import { LoadingSkeleton } from "@/frontend/components";

export default function UserLoading() {
  return (
    <main className="space-y-6">
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-[70] h-1 overflow-hidden bg-[var(--color-bg-brand-soft)]"
      >
        <div className="h-full w-2/3 animate-pulse bg-[var(--color-brand)] shadow-[0_0_18px_rgba(249,115,22,0.35)]" />
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <LoadingSkeleton className="min-h-64 p-6 md:p-8" lines={4} />
        <LoadingSkeleton className="min-h-64 p-6" lines={3} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <LoadingSkeleton lines={2} />
        <LoadingSkeleton lines={2} />
        <LoadingSkeleton lines={2} />
        <LoadingSkeleton lines={2} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <LoadingSkeleton className="min-h-80" lines={6} variant="table" />
        <LoadingSkeleton className="min-h-80" variant="chart" />
      </section>
    </main>
  );
}
