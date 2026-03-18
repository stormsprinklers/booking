const base = "/technicians";

const map: Record<string, string> = {
  "pro_910244d6184f44f39b9911dc037864e8": `${base}/pro_910244d6184f44f39b9911dc037864e8.png`,
  "pro_7e2e3dc6e90e49b4a82bbbd999ea28e4": `${base}/pro_7e2e3dc6e90e49b4a82bbbd999ea28e4.png`,
  "pro_dd9a6a2a236049458165cfca833f94fb": `${base}/pro_dd9a6a2a236049458165cfca833f94fb.png`,
  "pro_44ba1c64e7c94fc49e79d768dd077f5a": `${base}/pro_44ba1c64e7c94fc49e79d768dd077f5a.png`,
  "pro_ca185367edf74f68a4133a4ebb059a7c": `${base}/pro_ca185367edf74f68a4133a4ebb059a7c.png`,
  "pro_6be40356da6d494ca9f624ffde71dec5": `${base}/pro_6be40356da6d494ca9f624ffde71dec5.png`,
  "pro_2a4fd351a39649efac2c1988d1255bb7": `${base}/pro_2a4fd351a39649efac2c1988d1255bb7.png`,
};

export function getTechnicianPhotoUrl(id: string | undefined | null): string | null {
  if (!id) return null;
  return map[id] ?? null;
}

