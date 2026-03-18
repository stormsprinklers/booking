export function formatTechnicianDisplayName(fullName: string | null | undefined): string {
  const raw = (fullName ?? "").trim();
  if (!raw) return "Technician";
  const parts = raw.split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const last = parts[parts.length - 1];
  const initial = last[0];
  return `${first} ${initial}.`;
}

