import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import * as hcp from "@/lib/housecallpro/client";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 500 }
      );
    }
    if (!process.env.HOUSECALLPRO_API_KEY) {
      return NextResponse.json(
        { error: "HOUSECALLPRO_API_KEY not configured" },
        { status: 500 }
      );
    }

    const errors: string[] = [];
    const employeesRes = await hcp.getEmployees().catch((e) => {
      errors.push(`Employees: ${e instanceof Error ? e.message : String(e)}`);
      return { employees: [] };
    });
    const serviceZonesRes = await hcp.getServiceZones().catch((e) => {
      errors.push(`Service zones: ${e instanceof Error ? e.message : String(e)}`);
      return { service_zones: [] };
    });
    const customersRes = await hcp.getCustomers({ per_page: 100 }).catch((e) => {
      errors.push(`Customers: ${e instanceof Error ? e.message : String(e)}`);
      return { customers: [] };
    });

    const employees = employeesRes.employees;
    const zones = serviceZonesRes.service_zones;
    const customers = customersRes.customers;

    for (const e of employees) {
      const zoneIds = JSON.stringify(e.service_zone_ids ?? []);
      await sql`
        INSERT INTO hcp_employees (id, first_name, last_name, name, service_zone_ids)
        VALUES (
          ${e.id},
          ${e.first_name ?? null},
          ${e.last_name ?? null},
          ${(e.name ?? [e.first_name, e.last_name].filter(Boolean).join(" ")) || null},
          ${zoneIds}::jsonb
        )
        ON CONFLICT (id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          name = EXCLUDED.name,
          service_zone_ids = EXCLUDED.service_zone_ids,
          synced_at = NOW()
      `;
    }

    for (const z of zones) {
      const zips = JSON.stringify(z.zip_codes ?? []);
      await sql`
        INSERT INTO hcp_service_zones (id, name, zip_codes)
        VALUES (
          ${z.id},
          ${z.name ?? null},
          ${zips}::jsonb
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          zip_codes = EXCLUDED.zip_codes,
          synced_at = NOW()
      `;
    }

    for (const c of customers) {
      await sql`
        INSERT INTO hcp_customers (id, first_name, last_name, email, phone, address_line_1, city, state, zip)
        VALUES (
          ${c.id},
          ${c.first_name ?? null},
          ${c.last_name ?? null},
          ${c.email ?? null},
          ${c.phone ?? null},
          ${c.address_line_1 ?? null},
          ${c.city ?? null},
          ${c.state ?? null},
          ${c.zip ?? null}
        )
        ON CONFLICT (id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          address_line_1 = EXCLUDED.address_line_1,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          zip = EXCLUDED.zip,
          synced_at = NOW()
      `;
    }

    return NextResponse.json({
      ok: true,
      synced: { employees: employees.length, serviceZones: zones.length, customers: customers.length },
      ...(errors.length > 0 && { errors }),
    });
  } catch (err) {
    console.error("Housecall Pro sync error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
