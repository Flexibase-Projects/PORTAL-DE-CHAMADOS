export type RealtimeEventName =
  | "connected"
  | "ticket_created"
  | "ticket_updated"
  | "ticket_closed"
  | "notification_created";

export interface RealtimeEventPayload {
  ticketId?: string;
  reason?: string;
  status?: string;
  [key: string]: unknown;
}

type RealtimeCallback = (eventName: RealtimeEventName, payload: RealtimeEventPayload) => void;

let source: EventSource | null = null;
const listeners = new Set<RealtimeCallback>();

function emit(eventName: RealtimeEventName, payload: RealtimeEventPayload) {
  listeners.forEach((cb) => cb(eventName, payload));
}

function attachListeners(es: EventSource) {
  const allEvents: RealtimeEventName[] = [
    "connected",
    "ticket_created",
    "ticket_updated",
    "ticket_closed",
    "notification_created",
  ];

  allEvents.forEach((eventName) => {
    es.addEventListener(eventName, (evt) => {
      try {
        const payload = JSON.parse((evt as MessageEvent).data) as RealtimeEventPayload;
        emit(eventName, payload);
      } catch {
        emit(eventName, {});
      }
    });
  });
}

export function startRealtimeStream(authUserId: string) {
  if (!authUserId) return;
  const url = `/api/realtime/events?auth_user_id=${encodeURIComponent(authUserId)}`;
  if (source && source.url === url && source.readyState !== EventSource.CLOSED) return;
  if (source) source.close();
  source = new EventSource(url, { withCredentials: false });
  attachListeners(source);
}

export function stopRealtimeStream() {
  if (!source) return;
  source.close();
  source = null;
}

export function subscribeRealtime(cb: RealtimeCallback) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

