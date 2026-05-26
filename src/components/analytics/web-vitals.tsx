"use client";

import { useReportWebVitals } from "next/web-vitals";

type Metric = Parameters<Parameters<typeof useReportWebVitals>[0]>[0];

const VITALS_ENDPOINT = "/api/analytics/web-vitals";

function shouldReportMetric(metric: Metric) {
  return ["CLS", "FCP", "INP", "LCP", "TTFB"].includes(metric.name);
}

function reportMetric(metric: Metric) {
  if (!shouldReportMetric(metric)) {
    return;
  }

  const body = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    navigationType: metric.navigationType,
    pathname: window.location.pathname,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(VITALS_ENDPOINT, new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch(VITALS_ENDPOINT, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
    },
    keepalive: true,
  });
}

export function WebVitals() {
  useReportWebVitals(reportMetric);
  return null;
}
