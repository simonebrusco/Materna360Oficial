export type Profile = { motherName?: string; children?: any[] }

export function profilePreferredBuckets(profile: Profile): any {
  return { ageBucket: '2-3' }
}
