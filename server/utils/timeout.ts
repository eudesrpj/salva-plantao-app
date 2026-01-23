/**
 * Timeout utility for database queries
 * Prevents queries from hanging indefinitely
 */

/**
 * Wraps a promise with a timeout.
 * If the promise doesn't resolve within the specified milliseconds,
 * throws a TimeoutError.
 * 
 * @param promise The promise to wrap
 * @param ms Timeout in milliseconds
 * @param label Optional label for error message
 * @returns Promise that resolves or rejects with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string = "Operation"
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    )
  );

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Same as withTimeout but with default 10 second timeout for DB queries
 */
export async function withDbTimeout<T>(
  promise: Promise<T>,
  label: string = "Database query"
): Promise<T> {
  return withTimeout(promise, 10000, label);
}

/**
 * Error class for timeouts
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}
