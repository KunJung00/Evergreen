'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { SubmitButton } from '@/components/shared/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile } from '@/server/actions/profile.actions';
import { updateProfileSchema, type UpdateProfileInput } from '@/server/validators/profile.schema';

type ProfileFormProps = {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export function ProfileForm({ email, fullName, avatarUrl }: ProfileFormProps) {
  const t = useTranslations('settings.profile');
  const tErrors = useTranslations('settings.errors');
  const te = (code: string) => tErrors(code as never);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { fullName: fullName ?? '', avatarUrl: avatarUrl ?? '' },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: UpdateProfileInput) {
    setFormError(null);
    setSaved(false);
    const result = await updateProfile({
      fullName: values.fullName?.trim() ? values.fullName.trim() : null,
      avatarUrl: values.avatarUrl?.trim() ? values.avatarUrl.trim() : null,
    });
    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          form.setError(field as keyof UpdateProfileInput, { message: messages[0] });
        }
        return;
      }
      setFormError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>
      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {te(formError)}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input id="email" value={email} disabled readOnly />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">{t('nameLabel')}</Label>
        <Input id="fullName" {...form.register('fullName')} />
        {errors.fullName?.message && (
          <p className="text-sm text-destructive">{te(errors.fullName.message)}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatarUrl">{t('avatarLabel')}</Label>
        <Input id="avatarUrl" {...form.register('avatarUrl')} />
        {errors.avatarUrl?.message && (
          <p className="text-sm text-destructive">{te(errors.avatarUrl.message)}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton type="submit" isPending={isSubmitting}>
          {t('save')}
        </SubmitButton>
        {saved ? <span className="text-sm text-muted-foreground">{t('saved')}</span> : null}
      </div>
    </form>
  );
}
