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

export function formatEventShareText(event) {
  const joinUrl = eventJoinUrl(event._id);
  const poster = eventPosterUrl(event);
  const lines = [
    event.title || "Serve & Lead Society Event",
    "",
    event.description?.trim() || null,
    event.description?.trim() ? "" : null,
    `Date: ${formatEventDateRange(event)}`,
    `Time: ${event.time || "TBA"}`,
    `Venue: ${event.location || "TBA"}`,
    poster ? `Poster: ${poster}` : null,
    `Join: ${joinUrl}`,
    "",
    "Serve & Lead Society",
    SITE_ORIGIN,
  ].filter((line) => line !== null);
  return lines.join("\n");
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
  const text = formatEventShareText(event);
  const title = event.title || "Serve & Lead Society Event";
  const url = eventJoinUrl(event._id);

  try {
    const file = await posterAsFile(event);
    if (file) {
      const withFile = { title, text, files: [file] };
      if (!navigator.canShare || navigator.canShare(withFile)) {
        await navigator.share(withFile);
        return true;
      }
    }
  } catch (err) {
    if (err?.name === "AbortError") return true;
  }

  try {
    await navigator.share({ title, text, url });
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
