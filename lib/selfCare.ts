export function selectSelfCareItems(
  catalog: any[],
  profile: any,
  filters: any,
  dateKey: string
) {
  return {
    items: [],
    rotationKey: '',
    source: 'fallback' as const,
  }
}
