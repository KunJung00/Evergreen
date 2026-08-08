import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';

import { RoleSelect } from '@/components/admin/role-select';
import { SubscriptionStatusBadge } from '@/components/admin/subscription-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { requireAdmin } from '@/lib/auth/require-admin';
import { getSubscriptionForUser, getUserById } from '@/server/queries/admin.queries';

type Props = { params: Promise<{ locale: string; id: string }> };

export const dynamic = 'force-dynamic';

export default async function AdminUserDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);

  const admin = await requireAdmin();
  const t = await getTranslations('admin.userDetail');
  const format = await getFormatter();

  const user = await getUserById(id);
  if (!user) notFound();

  const subscription = await getSubscriptionForUser(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="size-4" />
            {t('back')}
          </Link>
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{user.full_name ?? user.email}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('profile')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Field label={t('fields.role')}>
              <RoleSelect userId={user.id} role={user.role} disabled={user.id === admin.id} />
            </Field>
            <Field label={t('fields.locale')}>{user.locale.toUpperCase()}</Field>
            <Field label={t('fields.joined')}>
              {format.dateTime(new Date(user.created_at), { dateStyle: 'long' })}
            </Field>
            <Field label={t('fields.userId')}>
              <code className="text-xs text-muted-foreground">{user.id}</code>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('subscription')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {subscription ? (
              <>
                <Field label={t('fields.status')}>
                  <SubscriptionStatusBadge status={subscription.status} />
                </Field>
                <Field label={t('fields.renews')}>
                  {subscription.current_period_end
                    ? format.dateTime(new Date(subscription.current_period_end), {
                        dateStyle: 'long',
                      })
                    : '—'}
                </Field>
                <Field label={t('fields.subscriptionId')}>
                  <code className="text-xs text-muted-foreground">{subscription.id}</code>
                </Field>
              </>
            ) : (
              <p className="text-muted-foreground">{t('noSubscription')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}
