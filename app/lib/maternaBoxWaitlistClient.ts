export type MaternaBoxWaitlistPayload = {
  name: string
  email: string
  childAgeRange?: string
  city?: string
  discoverySource?: string
  notes?: string
}

export type MaternaBoxWaitlistResponse = {
  ok: boolean
  message?: string
  error?: string
}

export async function submitMaternaBoxWaitlist(
  payload: MaternaBoxWaitlistPayload,
): Promise<MaternaBoxWaitlistResponse> {
  const res = await fetch('/api/materna-box/waitlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = (await res.json()) as MaternaBoxWaitlistResponse

  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Não foi possível enviar seu cadastro.')
  }

  return data
}
