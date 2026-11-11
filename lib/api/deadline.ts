import { ApiError } from "./client";

// Bound waits even for a transport that ignores abort; release timers/listeners
// on completion and unmount rather than leaving pending work behind.
export async function withDeadline<T>(
  controller: AbortController,
  request: () => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  if (controller.signal.aborted)
    throw new DOMException("Aborted", "AbortError");
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort = () => {};
  const interrupted = new Promise<never>((_, reject) => {
    onAbort = () => reject(new DOMException("Aborted", "AbortError"));
    controller.signal.addEventListener("abort", onAbort, { once: true });
    timer = setTimeout(() => {
      reject(new ApiError(0, "REQUEST_TIMEOUT"));
      controller.abort();
    }, timeoutMs);
  });
  try {
    return await Promise.race([request(), interrupted]);
  } finally {
    clearTimeout(timer);
    controller.signal.removeEventListener("abort", onAbort);
  }
}
