import Link from "next/link";
import Image from "next/image";
import { Footer } from "@/components/ui";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[#F0F0F0] bg-white">
        <div className="mx-auto flex h-24 max-w-4xl items-center justify-between px-4">
          <Link href="/pricing" className="flex items-center">
            <Image
              src="/storm-logo.png"
              alt="Storm Sprinklers - Repair & Installation"
              width={360}
              height={96}
              className="h-24 w-auto object-contain"
              priority
              unoptimized
            />
          </Link>
          <nav className="flex gap-6 text-sm">
            <Link
              href="/pricing"
              className="text-[#102341]/70 hover:text-[#102341]"
            >
              Get Pricing
            </Link>
            <Link
              href="/schedule"
              className="text-[#102341]/70 hover:text-[#102341]"
            >
              Book Online
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
