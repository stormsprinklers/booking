export default function PricingLoading() {
  return (
    <div className="min-h-screen animate-pulse bg-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="h-10 w-3/4 rounded-lg bg-[#F0F0F0]" />
        <div className="mt-3 h-5 w-1/2 rounded bg-[#F0F0F0]" />
        <div className="mt-12 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-[#F0F0F0]" />
          ))}
        </div>
      </div>
    </div>
  );
}
