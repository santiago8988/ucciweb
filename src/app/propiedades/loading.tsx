export default function Loading() {
  return (
    <div className="pt-20 bg-gray-50/60 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-5 lg:flex-row">
          {/* Sidebar filters — desktop */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 rounded-xl border border-ink/10 bg-white p-4">
              <div className="flex items-center justify-between pb-3">
                <div className="h-3 w-16 rounded bg-gray-200 animate-pulse" />
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border-b border-ink/10 last:border-b-0 py-3">
                  <div className="h-3 w-28 rounded bg-gray-200 animate-pulse" />
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <div className="h-7 w-16 rounded-full bg-gray-100 animate-pulse" />
                    <div className="h-7 w-20 rounded-full bg-gray-100 animate-pulse" />
                    <div className="h-7 w-14 rounded-full bg-gray-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {/* Top bar */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="h-4 w-44 rounded bg-gray-200 animate-pulse" />
              <div className="h-9 w-36 rounded-md bg-gray-200 animate-pulse" />
            </div>

            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-4/3 sm:aspect-auto sm:w-72 sm:shrink-0 bg-gray-200 animate-pulse" />
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="h-7 w-40 rounded bg-gray-200 animate-pulse" />
          <div className="mt-2 h-3 w-24 rounded bg-gray-200 animate-pulse" />
          <div className="mt-4 h-5 w-3/4 rounded bg-gray-100 animate-pulse" />
          <div className="mt-2 h-3 w-full rounded bg-gray-100 animate-pulse" />
          <div className="mt-1.5 h-3 w-5/6 rounded bg-gray-100 animate-pulse" />
          <div className="mt-3 h-3 w-1/3 rounded bg-gray-200 animate-pulse" />
          <div className="mt-auto pt-5 flex flex-wrap gap-3">
            <div className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
            <div className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
            <div className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
            <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
