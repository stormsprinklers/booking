import Link from "next/link";
import Image from "next/image";
import { Footer } from "@/components/ui";

const homeHref = process.env.NEXT_PUBLIC_SITE === "booking" ? "/booking" : "/pricing";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[#F0F0F0] bg-white">
        <div className="mx-auto flex h-24 max-w-4xl items-center justify-between px-4">
          <Link href={homeHref} className="flex items-center">
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
          <a
            href="tel:801-709-0681"
            className="rounded-lg bg-[#F17388] px-5 py-2.5 text-base font-medium text-white shadow-md hover:bg-[#F17388]/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.15)]"
          >
            801-709-0681
          </a>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
