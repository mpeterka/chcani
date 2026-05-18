export function createEvent(day, hour, kind) {
  return {
    id: makeEventId(),
    day,
    hour,
    kind,
  };
}

export function ensureEventIds(events) {
  return events.map((event) => ({
    ...event,
    id: event.id || makeEventId(),
  }));
}

export function removeEventById(events, id) {
  return events.filter((event) => event.id !== id);
}

export function toShareEvents(events) {
  return events.map(({ day, hour, kind }) => ({ day, hour, kind }));
}

function makeEventId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
