const BASE_DAY = Date.UTC(2020, 0, 1);
const DAY_MS = 24 * 60 * 60 * 1000;

export const EVENT_TYPES = {
  beer: { label: "Pivo", amountMl: 500, color: "#f2c94c", code: 0 },
  water: { label: "Voda", amountMl: 500, color: "#2f80ed", code: 1 },
  coffee: { label: "Káva", amountMl: 30, color: "#7a4a2a", code: 2 },
  peeStrong: { label: "Silné nutkání", amountMl: 0, color: "#343a40", code: 3 },
  peeWeak: { label: "Slabé nutkání", amountMl: 0, color: "#adb5bd", code: 4 },
};

const TYPE_BY_CODE = Object.fromEntries(
  Object.entries(EVENT_TYPES).map(([kind, meta]) => [meta.code, kind]),
);

export function encodeDay(day, events) {
  const dayIndex = dayToIndex(day);
  if (dayIndex < 0 || dayIndex > 65535) {
    throw new Error("day is outside supported range");
  }

  const bytes = [dayIndex >> 8, dayIndex & 255];
  for (const event of events) {
    if (event.day !== day) {
      continue;
    }
    const hour = Number(event.hour);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      throw new Error("hour must be an integer from 0 to 23");
    }
    const type = EVENT_TYPES[event.kind];
    if (!type) {
      throw new Error(`unknown event kind: ${event.kind}`);
    }
    bytes.push((type.code << 5) | hour);
  }

  return bytesToBase64Url(Uint8Array.from(bytes));
}

export function decodeDay(payload) {
  const bytes = base64UrlToBytes(payload);
  if (bytes.length < 2) {
    throw new Error("Invalid payload");
  }

  const dayIndex = (bytes[0] << 8) | bytes[1];
  const day = indexToDay(dayIndex);
  const events = [];

  for (let index = 2; index < bytes.length; index += 1) {
    const code = bytes[index] >> 5;
    const hour = bytes[index] & 31;
    const kind = TYPE_BY_CODE[code];
    if (!kind || hour > 23) {
      throw new Error("Invalid payload");
    }
    events.push({ day, hour, kind });
  }

  return { day, events };
}

function dayToIndex(day) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) {
    throw new Error("day must use YYYY-MM-DD format");
  }
  const utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Math.round((utc - BASE_DAY) / DAY_MS);
}

function indexToDay(index) {
  return new Date(BASE_DAY + index * DAY_MS).toISOString().slice(0, 10);
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(payload) {
  if (!/^[A-Za-z0-9_-]+$/.test(payload)) {
    throw new Error("Invalid payload");
  }
  const padded = payload.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
