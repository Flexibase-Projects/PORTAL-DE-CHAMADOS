import { alpha } from "@mui/material/styles";
import type { TicketStatus } from "@/types/ticket";

/**
 * Mesmas cores do ícone de status no rodapé do TicketCard — texto e ícone do TicketStatusPill usam `fg`.
 */
export function getTicketStatusAccent(status: TicketStatus): { fg: string; iconBg: string } {
  switch (status) {
    case "Concluído":
      return { fg: "#16a34a", iconBg: alpha("#16a34a", 0.14) };
    case "Em Andamento":
      return { fg: "#d97706", iconBg: alpha("#f59e0b", 0.2) };
    case "Pausado":
      return { fg: "#9333ea", iconBg: alpha("#9333ea", 0.18) };
    default:
      return { fg: "#dc2626", iconBg: alpha("#ef4444", 0.14) };
  }
}
