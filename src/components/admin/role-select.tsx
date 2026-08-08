'use client';

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { RoleBadge } from '@/components/admin/role-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from '@/i18n/navigation';
import { updateUserRole } from '@/server/actions/admin.actions';
import { userRoleSchema, type UserRole } from '@/server/validators/admin.schema';

const ROLES = userRoleSchema.options;

const ERROR_KEYS = [
  'validation',
  'cannotChangeSelf',
  'userNotFound',
  'updateFailed',
  'generic',
] as const;
type ErrorKey = (typeof ERROR_KEYS)[number];

function toErrorKey(error: string): ErrorKey {
  return (ERROR_KEYS as readonly string[]).includes(error) ? (error as ErrorKey) : 'generic';
}

type RoleSelectProps = {
  userId: string;
  role: UserRole;
  /** The admin cannot change their own role (server enforces this too). */
  disabled?: boolean;
};

/** Inline role changer backed by the `updateUserRole` Server Action. */
export function RoleSelect({ userId, role, disabled = false }: RoleSelectProps) {
  const t = useTranslations('admin.users');
  const tErrors = useTranslations('admin.errors');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSelect(next: UserRole) {
    if (next === role) return;
    setError(null);
    startTransition(async () => {
      const result = await updateUserRole({ userId, role: next });
      if (!result.success) {
        setError(tErrors(toErrorKey(result.error)));
        return;
      }
      router.refresh();
    });
  }

  if (disabled) {
    return <RoleBadge role={role} />;
  }

  return (
    <div className="flex flex-col gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            aria-label={t('changeRole')}
            className="gap-1.5"
          >
            <RoleBadge role={role} />
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {ROLES.map((option) => (
            <DropdownMenuItem
              key={option}
              onSelect={() => onSelect(option)}
              disabled={option === role}
            >
              {t(`role.${option}` as 'role.user' | 'role.admin')}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
