import type { ReactNode } from "react";

import { routing } from "@/i18n/routing";
import { Providers } from "@/components/Providers";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div lang={locale} dir={dir}>
      <Providers>{children}</Providers>
    </div>
  );
}
