'use client';

import { useTranslations } from 'next-intl';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { deleteAccount } from '@/server/actions/profile.actions';

export function DeleteAccountButton({ email }: { email: string }) {
  const t = useTranslations('settings.danger');

  return (
    <ConfirmDialog
      trigger={<Button variant="destructive">{t('deleteButton')}</Button>}
      title={t('confirmTitle')}
      description={t('confirmDescription')}
      confirmLabel={t('confirmButton')}
      destructive
      confirmValue={email}
      confirmValueLabel={t('confirmInputLabel')}
      onConfirm={() => deleteAccount()}
    />
  );
}
