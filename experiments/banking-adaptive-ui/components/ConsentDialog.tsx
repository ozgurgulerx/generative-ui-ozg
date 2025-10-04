'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getConsent, setConsent } from '@/lib/analytics/storage'
import { t, type Locale } from '@/lib/i18n/strings'

interface ConsentDialogProps {
  locale?: Locale
  onAccept: () => void
  onDecline: () => void
}

export function ConsentDialog({ locale = 'en', onAccept, onDecline }: ConsentDialogProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Show dialog if consent hasn't been set
    const hasConsent = getConsent()
    const hasDeclined = localStorage.getItem('banking_consent') === 'false'
    if (!hasConsent && !hasDeclined) {
      setOpen(true)
    }
  }, [])

  const handleAccept = () => {
    setConsent(true)
    setOpen(false)
    onAccept()
  }

  const handleDecline = () => {
    setConsent(false)
    setOpen(false)
    onDecline()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(locale, 'consentTitle')}</DialogTitle>
          <DialogDescription>{t(locale, 'consentBody')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleDecline}>
            {t(locale, 'decline')}
          </Button>
          <Button onClick={handleAccept}>{t(locale, 'accept')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
