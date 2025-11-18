/**
 * Pauses the execution of an asynchronous function for the specified duration.
 *
 * @param {number} ms - The duration in milliseconds for which the execution should be paused.
 * @returns {Promise<void>} A Promise that resolves after the specified duration.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
