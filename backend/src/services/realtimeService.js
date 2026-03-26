const clients = new Map();
const HEARTBEAT_MS = 25_000;

function toEventFrame(eventName, payload) {
  return `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function writeSafe(res, chunk) {
  try {
    res.write(chunk);
    return true;
  } catch {
    return false;
  }
}

function broadcast(eventName, payload, options = {}) {
  const { recipientAuthUserIds = null } = options;
  for (const [id, client] of clients.entries()) {
    if (recipientAuthUserIds && recipientAuthUserIds.length > 0) {
      if (!client.authUserId || !recipientAuthUserIds.includes(client.authUserId)) continue;
    }
    const ok = writeSafe(client.res, toEventFrame(eventName, payload));
    if (!ok) clients.delete(id);
  }
}

function cleanup(id) {
  const existing = clients.get(id);
  if (!existing) return;
  clearInterval(existing.heartbeat);
  clients.delete(id);
}

export const realtimeService = {
  connect(req, res) {
    const authUserId = req.auth?.user?.id || null;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    writeSafe(res, toEventFrame("connected", { ok: true, ts: Date.now() }));

    const heartbeat = setInterval(() => {
      writeSafe(res, ":keepalive\n\n");
    }, HEARTBEAT_MS);

    clients.set(id, { id, authUserId, res, heartbeat });

    req.on("close", () => cleanup(id));
    req.on("end", () => cleanup(id));
  },

  publish(eventName, payload, options = {}) {
    broadcast(eventName, { ...payload, ts: Date.now() }, options);
  },
};

