'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ConfirmDialogProps = {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  /** If set, the confirm button stays disabled until the user types this exact value. */
  confirmValue?: string;
  confirmValueLabel?: string;
  onConfirm: () => void | Promise<void>;
};

/** Generic confirm dialog, optionally gated by a type-to-confirm input. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  destructive = false,
  confirmValue,
  confirmValueLabel,
  onConfirm,
}: ConfirmDialogProps) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [pending, setPending] = useState(false);

  const canConfirm = !confirmValue || typed === confirmValue;

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setTyped('');
  }

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
      setTyped('');
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {confirmValue ? (
          <div className="space-y-2">
            <Label htmlFor="confirm-dialog-value">{confirmValueLabel}</Label>
            <Input
              id="confirm-dialog-value"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {t('cancel')}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={pending || !canConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
