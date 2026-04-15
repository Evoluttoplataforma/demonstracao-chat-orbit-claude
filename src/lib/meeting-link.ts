// Meeting link assignment based on lead profile
// Orbit Pequeno: até R$100mil/mês
// Orbit Grande: acima de R$100mil/mês
// Orbit Consultor: consultores/consultorias

const LINKS = {
  pequeno: "https://meet.google.com/efd-bbnc-zfc",
  grande: "https://meet.google.com/ycz-dosc-znk",
  consultor: "https://meet.google.com/xuc-mrnp-sec",
  // Fallback for legacy leads
  legacy: "https://meet.google.com/qpy-himp-cxj",
} as const;

export function getMeetingLink(
  faturamento: string,
  cargo: string,
  segmento: string
): string {
  const isConsultor =
    segmento.toLowerCase().includes("consultoria") ||
    cargo.toLowerCase().includes("consultor");

  if (isConsultor) return LINKS.consultor;

  const lower = faturamento.toLowerCase();
  const isLowRevenue = lower.includes("até") && lower.includes("100 mil");

  return isLowRevenue ? LINKS.pequeno : LINKS.grande;
}

export const LEGACY_MEETING_LINK = LINKS.legacy;
