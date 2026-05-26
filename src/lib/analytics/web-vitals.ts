export const WEB_VITALS_MAX_STRING_LENGTH = 255;

export type WebVitalPayload = {
  id?: unknown;
  name?: unknown;
  value?: unknown;
  delta?: unknown;
  rating?: unknown;
  navigationType?: unknown;
  pathname?: unknown;
};

export type NormalizedWebVital = {
  id: string;
  name: string;
  value: number;
  delta: number;
  rating: string;
  navigationType: string;
  pathname: string;
};

function toFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toShortString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.slice(0, WEB_VITALS_MAX_STRING_LENGTH) : fallback;
}

export function normalizeWebVitalPayload(payload: WebVitalPayload): NormalizedWebVital | null {
  const value = toFiniteNumber(payload.value);
  const delta = toFiniteNumber(payload.delta);
  const name = toShortString(payload.name);
  const rating = toShortString(payload.rating);

  if (!name || !rating || value == null || delta == null) {
    return null;
  }

  return {
    id: toShortString(payload.id),
    name,
    value,
    delta,
    rating,
    navigationType: toShortString(payload.navigationType),
    pathname: toShortString(payload.pathname, "/"),
  };
}

export function shouldPersistWebVital(payload: Pick<NormalizedWebVital, "name" | "rating" | "value">) {
  if (payload.rating !== "good") {
    return true;
  }

  if (payload.name === "LCP" && payload.value >= 2_000) {
    return true;
  }

  if (payload.name === "INP" && payload.value >= 150) {
    return true;
  }

  if (payload.name === "CLS" && payload.value >= 0.08) {
    return true;
  }

  return false;
}
