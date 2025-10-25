import { expect, test } from '@playwright/test'

test.describe('Meu Dia check-in card', () => {
  test('renders check-in under message of the day', async ({ page }) => {
    await page.goto('/meu-dia')

    const message = page.getByTestId('message-of-day')
    const checkin = page.getByTestId('checkin-card')
    const activity = page.getByTestId('activity-of-day')

    await expect(message).toBeVisible()
    await expect(checkin).toBeVisible()
    await expect(activity).toBeVisible()

    const isDirectlyAfterMessage = await message.evaluate((element) => {
      const wrapper = element.parentElement
      if (!wrapper) {
        return false
      }
      const nextSibling = wrapper.nextElementSibling
      return !!nextSibling?.querySelector('[data-testid="checkin-card"]')
    })

    expect(isDirectlyAfterMessage).toBeTruthy()

    const checkinBeforeActivity = await activity.evaluate((activityElement) => {
      const checkinElement = document.querySelector('[data-testid="checkin-card"]')
      if (!checkinElement) {
        return false
      }
      return (activityElement.compareDocumentPosition(checkinElement) & Node.DOCUMENT_POSITION_PRECEDING) !== 0
    })

    expect(checkinBeforeActivity).toBeTruthy()
  })
})
