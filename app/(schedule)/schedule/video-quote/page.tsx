"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@/components/ui";

export default function VideoQuotePage() {
  const searchParams = useSearchParams();
  const title = searchParams.get("title") ?? "Installation estimate";
  const description = searchParams.get("description") ?? "";

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4C9BC8] text-3xl text-white">
            📹
          </div>
          <h1 className="mt-6 text-2xl font-bold text-[#102341]">
            Video call quote
          </h1>
          <p className="mt-2 text-[#102341]/70">
            We have your details and will reach out soon to schedule your video call.
          </p>
        </div>

        <Card className="mt-10 space-y-4">
          <div>
            <p className="text-sm font-medium text-[#102341]/60">Service</p>
            <p className="font-semibold text-[#102341]">{decodeURIComponent(title)}</p>
            {description && (
              <p className="mt-1 text-sm text-[#102341]/70">
                {decodeURIComponent(description)}
              </p>
            )}
          </div>
          <p className="text-sm text-[#102341]/80">
            Video call quote scheduling is coming soon. We&apos;ll contact you to set up a convenient time for your video call.
          </p>
        </Card>

        <div className="mt-10 flex flex-col gap-4">
          <Link href="/pricing">
            <Button variant="outline" fullWidth>
              Back to pricing
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
