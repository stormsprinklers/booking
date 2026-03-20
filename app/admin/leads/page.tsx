"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  serviceCategory: string;
  serviceTitle: string | null;
  createdAt: string;
  convertedAt: string | null;
  hcpJobId: string | null;
  sentToGhlAt: string | null;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [status, setStatus] = useState<"all" | "abandoned" | "converted">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = status === "all" ? "" : `?status=${status}`;
    fetch(`/api/leads${q}`)
      .then((r) => r.json())
      .then((d) => setLeads(d.leads ?? []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [status]);

  const formatDate = (s: string | null) =>
    s ? new Date(s).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "—";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="text-sm text-[#4C9BC8] hover:underline"
            >
              ← Back to site
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-[#102341]">
              Leads
            </h1>
          </div>
          <div className="flex gap-2">
            {(["all", "abandoned", "converted"] as const).map((s) => (
              <Button
                key={s}
                variant={status === s ? "primary" : "outline"}
                size="sm"
                onClick={() => setStatus(s)}
              >
                {s === "all" ? "All" : s === "abandoned" ? "Abandoned" : "Converted"}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-[#102341]/60">
              Loading...
            </div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center text-[#102341]/60">
              No leads yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="px-4 py-3 font-semibold text-[#102341]">Name</th>
                  <th className="px-4 py-3 font-semibold text-[#102341]">Email</th>
                  <th className="px-4 py-3 font-semibold text-[#102341]">Phone</th>
                  <th className="px-4 py-3 font-semibold text-[#102341]">Service</th>
                  <th className="px-4 py-3 font-semibold text-[#102341]">Submitted</th>
                  <th className="px-4 py-3 font-semibold text-[#102341]">Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]/50"
                  >
                    <td className="px-4 py-3 text-[#102341]">{lead.name}</td>
                    <td className="px-4 py-3 text-[#102341]">{lead.email ?? "—"}</td>
                    <td className="px-4 py-3 text-[#102341]">{lead.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-[#102341]">
                      {lead.serviceTitle ?? lead.serviceCategory}
                    </td>
                    <td className="px-4 py-3 text-[#102341]/80">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {lead.convertedAt ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Converted
                        </span>
                      ) : lead.sentToGhlAt ? (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Sent to GHL
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          Abandoned
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
