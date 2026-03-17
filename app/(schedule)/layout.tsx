import { BookingProvider } from "@/contexts/BookingContext";
import { AppShell } from "@/components/AppShell";

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BookingProvider>
      <AppShell>{children}</AppShell>
    </BookingProvider>
  );
}
