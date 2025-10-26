import { test, expect } from '@playwright/test'

test.describe('Meu Dia greeting', () => {
  test('shows first-name greeting after saving Eu360', async ({ page, context }) => {
    await context.clearCookies()

    await page.goto('/eu360')
    await page.getByLabel(/Seu nome/i).fill('Mariana Alves')
    await page.getByRole('button', { name: /salvar/i }).click()

    await page.waitForURL('**/meu-dia')

    const greeting = page.getByTestId('greeting-text')
    await expect(greeting).toHaveText(/Boa (manhã|tarde|noite), Mariana!/)
  })

  test('falls back to "Mãe" when name is empty', async ({ page, context }) => {
    await context.clearCookies()

    await page.goto('/eu360')
    await page.getByLabel(/Seu nome/i).fill('')
    await page.getByRole('button', { name: /salvar/i }).click()

    await page.waitForURL('**/meu-dia')

    const greeting = page.getByTestId('greeting-text')
    await expect(greeting).toHaveText(/Boa (manhã|tarde|noite), Mãe!/)
  })
})
