import type { Meta, StoryObj } from '@storybook/react'

import type { Meta, StoryObj } from '@storybook/react'

import DailyMessageCard from './DailyMessageCard'

const meta: Meta<typeof DailyMessageCard> = {
  title: 'Blocks/DailyMessageCard',
  component: DailyMessageCard,
  argTypes: {
    greeting: {
      control: 'text',
      description: 'Fully formatted greeting rendered verbatim inside the card.',
      defaultValue: 'Boa tarde, Mariana!',
    },
  },
}

export default meta

type Story = StoryObj<typeof DailyMessageCard>

export const VerbatimGreeting: Story = {
  name: 'Verbatim Greeting',
  args: {
    greeting: 'Boa tarde, Mariana!',
  },
}
