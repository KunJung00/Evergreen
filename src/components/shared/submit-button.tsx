'use client';

import { Loader2 } from 'lucide-react';

import { Button, type ButtonProps } from '@/components/ui/button';

type SubmitButtonProps = ButtonProps & {
  isPending: boolean;
};

/** Button that shows a spinner and disables itself while a mutation is pending. */
export function SubmitButton({ isPending, disabled, children, ...props }: SubmitButtonProps) {
  return (
    <Button disabled={isPending || disabled} {...props}>
      {isPending ? <Loader2 className="animate-spin" /> : null}
      {children}
    </Button>
  );
}
