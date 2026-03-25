import type { Ticket, TicketActivity } from "@/types/ticket";

export type TimelineStepKind = "abertura" | "status" | "conclusao";

/** Ícone na bolinha da timeline (alinhado aos status do chamado). */
export type TimelineMarker = "aberto" | "em_andamento" | "pausado" | "concluido" | "outro";

export interface TimelineStep {
  kind: TimelineStepKind;
  /** ISO timestamp */
  at: string;
  label: string;
  subtitle?: string;
  marker: TimelineMarker;
  /** Id da atividade `status_alterado` (chave estável com muitos ciclos pausa/retomada). */
  sourceActivityId?: string;
}

export function statusNovoToTimelineMarker(statusNovo: string): TimelineMarker {
  const s = (statusNovo ?? "").trim();
  if (s === "Aberto") return "aberto";
  if (s === "Em Andamento") return "em_andamento";
  if (s === "Pausado") return "pausado";
  if (s === "Concluído") return "concluido";
  return "outro";
}

function timeMs(iso: string): number {
  return new Date(iso).getTime();
}

function normalizeDetalhes(raw: unknown): TicketActivity["detalhes"] {
  if (raw == null) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as TicketActivity["detalhes"];
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") return raw as TicketActivity["detalhes"];
  return {};
}

function isStatusAlteradoActivity(a: TicketActivity): boolean {
  return (a.tipo ?? "").trim().toLowerCase() === "status_alterado";
}

function statusChangeDedupeKey(a: Pick<TicketActivity, "created_at" | "detalhes">): string {
  const d = normalizeDetalhes(a.detalhes);
  return `${a.created_at || ""}|${d?.status_anterior ?? ""}|${d?.status_novo ?? ""}`;
}

/** Junta `atividades` com `_pdc_status_events` em `dados_extras` (fallback quando a tabela de atividades não existe). */
export function mergeAtividadesWithDadosExtrasTimeline(ticket: Ticket): TicketActivity[] {
  const base = [...(ticket.atividades ?? [])];
  let ex: unknown = ticket.dados_extras;
  if (typeof ex === "string") {
    try {
      ex = JSON.parse(ex) as Record<string, unknown>;
    } catch {
      return base;
    }
  }
  if (!ex || typeof ex !== "object" || Array.isArray(ex)) return base;
  const events = (ex as Record<string, unknown>)._pdc_status_events;
  if (!Array.isArray(events) || events.length === 0) return base;

  const seen = new Set(base.filter(isStatusAlteradoActivity).map((a) => statusChangeDedupeKey(a)));
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (!ev || typeof ev !== "object") continue;
    const o = ev as Record<string, unknown>;
    const syn: TicketActivity = {
      id: String(o.id ?? `pdc-dados-extras-${i}-${String(o.created_at ?? "")}`),
      tipo: "status_alterado",
      autor_id: typeof o.autor_id === "string" ? o.autor_id : undefined,
      autor_nome: typeof o.autor_nome === "string" ? o.autor_nome : undefined,
      created_at: String(o.created_at ?? ""),
      detalhes: normalizeDetalhes(o.detalhes),
    };
    const k = statusChangeDedupeKey(syn);
    if (seen.has(k)) continue;
    seen.add(k);
    base.push(syn);
  }
  return base;
}

/** Rótulo legível para cada transição. */
export function statusTransitionLabel(statusAnterior: string, statusNovo: string): string {
  const prev = statusAnterior || "—";
  const next = statusNovo || "—";
  if (prev === "Aberto" && next === "Em Andamento") return "Entrou em andamento";
  if (next === "Pausado") return "Chamado pausado";
  if (prev === "Pausado" && next === "Em Andamento") return "Retomado — em andamento";
  if (prev === "Pausado" && next === "Aberto") return "De pausado para aberto";
  if (next === "Concluído") return "Concluído";
  if (prev === "Concluído" && next !== "Concluído") return `Reaberto (${next})`;
  if (next === "Em Andamento" && prev !== "Aberto" && prev !== "Pausado")
    return `Em andamento (antes: ${prev})`;
  if (next === "Aberto" && prev !== "Aberto") return `Volta para aberto (antes: ${prev})`;
  return `De ${prev} para ${next}`;
}

/**
 * Marcos em ordem cronológica (esquerda → direita: mais antigo → mais recente).
 * Cada linha `status_alterado` em `atividades` vira um marco (pausar/retomar N vezes = N marcos).
 */
export function buildTicketStatusTimelineSteps(ticket: Ticket): TimelineStep[] {
  const steps: TimelineStep[] = [];

  steps.push({
    kind: "abertura",
    at: ticket.created_at,
    label: "Chamado aberto",
    subtitle: ticket.solicitante_nome ? `Por ${ticket.solicitante_nome}` : undefined,
    marker: "aberto",
  });

  const rawList = ticket.atividades ?? [];
  const statusChanges = rawList
    .filter(isStatusAlteradoActivity)
    .map((a) => {
      const detalhes = normalizeDetalhes(a.detalhes);
      return {
        ...a,
        detalhes,
      };
    })
    .sort((a, b) => timeMs(a.created_at) - timeMs(b.created_at));

  for (const a of statusChanges) {
    const prev = a.detalhes?.status_anterior ?? "—";
    const next = a.detalhes?.status_novo ?? "—";
    const title = statusTransitionLabel(prev, next);
    const explicit = `De ${prev} para ${next}`;
    const quemAlterou =
      a.autor_id && ticket.solicitante_id
        ? a.autor_id === ticket.solicitante_id
          ? "Remetente"
          : "Equipe de destino"
        : null;
    const subtitleBits: string[] = [];
    if (title !== explicit) subtitleBits.push(explicit);
    if (a.autor_nome) subtitleBits.push(a.autor_nome);
    if (quemAlterou) subtitleBits.push(quemAlterou);
    const subtitle =
      subtitleBits.length > 0 ? subtitleBits.join(" · ") : title === explicit ? undefined : explicit;

    steps.push({
      kind: "status",
      at: a.created_at,
      label: title,
      subtitle,
      marker: statusNovoToTimelineMarker(next),
      sourceActivityId: a.id,
    });
  }

  const hasConcluidoEvent = statusChanges.some((a) => a.detalhes?.status_novo === "Concluído");
  if (ticket.closed_at && !hasConcluidoEvent) {
    steps.push({
      kind: "conclusao",
      at: ticket.closed_at,
      label: "Concluído",
      marker: "concluido",
    });
  }

  steps.sort((a, b) => timeMs(a.at) - timeMs(b.at));
  return steps;
}

export function ticketHasRecordedStatusChanges(ticket: Ticket): boolean {
  if ((ticket.atividades ?? []).some(isStatusAlteradoActivity)) return true;
  let ex: unknown = ticket.dados_extras;
  if (typeof ex === "string") {
    try {
      ex = JSON.parse(ex) as Record<string, unknown>;
    } catch {
      ex = null;
    }
  }
  if (ex && typeof ex === "object" && !Array.isArray(ex)) {
    const ev = (ex as Record<string, unknown>)._pdc_status_events;
    return Array.isArray(ev) && ev.length > 0;
  }
  return false;
}

/** Estado ≠ Aberto mas sem nenhuma linha de mudança de status (histórico incompleto). */
export function ticketStatusHistoryMissingActivities(ticket: Ticket): boolean {
  if (ticketHasRecordedStatusChanges(ticket)) return false;
  if (ticket.status === "Aberto") return false;
  if (ticket.status === "Concluído" && ticket.closed_at) return false;
  return true;
}
