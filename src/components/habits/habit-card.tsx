'use client';

import { useOptimistic, useTransition } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toggleHabitLog } from '@/server/actions/habits';
import type { HabitWithTodayLog } from '@/server/queries/habits';

type HabitCardProps = {
  habit: HabitWithTodayLog;
  date: string;
};

/** Toggle/stepper card for the "today" dashboard (FEATURE-SPEC §5.1). */
export function HabitCard({ habit, date }: HabitCardProps) {
  const tErrors = useTranslations('habits.errors');
  const te = (code: string) => tErrors(code as never);
  const [isPending, startTransition] = useTransition();
  const [optimisticCount, setOptimisticCount] = useOptimistic(habit.todayCount);

  const isStepper = habit.target_per_day > 1;
  const done = optimisticCount >= habit.target_per_day;

  function setCount(next: number) {
    const clamped = Math.max(0, Math.min(next, habit.target_per_day));
    startTransition(async () => {
      setOptimisticCount(clamped);
      const result = await toggleHabitLog({ habitId: habit.id, date, count: clamped });
      if (!result.success) {
        toast.error(te(result.error));
      }
    });
  }

  return (
    <Card className={cn(done && 'border-primary/50 bg-primary/5')}>
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
        <span className="text-xl">{habit.icon}</span>
        <span className="flex-1 truncate font-medium">{habit.name}</span>
      </CardHeader>
      <CardContent>
        {isStepper ? (
          <div className="space-y-2">
            <Progress value={(optimisticCount / habit.target_per_day) * 100} />
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                disabled={isPending || optimisticCount <= 0}
                onClick={() => setCount(optimisticCount - 1)}
              >
                <Minus className="size-4" />
              </Button>
              <span className="text-sm font-medium tabular-nums">
                {optimisticCount}/{habit.target_per_day}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={isPending || optimisticCount >= habit.target_per_day}
                onClick={() => setCount(optimisticCount + 1)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant={done ? 'default' : 'outline'}
            className="w-full"
            disabled={isPending}
            onClick={() => setCount(done ? 0 : 1)}
          >
            {done ? <Check className="size-4" /> : null}
            {habit.name}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
