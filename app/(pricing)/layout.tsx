import { PricingProvider } from "@/contexts/PricingContext";
import { AppShell } from "@/components/AppShell";

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PricingProvider>
      <AppShell>{children}</AppShell>
    </PricingProvider>
  );
}
