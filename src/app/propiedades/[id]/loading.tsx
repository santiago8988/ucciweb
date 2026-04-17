export default function Loading() {
  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Back */}
        <div className="mb-4 h-9 w-48 rounded-md bg-gray-200 animate-pulse" />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Gallery */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-200 animate-pulse" />
            <div className="mt-3 grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-md bg-gray-200 animate-pulse"
                />
              ))}
            </div>

            {/* Title block */}
            <div className="mt-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="h-6 w-20 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-6 w-24 rounded-full bg-gray-100 animate-pulse" />
                <div className="h-6 w-28 rounded-full bg-gray-100 animate-pulse" />
              </div>
              <div className="h-8 w-3/4 rounded bg-gray-200 animate-pulse" />
              <div className="mt-3 h-4 w-1/2 rounded bg-gray-100 animate-pulse" />
              <div className="mt-5 flex items-center justify-between">
                <div className="h-10 w-44 rounded bg-gray-200 animate-pulse" />
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
              </div>
            </div>

            <div className="my-6 h-px bg-gray-100" />

            {/* Features grid */}
            <div className="h-6 w-40 rounded bg-gray-200 animate-pulse mb-4" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
                >
                  <div className="h-5 w-5 rounded bg-gray-200 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
                    <div className="mt-1.5 h-4 w-16 rounded bg-gray-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            <div className="my-6 h-px bg-gray-100" />

            {/* Description */}
            <div className="h-6 w-36 rounded bg-gray-200 animate-pulse mb-4" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
              <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
              <div className="h-4 w-11/12 rounded bg-gray-100 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-gray-100 animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
            </div>
          </div>

          {/* Sidebar — contact card */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="h-5 w-40 rounded bg-gray-200 animate-pulse" />
              <div className="mt-2 h-3 w-56 rounded bg-gray-100 animate-pulse" />
              <div className="mt-6 space-y-3">
                <div className="h-12 w-full rounded-xl bg-gray-200 animate-pulse" />
                <div className="h-12 w-full rounded-xl bg-gray-100 animate-pulse" />
              </div>
              <div className="my-6 h-px bg-gray-100" />
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
                  <div className="mt-1.5 h-3 w-24 rounded bg-gray-100 animate-pulse" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
