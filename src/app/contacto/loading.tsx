export default function Loading() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink pt-36 pb-24 md:pt-44 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <div className="h-12 w-64 rounded bg-white/15 animate-pulse" />
            <div className="mt-5 h-5 w-full max-w-xl rounded bg-white/10 animate-pulse" />
            <div className="mt-2 h-5 w-5/6 max-w-lg rounded bg-white/10 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Info cards */}
      <section className="relative -mt-14 z-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-6 shadow-lg border border-ink/5"
              >
                <div className="h-10 w-10 rounded-lg bg-gray-200 animate-pulse" />
                <div className="mt-4 h-3 w-20 rounded bg-gray-200 animate-pulse" />
                <div className="mt-3 h-4 w-full rounded bg-gray-100 animate-pulse" />
                <div className="mt-2 h-3 w-3/4 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 max-w-2xl">
            <div className="h-3 w-32 rounded bg-gray-200 animate-pulse" />
            <div className="mt-4 h-10 w-96 max-w-full rounded bg-gray-200 animate-pulse" />
            <div className="mt-6 h-4 w-full rounded bg-gray-100 animate-pulse" />
            <div className="mt-1.5 h-4 w-5/6 rounded bg-gray-100 animate-pulse" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-2xl border border-ink/10 bg-white p-7"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gray-200" />
                <div className="h-6 w-48 rounded bg-gray-200 animate-pulse" />
                <div className="mt-3 h-3 w-full rounded bg-gray-100 animate-pulse" />
                <div className="mt-1.5 h-3 w-5/6 rounded bg-gray-100 animate-pulse" />
                <div className="mt-6 space-y-2">
                  <div className="h-12 w-full rounded-xl bg-gray-100 animate-pulse" />
                  <div className="h-12 w-full rounded-xl bg-gray-200 animate-pulse" />
                  <div className="h-12 w-full rounded-xl bg-gray-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visitanos */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 overflow-hidden rounded-3xl border border-ink/10 bg-sand-soft/40 lg:grid-cols-2">
            <div className="p-10 lg:p-14">
              <div className="h-3 w-24 rounded bg-gray-200 animate-pulse" />
              <div className="mt-4 h-10 w-56 rounded bg-gray-200 animate-pulse" />
              <div className="mt-3 h-4 w-44 rounded bg-gray-100 animate-pulse" />
              <div className="mt-8 h-4 w-52 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="relative min-h-[340px] lg:min-h-full bg-gray-200 animate-pulse" />
          </div>
        </div>
      </section>
    </div>
  );
}
