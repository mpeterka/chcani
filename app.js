import { EVENT_TYPES, decodeDay, encodeDay } from "./src/codec.mjs";
import { createEvent, ensureEventIds, removeEventById, toShareEvents } from "./src/events.mjs";

const STORAGE_KEY = "health-fluid-log-v1";
const chart = document.querySelector("#chart");
const dayInput = document.querySelector("#dayInput");
const eventList = document.querySelector("#eventList");
const summary = document.querySelector("#summary");
const shareLink = document.querySelector("#shareLink");
const entryPanel = document.querySelector("#entryPanel");
const exportBtn = document.querySelector("#exportBtn");
const clearBtn = document.querySelector("#clearBtn");

let readonly = false;
let events = loadEvents();

init();

function init() {
  const params = new URLSearchParams(window.location.search);
  const packed = params.get("d");

  if (packed) {
    try {
      const decoded = decodeDay(packed);
      readonly = true;
      events = ensureEventIds(decoded.events);
      dayInput.value = decoded.day;
      entryPanel.hidden = true;
      exportBtn.hidden = true;
      clearBtn.hidden = true;
      document.body.classList.add("readonly");
    } catch {
      dayInput.value = today();
    }
  } else {
    dayInput.value = today();
  }

  document.querySelectorAll("[data-kind]").forEach((button) => {
    button.addEventListener("click", () => addEvent(button.dataset.kind));
  });
  eventList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-id]");
    if (button) {
      deleteEvent(button.dataset.deleteId);
    }
  });
  dayInput.addEventListener("change", render);
  exportBtn.addEventListener("click", exportReadonly);
  clearBtn.addEventListener("click", clearDay);
  window.addEventListener("resize", render);
  render();
}

function addEvent(kind) {
  if (readonly) {
    return;
  }
  events.push({
    ...createEvent(dayInput.value, new Date().getHours(), kind),
  });
  saveEvents(events);
  render();
}

function deleteEvent(id) {
  if (readonly) {
    return;
  }
  events = removeEventById(events, id);
  saveEvents(events);
  shareLink.hidden = true;
  render();
}

function clearDay() {
  if (readonly) {
    return;
  }
  const day = dayInput.value;
  events = events.filter((event) => event.day !== day);
  saveEvents(events);
  shareLink.hidden = true;
  render();
}

function exportReadonly() {
  const day = dayInput.value;
  const dayEvents = eventsForDay(day);
  const encoded = encodeDay(day, toShareEvents(dayEvents));
  const url = `${window.location.origin}${window.location.pathname}?d=${encoded}`;
  shareLink.hidden = false;
  shareLink.innerHTML = `<span>Odkaz jen pro čtení:</span> <a href="${url}">${url}</a>`;
}

function render() {
  const day = dayInput.value || today();
  const dayEvents = eventsForDay(day);
  renderChart(dayEvents);
  renderList(dayEvents);
  renderSummary(dayEvents);
}

function eventsForDay(day) {
  return events.filter((event) => event.day === day).sort((a, b) => a.hour - b.hour);
}

function renderSummary(dayEvents) {
  const intake = dayEvents.reduce((sum, event) => sum + EVENT_TYPES[event.kind].amountMl, 0);
  const pees = dayEvents.filter((event) => event.kind.startsWith("pee")).length;
  summary.textContent = `${(intake / 1000).toFixed(2)} l příjem · ${pees} močení`;
}

function renderList(dayEvents) {
  if (!dayEvents.length) {
    eventList.innerHTML = `<li class="empty">Zatím bez záznamu pro vybraný den.</li>`;
    return;
  }
  eventList.innerHTML = dayEvents
    .map((event) => {
      const meta = EVENT_TYPES[event.kind];
      const amount = meta.amountMl ? ` · ${meta.amountMl} ml` : "";
      const deleteButton = readonly
        ? ""
        : `<button class="delete-event" type="button" data-delete-id="${event.id}" aria-label="Smazat záznam ${meta.label} v ${event.hour}:00">Smazat</button>`;
      return `<li><span class="time">${String(event.hour).padStart(2, "0")}:00</span><i style="background:${meta.color}"></i><span class="event-label">${meta.label}${amount}</span>${deleteButton}</li>`;
    })
    .join("");
}

function renderChart(dayEvents) {
  const width = Math.max(360, Math.min(960, Math.round(chart.clientWidth || 960)));
  const height = width < 560 ? 300 : 420;
  const margin = {
    top: 24,
    right: width < 560 ? 8 : 16,
    bottom: width < 560 ? 34 : 38,
    left: width < 560 ? 34 : 44,
  };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const mid = margin.top + plotH / 2;
  const hourW = plotW / 24;
  const mlScale = (plotH / 2 - 16) / 1000;
  const peeScale = plotH / 2 - 16;

  const intake = new Map();
  const output = new Map();
  for (const event of dayEvents) {
    const bucket = event.kind.startsWith("pee") ? output : intake;
    const list = bucket.get(event.hour) || [];
    list.push(event);
    bucket.set(event.hour, list);
  }

  const parts = [
    `<svg viewBox="0 0 ${width} ${height}" aria-hidden="true">`,
    `<line class="axis" x1="${margin.left}" y1="${mid}" x2="${width - margin.right}" y2="${mid}"></line>`,
  ];

  for (let hour = 0; hour <= 24; hour += 1) {
    const x = margin.left + hour * hourW;
    parts.push(`<line class="grid" x1="${x}" y1="${margin.top}" x2="${x}" y2="${height - margin.bottom}"></line>`);
    if (hour % (width < 560 ? 4 : 3) === 0 || hour === 24) {
      parts.push(`<text class="tick" x="${x}" y="${height - 12}" text-anchor="middle">${hour}</text>`);
    }
  }

  for (let hour = 0; hour < 24; hour += 1) {
    const x = margin.left + hour * hourW + 5;
    const barW = Math.max(12, hourW - 10);
    let topCursor = mid;
    for (const event of intake.get(hour) || []) {
      const meta = EVENT_TYPES[event.kind];
      const barH = Math.max(5, meta.amountMl * mlScale);
      topCursor -= barH;
      parts.push(`<rect x="${x}" y="${topCursor}" width="${barW}" height="${barH}" rx="3" fill="${meta.color}"></rect>`);
    }

    let bottomCursor = mid;
    for (const event of output.get(hour) || []) {
      const meta = EVENT_TYPES[event.kind];
      const barH = Math.max(16, peeScale / Math.max(4, output.get(hour).length));
      parts.push(`<rect x="${x}" y="${bottomCursor}" width="${barW}" height="${barH}" rx="3" fill="${meta.color}"></rect>`);
      bottomCursor += barH + 2;
    }
  }

  parts.push(`<text class="axis-label" x="10" y="${margin.top + 18}">+ ml</text>`);
  parts.push(`<text class="axis-label" x="10" y="${height - margin.bottom - 6}">- počet</text>`);
  parts.push("</svg>");
  chart.innerHTML = parts.join("");
}

function loadEvents() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? ensureEventIds(parsed) : [];
  } catch {
    return [];
  }
}

function saveEvents(nextEvents) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEvents));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
