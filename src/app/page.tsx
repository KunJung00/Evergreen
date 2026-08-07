import Link from 'next/link';

import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// NOTE: All copy here is placeholder and hardcoded. Phase 3 moves this page under
// `[locale]/(marketing)` and replaces every string with next-intl message keys (R8).
export default function LandingPage() {
  const features = [
    { title: 'Habit Tracker', desc: 'Track daily habits with streaks and a yearly heatmap.' },
    { title: 'Subscriptions', desc: 'Stripe monthly & yearly billing with entitlement gating.' },
    { title: 'i18n ready', desc: 'Thai and English out of the box with next-intl.' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-24 sm:py-32">
          <Container className="flex flex-col items-center text-center">
            <span className="mb-4 rounded-full border px-3 py-1 text-xs text-muted-foreground">
              SaaS Starter Template
            </span>
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
              Build habits that stick
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              A production-ready Next.js 14 template — auth, billing, i18n, and a full habit tracker
              feature on top.
            </p>
            <div className="mt-8 flex gap-4">
              <Button size="lg" asChild>
                <Link href="/register">Get started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </Container>
        </section>

        <section className="pb-24">
          <Container className="grid gap-6 sm:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <CardTitle className="text-xl">{f.title}</CardTitle>
                  <CardDescription>{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}
