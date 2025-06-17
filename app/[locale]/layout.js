import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";
import localFont from "next/font/local";
import { Montserrat } from "next/font/google";
import RootProvider from "../RootProvider";

const saudiWeb = localFont({
  src: [
    { path: "../fonts/SaudiWeb-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/SaudiWeb-Bold.woff2", weight: "700", style: "bold" },
  ],
  variable: "--font-saudiweb",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export default async function LocaleLayout({ children, params }) {
  // ✅ Await params
  const { locale } = await params;

  // Validate locale
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Load messages for SSR/SSG
  const messages = (await import(`../../messages/${locale}.json`)).default;

  const dir = locale === "ar" ? "rtl" : "ltr";
  const fontClass = `${montserrat.variable} ${saudiWeb.variable} antialiased`;

  return (
    <html lang={locale} dir={dir}>
      <body
        className={fontClass}
        style={{
          fontFamily:
            locale === "ar"
              ? "'SaudiWeb', var(--font-saudiweb), sans-serif"
              : "'Montserrat', var(--font-montserrat), sans-serif",
        }}
      >
        {/* ✅ Pass locale & messages */}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <RootProvider>{children}</RootProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
