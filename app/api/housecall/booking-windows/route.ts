import { NextRequest, NextResponse } from "next/server";
import * as hcp from "@/lib/housecallpro/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const employeeId = request.nextUrl.searchParams.get("employee_id");
  if (!employeeId) {
    return NextResponse.json(
      { error: "employee_id is required" },
      { status: 400 }
    );
  }

  try {
    const res = await hcp.getBookingWindows(employeeId, { serviceDurationMinutes: 120 });
    const windows = Array.isArray(res.booking_windows) ? res.booking_windows : res.booking_windows ?? [];

    return NextResponse.json({ bookingWindows: windows });
  } catch (err) {
    console.error("Booking windows fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
