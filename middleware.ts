import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Subdomain routing: pricing.stormsprinklers.com -> /pricing, schedule.stormsprinklers.com -> /schedule
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const url = request.nextUrl.clone();

  if (host.startsWith("pricing.")) {
    if (!url.pathname.startsWith("/pricing")) {
      url.pathname = `/pricing${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.redirect(url);
    }
  } else if (host.startsWith("schedule.")) {
    if (!url.pathname.startsWith("/schedule")) {
      url.pathname = `/schedule${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next|api|favicon.ico).*)",
};
