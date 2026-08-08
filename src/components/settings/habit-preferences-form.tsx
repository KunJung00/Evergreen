'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';

import { SubmitButton } from '@/components/shared/submit-button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { updateProfilePreferences } from '@/server/actions/profile.actions';
import { preferencesSchema, type PreferencesInput } from '@/server/validators/profile.schema';

const TIMEZONES = Intl.supportedValuesOf('timeZone');

type HabitPreferencesFormProps = {
  timezone: string;
  weekStart: 0 | 1;
  weeklyEmailOptIn: boolean;
};

export function HabitPreferencesForm({
  timezone,
  weekStart,
  weeklyEmailOptIn,
}: HabitPreferencesFormProps) {
  const t = useTranslations('settings.profile');
  const tErrors = useTranslations('settings.errors');
  const te = (code: string) => tErrors(code as never);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm<PreferencesInput>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: { timezone, weekStart, weeklyEmailOptIn },
  });
  const { isSubmitting } = form.formState;

  async function onSubmit(values: PreferencesInput) {
    setFormError(null);
    setSaved(false);
    const result = await updateProfilePreferences(values);
    if (!result.success) {
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
        <Label htmlFor="timezone">{t('timezoneLabel')}</Label>
        <Controller
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="weekStart">{t('weekStartLabel')}</Label>
        <Controller
          control={form.control}
          name="weekStart"
          render={({ field }) => (
            <Select
              value={String(field.value)}
              onValueChange={(value) => field.onChange(Number(value) as 0 | 1)}
            >
              <SelectTrigger id="weekStart">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t('weekStartSunday')}</SelectItem>
                <SelectItem value="1">{t('weekStartMonday')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="weeklyEmailOptIn">{t('weeklyEmailLabel')}</Label>
        <Controller
          control={form.control}
          name="weeklyEmailOptIn"
          render={({ field }) => (
            <Switch id="weeklyEmailOptIn" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
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
