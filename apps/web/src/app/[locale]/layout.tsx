import type { ReactNode } from "react";

import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AppShellLayout } from "@/components/layout/AppShellLayout";
import { Providers } from "@/components/Providers";
import { routing } from "@/i18n/routing";

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
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div lang={locale} dir={dir}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <Providers>
          <AppShellLayout>{children}</AppShellLayout>
        </Providers>
      </NextIntlClientProvider>
    </div>
  );
}
