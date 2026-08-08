import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { signOut } from '@/server/actions/auth.actions';

/** Sign out via server action; clears the Supabase session cookies. */
export function SignOutButton() {
  const t = useTranslations('nav');
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" size="sm">
        {t('signOut')}
      </Button>
    </form>
  );
}
