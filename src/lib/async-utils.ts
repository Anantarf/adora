/**
 * Generic async utilities shared across API routes and server actions.
 */

/**
 * Resolves a promise, rejecting with `timeoutCode` if it does not settle
 * within `timeoutMs`. The underlying timer is always cleared, even when the
 * promise resolves or rejects first, so we never leak handles.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutCode: string,
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(timeoutCode)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

/**
 * Read the originating client IP from the current request, falling back to
 * a stable identifier. Safe to call from server actions and API routes; on
 * the server-action side it relies on `next/headers` `headers()` which Next.js
 * populates for the duration of the action.
 */
export async function getRequestIp(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const { getClientIp } = await import("@/lib/client-ip");
    return getClientIp(h);
  } catch {
    return "unknown";
  }
}