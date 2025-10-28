export async function withTimeout<T>(p: Promise<T>, ms = 5000): Promise<T> {
  return await Promise.race([
    p,
    new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ])
}
