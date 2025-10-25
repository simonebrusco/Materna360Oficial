import { expect, test } from '@playwright/test'

import { expect, test } from '@playwright/test'

test.describe('Meu Dia family planner', () => {
  test('shows personalized planner title from cookie and keeps planner interactive', async ({ context, page }) => {
    await context.clearCookies()
    await context.addCookies([
      {
        name: 'm360_profile',
        value: JSON.stringify({ motherName: 'Mariana Silva' }),
        domain: 'localhost',
        path: '/',
        sameSite: 'Lax',
      },
    ])

    const consoleErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })

    await page.goto('/meu-dia')

    await expect(page.getByTestId('planner-title')).toHaveText('Planner da Mariana')

    const dayStrip = page.getByTestId('planner-day-strip')
    await expect(dayStrip).toBeVisible()

    const firstDay = dayStrip.getByRole('button').first()
    await firstDay.click()

    await expect(page.getByText('Agenda do dia')).toBeVisible()
    await expect(page.getByRole('button', { name: /\+ Brincadeira/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Adicionar item/i })).toBeVisible()

    expect(consoleErrors).toEqual([])
  })

  test('falls back to planner title with Mãe when cookie is missing', async ({ context, page }) => {
    await context.clearCookies()
    await page.goto('/meu-dia')

    await expect(page.getByTestId('planner-title')).toHaveText('Planner da Mãe')
  })
})
