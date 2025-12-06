export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 5000
): Promise<T> {

  let timeoutId: NodeJS.Timeout | undefined = undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms`));
    }, ms);
  });

  const result = await Promise.race([promise, timeoutPromise]);

  if (timeoutId) clearTimeout(timeoutId);

  return result as T;
}