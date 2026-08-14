import { getImgUrl } from "../api";

export const SITE_ORIGIN = "https://serveandlead.org";
export const API_ORIGIN = "https://api.serveandlead.org";

export function eventJoinUrl(eventId) {
  const origin = typeof window !== "undefined" ? window.location.origin : SITE_ORIGIN;
  return `${origin}/events/${eventId}`;
}

export function eventSharePreviewUrl(eventId) {
  return `${API_ORIGIN}/share/event/${eventId}`;
}

export function eventPosterUrl(event) {
  const path = event?.image_url;
  if (!path) return "";
  return getImgUrl(path);
}

export function formatEventTime(time) {
  if (!time) return "TBA";
  const [h, m] = String(time).split(":");
  const hour = Number(h);
  if (Number.isNaN(hour)) return time;
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${(m || "00").padStart(2, "0")} ${suffix}`;
}

export function formatEventDateRange(event) {
  if (!event?.date) return "TBA";
  const start = new Date(event.date);
  const startLabel = start.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  if (!event.endDate) return startLabel;
  const end = new Date(event.endDate);
  if (end.toDateString() === start.toDateString()) return startLabel;
  const endLabel = end.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

function shortDescription(event, max = 180) {
  const raw = String(event.description || "").replace(/\s+/g, " ").trim();
  if (!raw) return "";
  if (raw.length <= max) return raw;
  return `${raw.slice(0, max).trim()}…`;
}

export function formatEventShareCaption(event) {
  const title = event.title || "Serve & Lead Society Event";
  const desc = shortDescription(event);
  const lines = [
    `*${title}*`,
    "_Serve & Lead Society · Official Event_",
    "",
    desc || null,
    desc ? "" : null,
    `📅 ${formatEventDateRange(event)}`,
    `⏰ ${formatEventTime(event.time)}`,
    `📍 ${event.location || "TBA"}`,
  ].filter((line) => line !== null);
  return lines.join("\n");
}

export function formatEventShareText(event) {
  return `${formatEventShareCaption(event)}\n\nView poster & join:\n${eventSharePreviewUrl(event._id)}`;
}

async function posterAsFile(event) {
  const poster = eventPosterUrl(event);
  if (!poster) return null;
  const res = await fetch(poster);
  if (!res.ok) return null;
  const blob = await res.blob();
  const subtype = (blob.type || "image/jpeg").split("/")[1] || "jpeg";
  const ext = subtype === "jpeg" ? "jpg" : subtype;
  return new File([blob], `${event.slug || "event"}.${ext}`, {
    type: blob.type || "image/jpeg",
  });
}

export async function shareEventNative(event) {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  const caption = formatEventShareCaption(event);
  const title = event.title || "Serve & Lead Society Event";
  const joinUrl = eventJoinUrl(event._id);
  const previewUrl = eventSharePreviewUrl(event._id);

  try {
    const file = await posterAsFile(event);
    if (file) {
      const withFile = {
        title,
        text: `${caption}\n\nJoin: ${joinUrl}`,
        files: [file],
      };
      if (!navigator.canShare || navigator.canShare(withFile)) {
        await navigator.share(withFile);
        return true;
      }
    }
  } catch (err) {
    if (err?.name === "AbortError") return true;
  }

  try {
    await navigator.share({ title, text: caption, url: previewUrl });
    return true;
  } catch (err) {
    if (err?.name === "AbortError") return true;
    return false;
  }
}

export async function copyEventShareText(event) {
  const text = formatEventShareText(event);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const input = document.createElement("textarea");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    return true;
  }
}
