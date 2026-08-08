import type { ReactNode } from 'react';
import { Leaf } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 p-4">
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
        <Leaf className="text-primary" />
        <span>{siteConfig.name}</span>
      </Link>
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
    </div>
  );
}
