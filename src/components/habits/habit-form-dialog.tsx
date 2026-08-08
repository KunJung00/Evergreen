'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { SubmitButton } from '@/components/shared/submit-button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { createHabit, updateHabit } from '@/server/actions/habits';
import {
  HABIT_COLORS,
  habitInputSchema,
  type HabitColor,
  type HabitInput,
} from '@/server/validators/habits.schema';
import type { Habit } from '@/types';

const EMOJI_PRESET = [
  '✅',
  '💪',
  '🏃',
  '📚',
  '💧',
  '🧘',
  '☕',
  '🚭',
  '🥗',
  '😴',
  '📖',
  '✍️',
  '🎯',
  '🧹',
  '💼',
  '🎨',
  '🎵',
  '🚴',
  '🏊',
  '🧠',
  '❤️',
  '🌱',
  '🦷',
  '💊',
  '🛌',
  '🍎',
  '🚰',
  '📵',
  '🕯️',
  '🎮',
] as const;

const COLOR_SWATCH: Record<HabitColor, string> = {
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
  lime: 'bg-lime-500',
  slate: 'bg-slate-500',
};

type HabitFormDialogProps = {
  trigger: ReactNode;
  habit?: Habit;
};

/** Create/edit dialog for a habit. `habit` present = edit mode. */
export function HabitFormDialog({ trigger, habit }: HabitFormDialogProps) {
  const t = useTranslations('habits.form');
  const tColors = useTranslations('habits.colors');
  const tFrequency = useTranslations('habits.frequency');
  const tToast = useTranslations('habits.toast');
  const tErrors = useTranslations('habits.errors');
  const te = (code: string) => tErrors(code as never);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const buildDefaults = (): HabitInput => ({
    name: habit?.name ?? '',
    icon: habit?.icon ?? '✅',
    color: (habit?.color as HabitColor) ?? 'emerald',
    frequency: habit?.frequency ?? 'daily',
    targetPerDay: habit?.target_per_day ?? 1,
    daysPerWeek: habit?.days_per_week ?? null,
  });

  const form = useForm<HabitInput>({
    resolver: zodResolver(habitInputSchema),
    defaultValues: buildDefaults(),
  });
  const { errors, isSubmitting } = form.formState;
  const frequency = form.watch('frequency');
  const icon = form.watch('icon');
  const color = form.watch('color');

  useEffect(() => {
    if (frequency === 'daily') {
      form.setValue('daysPerWeek', null);
    } else if (form.getValues('daysPerWeek') === null) {
      form.setValue('daysPerWeek', 3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frequency]);

  async function onSubmit(values: HabitInput) {
    setFormError(null);
    const result = habit ? await updateHabit(habit.id, values) : await createHabit(values);
    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          form.setError(field as keyof HabitInput, { message: messages[0] });
        }
        return;
      }
      setFormError(result.error);
      return;
    }
    toast.success(habit ? tToast('updated') : tToast('created'));
    setOpen(false);
    router.refresh();
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      // Re-seed the form each time it opens: empty for create, current values
      // for edit (defaultValues alone only apply on mount, so an edited habit
      // would otherwise show stale input on reopen).
      form.reset(buildDefaults());
      setFormError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{habit ? t('editTitle') : t('createTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {formError && (
            <p role="alert" className="text-sm text-destructive">
              {te(formError)}
            </p>
          )}

          <div className="flex items-end gap-3">
            <div className="space-y-2">
              <Label>{t('icon')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex size-10 items-center justify-center rounded-md border text-xl"
                  >
                    {icon}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="grid grid-cols-6 gap-1">
                    {EMOJI_PRESET.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => form.setValue('icon', emoji)}
                        className={cn(
                          'flex size-9 items-center justify-center rounded-md text-lg hover:bg-accent',
                          icon === emoji && 'bg-accent',
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input id="name" {...form.register('name')} />
              {errors.name?.message && (
                <p className="text-sm text-destructive">{te(errors.name.message)}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('color')}</Label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={tColors(c)}
                  onClick={() => form.setValue('color', c)}
                  className={cn(
                    'size-7 rounded-full ring-offset-2 ring-offset-background transition-shadow',
                    COLOR_SWATCH[c],
                    color === c ? 'ring-2 ring-foreground' : '',
                  )}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('frequency')}</Label>
              <Select
                value={form.watch('frequency')}
                onValueChange={(value) =>
                  form.setValue('frequency', value as HabitInput['frequency'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{tFrequency('daily')}</SelectItem>
                  <SelectItem value="weekly">{tFrequency('weekly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetPerDay">{t('targetPerDay')}</Label>
              <Input
                id="targetPerDay"
                type="number"
                min={1}
                max={20}
                {...form.register('targetPerDay', { valueAsNumber: true })}
              />
              {errors.targetPerDay?.message && (
                <p className="text-sm text-destructive">{te(errors.targetPerDay.message)}</p>
              )}
            </div>
          </div>

          {frequency === 'weekly' ? (
            <div className="space-y-2">
              <Label htmlFor="daysPerWeek">{t('daysPerWeek')}</Label>
              <Input
                id="daysPerWeek"
                type="number"
                min={1}
                max={7}
                {...form.register('daysPerWeek', { valueAsNumber: true })}
              />
              {errors.daysPerWeek?.message && (
                <p className="text-sm text-destructive">{te(errors.daysPerWeek.message)}</p>
              )}
            </div>
          ) : null}

          <SubmitButton type="submit" isPending={isSubmitting} className="w-full">
            {t('save')}
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
