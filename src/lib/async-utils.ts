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
