// app/ar/page.jsx

import HomeContentAr from "../HomeContentAr";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const title = "مرصوص - منصة مرصوص لخدمات التسويق الصناعي و التحول الرقمي";
  const description =
    "مرصوص – اكتشف أفضل المنتجات الصناعية من المصانع السعودية مباشرة بجودة عالية وأسعار منافسة لقطاع الاعمال.";
  const keywords =
    "مرصوص, صنع في السعودية, المصانع السعوية, الموردون, منتجات المملكة العربية السعودية, المنتجات السعودية بالجملة, سعر المصنع";
  const url = "https://marsos.sa/saudi-ar";
  const ogImage = "https://marsos.sa/og-image-ar.png";
  const ogLocale = "ar-SA";

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
      languages: {
        ar: "https://marsos.sa/saudi-ar",
        en: "https://marsos.sa", // replace this if your English homepage is under `/en`
      },
    },
    openGraph: {
      title,
      description,
      url,
      images: [ogImage],
      locale: ogLocale,
    },
  };
}

export default function ArabicHomePage() {
  return <HomeContentAr />;
}
