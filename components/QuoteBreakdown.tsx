import type { QuoteLineItem } from "@/lib/types";

interface QuoteBreakdownProps {
  lineItems: QuoteLineItem[];
  totalMin: number;
  totalMax: number;
  className?: string;
}

function formatRange(min: number, max: number): string {
  if (min === max) return `$${min}`;
  return `$${min}–$${max}`;
}

export function QuoteBreakdown({ lineItems, totalMin, totalMax, className = "" }: QuoteBreakdownProps) {
  if (!lineItems.length) return null;

  return (
    <div className={`space-y-1 text-sm ${className}`}>
      {lineItems.map((item, i) => (
        <div key={i} className="flex justify-between text-[#102341]/90">
          <span>{item.label}</span>
          <span className="font-medium tabular-nums">{formatRange(item.min, item.max)}</span>
        </div>
      ))}
      <div className="flex justify-between border-t border-[#E2E8F0] pt-2 font-semibold text-[#102341]">
        <span>Total</span>
        <span className="tabular-nums">{formatRange(totalMin, totalMax)}</span>
      </div>
    </div>
  );
}
