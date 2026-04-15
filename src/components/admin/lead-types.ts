export interface Lead {
  id: string;
  nome: string;
  sobrenome: string;
  whatsapp: string;
  email: string;
  empresa: string;
  oque_faz: string;
  cargo: string;
  faturamento: string;
  funcionarios: string;
  prioridade: string;
  data_reuniao: string;
  horario_reuniao: string;
  created_at: string;
  status?: string;
  copy_variant?: string | null;
  ligacao_confirmacao_enviada?: boolean;
  landing_page?: string | null;
}

export const PRIORITY_COLORS: Record<string, string> = {
  "Urgente — preciso para ontem": "bg-destructive text-destructive-foreground",
  "Em breve — nos próximos 30 dias": "bg-primary text-primary-foreground",
  "Estou pesquisando ainda": "bg-secondary text-secondary-foreground",
  "Só quero conhecer": "bg-muted text-muted-foreground",
};

export function parseLeadDate(d: string): Date | null {
  if (!d) return null;
  const [day, month, year] = d.split("/");
  if (!day || !month || !year) return null;
  return new Date(+year, +month - 1, +day);
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
