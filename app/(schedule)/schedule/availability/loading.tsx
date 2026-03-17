export default function AvailabilityLoading() {
  return (
    <div className="min-h-screen animate-pulse bg-white">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="h-10 w-1/2 rounded-lg bg-[#F0F0F0]" />
        <div className="mt-3 h-5 w-3/4 rounded bg-[#F0F0F0]" />
        <div className="mt-10 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="mb-3 h-5 w-24 rounded bg-[#F0F0F0]" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div key={j} className="h-14 rounded-xl bg-[#F0F0F0]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
