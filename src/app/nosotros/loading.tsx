export default function Loading() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink pt-40 pb-28 md:pt-48 md:pb-36">
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="h-3 w-36 rounded bg-white/20 animate-pulse" />
            <div className="mt-5 h-12 w-full max-w-xl rounded bg-white/15 animate-pulse" />
            <div className="mt-3 h-12 w-3/4 max-w-lg rounded bg-white/15 animate-pulse" />
            <div className="mt-8 h-4 w-full max-w-2xl rounded bg-white/10 animate-pulse" />
            <div className="mt-2 h-4 w-5/6 max-w-xl rounded bg-white/10 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="py-10 text-center">
                <div className="mx-auto h-9 w-16 rounded bg-gray-200 animate-pulse" />
                <div className="mx-auto mt-3 h-3 w-28 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-24 bg-gray-50/50">
        <div className="container mx-auto px-4">
          <div className="mb-14">
            <div className="h-3 w-28 rounded bg-gray-200 animate-pulse" />
            <div className="mt-4 h-10 w-96 max-w-full rounded bg-gray-200 animate-pulse" />
            <div className="mt-6 h-4 w-full max-w-2xl rounded bg-gray-100 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[240px]">
            <div className="col-span-2 row-span-2 rounded-xl bg-gray-200 animate-pulse" />
            <div className="rounded-xl bg-gray-200 animate-pulse" />
            <div className="rounded-xl bg-gray-200 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mb-14">
            <div className="h-3 w-28 rounded bg-gray-200 animate-pulse" />
            <div className="mt-4 h-10 w-64 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-100 bg-white p-7"
              >
                <div className="mb-5 h-12 w-12 rounded-lg bg-gray-200 animate-pulse" />
                <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
                <div className="mt-3 h-3 w-full rounded bg-gray-100 animate-pulse" />
                <div className="mt-1.5 h-3 w-5/6 rounded bg-gray-100 animate-pulse" />
                <div className="mt-1.5 h-3 w-3/4 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
