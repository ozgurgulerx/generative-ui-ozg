'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check } from 'lucide-react'
import { trackAction, trackJourney } from '@/lib/analytics/tracker'

interface TransferModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransferModal({ open, onOpenChange }: TransferModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')

  const handleSubmit = () => {
    trackAction('TRANSFER')
    trackJourney('TRANSFER_COMPLETED')
    setStep('success')
    setTimeout(() => {
      onOpenChange(false)
      setStep('form')
      setAmount('')
      setRecipient('')
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle>New Transfer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient</Label>
                <Input
                  id="recipient"
                  placeholder="Enter name or account"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!amount || !recipient}
              >
                Transfer
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="mb-2">Transfer Complete!</DialogTitle>
            <p className="text-sm text-muted-foreground">
              ${amount} sent to {recipient}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
