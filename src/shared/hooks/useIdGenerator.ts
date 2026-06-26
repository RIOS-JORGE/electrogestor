export function useIdGenerator(): (serverValue?: string) => string {
  return (serverValue?: string) => serverValue ?? crypto.randomUUID()
}
