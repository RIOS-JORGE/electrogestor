export function useIdGenerator(): () => string {
  return () => crypto.randomUUID()
}
