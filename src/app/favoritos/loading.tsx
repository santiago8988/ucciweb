export default function Loading() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink pt-36 pb-20 md:pt-44 md:pb-24">
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand/10 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="h-3 w-28 rounded bg-white/20 animate-pulse" />
          <div className="mt-5 h-12 w-full max-w-md rounded bg-white/15 animate-pulse" />
          <div className="mt-6 h-4 w-full max-w-xl rounded bg-white/10 animate-pulse" />
          <div className="mt-2 h-4 w-5/6 max-w-lg rounded bg-white/10 animate-pulse" />
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-white border border-gray-100">
      <div className="aspect-[3/2] bg-gray-200 animate-pulse" />
      <div className="p-5">
        <div className="h-6 w-32 rounded bg-gray-200 animate-pulse" />
        <div className="mt-3 flex gap-3">
          <div className="h-3.5 w-10 rounded bg-gray-100 animate-pulse" />
          <div className="h-3.5 w-10 rounded bg-gray-100 animate-pulse" />
          <div className="h-3.5 w-14 rounded bg-gray-100 animate-pulse" />
        </div>
        <div className="mt-3 h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
        <div className="mt-2 h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}
