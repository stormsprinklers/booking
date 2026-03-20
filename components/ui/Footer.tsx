import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#F0F0F0] border-t border-[#F0F0F0]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <p className="font-semibold text-[#102341]">Storm Sprinklers</p>
            <p className="mt-1 text-sm text-[#102341]/70">
              Professional sprinkler repair, installation & seasonal service
            </p>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link href="/pricing" className="text-[#102341] hover:text-[#4C9BC8] underline-offset-4 hover:underline">
              Get Pricing
            </Link>
            <Link href="/booking" className="text-[#102341] hover:text-[#4C9BC8] underline-offset-4 hover:underline">
              Book Online
            </Link>
            <span className="text-[#102341]/50">Service areas</span>
            <span className="text-[#102341]/50">Privacy Policy</span>
            <span className="text-[#102341]/50">Terms of Service</span>
          </nav>
        </div>
        <p className="mt-6 text-xs text-[#102341]/50">
          © {new Date().getFullYear()} Storm Sprinklers. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
