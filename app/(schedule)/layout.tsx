import { BookingProvider } from "@/contexts/BookingContext";
import { AppShell } from "@/components/AppShell";
import { getHomeHref } from "@/lib/site/hostForSite";

export default async function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const homeHref = await getHomeHref();
  return (
    <BookingProvider>
      <AppShell homeHref={homeHref}>{children}</AppShell>
    </BookingProvider>
  );
}
