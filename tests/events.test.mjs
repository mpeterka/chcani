import assert from "node:assert/strict";
import { ensureEventIds, removeEventById } from "../src/events.mjs";

const legacyEvents = [
  { day: "2026-05-18", hour: 8, kind: "water" },
  { day: "2026-05-18", hour: 8, kind: "water" },
  { day: "2026-05-18", hour: 9, kind: "peeStrong", id: "existing-id" },
];

const normalized = ensureEventIds(legacyEvents);

assert.equal(normalized.length, 3);
assert.ok(normalized[0].id);
assert.ok(normalized[1].id);
assert.notEqual(normalized[0].id, normalized[1].id);
assert.equal(normalized[2].id, "existing-id");
assert.deepEqual(legacyEvents[0], { day: "2026-05-18", hour: 8, kind: "water" });

assert.deepEqual(
  removeEventById(normalized, normalized[0].id).map((event) => event.id),
  [normalized[1].id, "existing-id"],
);

assert.deepEqual(removeEventById(normalized, "missing"), normalized);
