import assert from "node:assert/strict";
import { decodeDay, encodeDay } from "../src/codec.mjs";

const events = [
  { day: "2026-05-18", hour: 8, kind: "water" },
  { day: "2026-05-18", hour: 9, kind: "coffee" },
  { day: "2026-05-18", hour: 18, kind: "beer" },
  { day: "2026-05-18", hour: 21, kind: "peeStrong" },
  { day: "2026-05-18", hour: 23, kind: "peeWeak" },
];

const encoded = encodeDay("2026-05-18", events);

assert.match(encoded, /^[A-Za-z0-9_-]+$/);
assert.ok(encoded.length <= 12, `expected compact payload, got ${encoded.length} chars`);
assert.deepEqual(decodeDay(encoded), { day: "2026-05-18", events });

assert.throws(() => encodeDay("2026-05-18", [{ day: "2026-05-18", hour: 24, kind: "water" }]), /hour/);
assert.throws(() => decodeDay("%%%"), /Invalid/);
