export default function Loading() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink pt-40 pb-28 md:pt-48 md:pb-36">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.4)_100%)]" />
        <div className="content-wrap relative z-10">
          <div className="max-w-3xl">
            <div className="h-3 w-56 rounded bg-white/20 animate-pulse" />
            <div className="mt-5 h-12 w-full max-w-xl rounded bg-white/15 animate-pulse" />
            <div className="mt-3 h-12 w-3/4 max-w-lg rounded bg-white/15 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Nosotros text + side images */}
      <section className="py-24">
        <div className="content-wrap">
          <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-16 lg:gap-20">
            <div className="max-w-xl">
              <div className="h-3 w-24 rounded bg-gray-200 animate-pulse" />
              <div className="mt-4 h-10 w-96 max-w-full rounded bg-gray-200 animate-pulse" />
              <div className="mt-10 space-y-3">
                <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-gray-100 animate-pulse" />
                <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
                <div className="h-4 w-4/6 rounded bg-gray-100 animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <div className="aspect-[4/3] rounded-xl bg-gray-200 animate-pulse" />
              <div className="aspect-[4/3] rounded-xl bg-gray-200 animate-pulse" />
              <div className="aspect-[4/3] rounded-xl bg-gray-200 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Pilares */}
      <section className="py-24">
        <div className="content-wrap">
          <div className="mb-14">
            <div className="h-3 w-28 rounded bg-gray-200 animate-pulse" />
            <div className="mt-4 h-10 w-64 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-100 bg-white p-7"
              >
                <div className="h-4 w-48 rounded bg-gray-200 animate-pulse" />
                <div className="mt-4 h-3 w-full rounded bg-gray-100 animate-pulse" />
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
