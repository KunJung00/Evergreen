'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { HabitFormDialog } from '@/components/habits/habit-form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useRouter } from '@/i18n/navigation';
import { archiveHabit, deleteHabit, reorderHabits } from '@/server/actions/habits';
import type { Habit } from '@/types';

type HabitManageListProps = {
  active: Habit[];
  archived: Habit[];
  limit: number;
};

export function HabitManageList({ active: initialActive, archived, limit }: HabitManageListProps) {
  const t = useTranslations('habits.manage');
  const tToast = useTranslations('habits.toast');
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Re-sync local order with the server after create/archive/delete/restore
  // (each of those calls router.refresh() but doesn't touch local state).
  // Drag reorder sets local state first, then the refreshed prop matches it.
  useEffect(() => {
    setActive(initialActive);
  }, [initialActive]);

  const atLimit = active.length >= limit;

  function handleDragEnd(event: DragEndEvent) {
    const { active: draggedItem, over } = event;
    if (!over || draggedItem.id === over.id) return;
    const oldIndex = active.findIndex((h) => h.id === draggedItem.id);
    const newIndex = active.findIndex((h) => h.id === over.id);
    const next = arrayMove(active, oldIndex, newIndex);
    setActive(next);
    startTransition(async () => {
      const result = await reorderHabits({ ids: next.map((h) => h.id) });
      if (result.success) {
        toast.success(tToast('reordered'));
      }
      router.refresh();
    });
  }

  function handleArchive(id: string, archivedFlag: boolean) {
    startTransition(async () => {
      const result = await archiveHabit(id, archivedFlag);
      if (result.success) {
        toast.success(tToast(archivedFlag ? 'archived' : 'restored'));
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteHabit(id);
      if (result.success) {
        toast.success(tToast('deleted'));
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {t('usage', { count: active.length, limit })}
        </span>
        <HabitFormDialog
          trigger={
            <Button disabled={atLimit}>
              <Plus className="size-4" />
              {t('create')}
            </Button>
          }
        />
      </div>
      {atLimit ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">{t('upgrade')}</p>
      ) : null}

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">{t('active')}</TabsTrigger>
          <TabsTrigger value="archived">{t('archived')}</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-2">
          {active.length === 0 ? (
            <EmptyState title={t('subtitle')} />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={active.map((h) => h.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {active.map((habit) => (
                    <SortableHabitRow
                      key={habit.id}
                      habit={habit}
                      onArchive={() => handleArchive(habit.id, true)}
                      onDelete={() => handleDelete(habit.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>

        <TabsContent value="archived" className="space-y-2">
          {archived.length === 0 ? (
            <EmptyState title={t('noArchived')} />
          ) : (
            <ul className="space-y-2">
              {archived.map((habit) => (
                <ArchivedHabitRow
                  key={habit.id}
                  habit={habit}
                  onRestore={() => handleArchive(habit.id, false)}
                  onDelete={() => handleDelete(habit.id)}
                />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

type RowProps = { habit: Habit; onDelete: () => void };

function SortableHabitRow({ habit, onArchive, onDelete }: RowProps & { onArchive: () => void }) {
  const t = useTranslations('habits.manage');
  const tConfirm = useTranslations('habits.confirm');
  const tFrequency = useTranslations('habits.frequency');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: habit.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-md border bg-card px-3 py-2"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="text-lg">{habit.icon}</span>
      <Link
        href={`/dashboard/habits/${habit.id}`}
        className="flex-1 truncate font-medium hover:underline"
      >
        {habit.name}
      </Link>
      <Badge variant="outline">{tFrequency(habit.frequency)}</Badge>
      <HabitFormDialog
        habit={habit}
        trigger={
          <Button variant="ghost" size="sm">
            {t('edit')}
          </Button>
        }
      />
      <Button variant="ghost" size="sm" onClick={onArchive}>
        {t('archive')}
      </Button>
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="sm" className="text-destructive">
            {t('delete')}
          </Button>
        }
        title={tConfirm('deleteTitle')}
        description={tConfirm('deleteBody')}
        confirmLabel={tConfirm('deleteConfirmLabel')}
        destructive
        confirmValue={habit.name}
        confirmValueLabel={tConfirm('typeNameLabel')}
        onConfirm={onDelete}
      />
    </li>
  );
}

function ArchivedHabitRow({ habit, onRestore, onDelete }: RowProps & { onRestore: () => void }) {
  const t = useTranslations('habits.manage');
  const tConfirm = useTranslations('habits.confirm');

  return (
    <li className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 opacity-70">
      <span className="text-lg">{habit.icon}</span>
      <span className="flex-1 truncate font-medium">{habit.name}</span>
      <Button variant="ghost" size="sm" onClick={onRestore}>
        {t('restore')}
      </Button>
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="sm" className="text-destructive">
            {t('delete')}
          </Button>
        }
        title={tConfirm('deleteTitle')}
        description={tConfirm('deleteBody')}
        confirmLabel={tConfirm('deleteConfirmLabel')}
        destructive
        confirmValue={habit.name}
        confirmValueLabel={tConfirm('typeNameLabel')}
        onConfirm={onDelete}
      />
    </li>
  );
}
