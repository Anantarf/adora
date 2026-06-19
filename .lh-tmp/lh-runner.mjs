import { chromium } from "playwright";
import lighthouse from "lighthouse";
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = process.env.LH_BASE ?? "http://127.0.0.1:4173";
const USERNAME = process.env.LH_USER ?? "parent.arya";
const PASSWORD = process.env.LH_PASS ?? "password";
const ROUTE = process.env.LH_ROUTE ?? "/parent";
const OUT_DIR = process.env.LH_OUT ?? ".lh-tmp";

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--remote-debugging-port=9222", "--no-sandbox"],
});
try {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const csrfResp = await page.request.get(`${BASE}/api/auth/csrf`);
  const csrf = (await csrfResp.json()).csrfToken;
  const body = new URLSearchParams({
    csrfToken: csrf,
    username: USERNAME,
    password: PASSWORD,
    callbackUrl: `${BASE}${ROUTE}`,
    json: "true",
  });
  const resp = await page.request.post(
    `${BASE}/api/auth/callback/credentials?json=true`,
    { form: Object.fromEntries(body.entries()) },
  );
  if (!resp.ok()) throw new Error(`login failed: ${resp.status()}`);

  const cookies = await ctx.cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  const flags = {
    port: 9222,
    output: "json",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    formFactor: "mobile",
    throttlingMethod: "simulate",
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 1.75,
      disabled: false,
    },
    extraHeaders: { Cookie: cookieHeader },
    logLevel: "error",
  };

  const result = await lighthouse(`${BASE}${ROUTE}`, flags, undefined, undefined);
  const json = result.lhr;
  writeFileSync(`${OUT_DIR}/parent-mobile.json`, JSON.stringify(json, null, 2));

  const cat = json.categories ?? {};
  const aud = json.audits ?? {};
  const summary = {
    url: json.finalDisplayedUrl ?? json.requestedUrl,
    fetchTime: json.fetchTime,
    performance: Math.round((cat.performance?.score ?? 0) * 100),
    accessibility: Math.round((cat.accessibility?.score ?? 0) * 100),
    bestPractices: Math.round((cat["best-practices"]?.score ?? 0) * 100),
    seo: Math.round((cat.seo?.score ?? 0) * 100),
    metrics: {
      fcp: aud["first-contentful-paint"]?.numericValue,
      lcp: aud["largest-contentful-paint"]?.numericValue,
      tbt: aud["total-blocking-time"]?.numericValue,
      cls: aud["cumulative-layout-shift"]?.numericValue,
      si: aud["speed-index"]?.numericValue,
    },
    longTasks: (aud["long-tasks"]?.details?.items ?? []).length,
    bootup: aud["bootup-time"]?.numericValue,
    mainThreadWork: aud["mainthread-work-breakdown"]?.numericValue,
    topRequests: (aud["network-requests"]?.details?.items ?? [])
      .slice()
      .sort((a, b) => (b.transferSize ?? 0) - (a.transferSize ?? 0))
      .slice(0, 20)
      .map((r) => ({
        url: (r.url ?? "").replace(BASE, ""),
        transferSize: r.transferSize,
        resourceType: r.resourceType,
        endTime: r.endTime,
        statusCode: r.statusCode,
      })),
    unusedJs: (aud["unused-javascript"]?.details?.items ?? [])
      .slice(0, 10)
      .map((i) => ({ url: (i.url ?? "").replace(BASE, ""), wastedBytes: i.wastedBytes })),
    unusedCss: (aud["unused-css-rules"]?.details?.items ?? [])
      .slice(0, 10)
      .map((i) => ({ url: (i.url ?? "").replace(BASE, ""), wastedBytes: i.wastedBytes })),
    renderBlocking: (aud["render-blocking-resources"]?.details?.items ?? [])
      .map((i) => ({ url: (i.url ?? "").replace(BASE, ""), wastedMs: i.wastedMs })),
    thirdParty: (aud["third-party-summary"]?.details?.items ?? []).map((i) => ({
      entity: i.entity,
      mainThreadTime: i.mainThreadTime,
      transferSize: i.transferSize,
    })),
  };
  writeFileSync(`${OUT_DIR}/parent-mobile-summary.json`, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
