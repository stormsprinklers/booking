import { PricingProvider } from "@/contexts/PricingContext";
import { AppShell } from "@/components/AppShell";
import { getHomeHref } from "@/lib/site/hostForSite";

export default async function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const homeHref = await getHomeHref();
  return (
    <PricingProvider>
      <AppShell homeHref={homeHref}>{children}</AppShell>
    </PricingProvider>
  );
}
