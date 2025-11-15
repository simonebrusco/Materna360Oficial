'use client'

import { pushToast } from '@/components/ui/toast/controller'

export const toast = {
  success: (message: string, title?: string) =>
    pushToast({ variant: 'success', message, title }),
  warning: (message: string, title?: string) =>
    pushToast({ variant: 'warning', message, title }),
  danger: (message: string, title?: string) =>
    pushToast({ variant: 'danger', message, title }),
  info: (message: string, title?: string) =>
    pushToast({ variant: 'default', message, title }),
}
