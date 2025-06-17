// app/[locale]/page.js (or page.jsx)
import HomeContent from "../HomeContent";

export const dynamic = "force-dynamic";

// This works with Next.js 13/14 App Router & next-intl
export async function generateMetadata({ params }) {
  const { locale } = await params;

  // Localized meta data
  const meta =
    locale === "ar"
      ? {
          title: "مرصوص - منصة مرصوص لخدمات التسويق الصناعي و التحول الرقمي",
          description:
            "مرصوص | اكتشف أفضل المنتجات الصناعية من المصانع السعودية مباشرة بجودة عالية وأسعار منافسة لقطاع الاعمال.",
          keywords:
            "مرصوص, صنع في السعودية, المصانع السعوية, الموردون, منتجات المملكة العربية السعودية, المنتجات السعودية بالجملة, سعر المصنع",
          url: "https://marsos.sa/ar",
          ogImage: "https://marsos.sa/og-image-ar.png",
          ogLocale: "ar-SA",
        }
      : {
          title:
            "Marsos | Marsos SA for Saudi Industrial Marketing and Digital Transformation",
          description:
            "Marsos – Discover top Saudi industrial products on Marsos with premium quality and competitive prices from the kingdom of Saudi Arabia.",
          keywords:
            "Saudi manufactured products, Made in Saudi Arabia, Saudi manufacturers, Saudi suppliers, Saudi Arabia products, Wholesale Saudi products, Local Saudi products",
          url: "https://marsos.sa/",
          ogImage: "https://marsos.sa/og-image-en.png",
          ogLocale: "en-US",
        };

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: meta.url,
      languages: {
        ar: "https://marsos.sa/ar",
        en: "https://marsos.sa/",
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: meta.url,
      images: [meta.ogImage],
      locale: meta.ogLocale,
    },
  };
}

export default function HomePage() {
  return <HomeContent />;
}
