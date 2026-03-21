import { redirect } from "next/navigation";
import { getHomeHref } from "@/lib/site/hostForSite";

export default async function HomePage() {
  const homeHref = await getHomeHref();
  redirect(homeHref);
}
