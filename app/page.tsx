import { redirect } from "next/navigation";

export default function HomePage() {
  const site = process.env.NEXT_PUBLIC_SITE || "pricing";
  redirect(site === "booking" ? "/booking" : "/pricing");
}
