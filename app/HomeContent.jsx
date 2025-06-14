"use client";

// ✅ English-only homepage content
import dynamic from "next/dynamic";
import CategoryGrid from "@/components/home/CategoryGrid";

const HeroSection = dynamic(() => import("@/components/home/HeroSection"), {
  ssr: false,
});
const TrendingProductsSection = dynamic(
  () => import("@/components/home/TrendingProductsSection"),
  { ssr: false }
);

export default function HomeContent() {
  return (
    <main className='flex flex-col' dir='ltr' lang='en'>
      <HeroSection />
      <TrendingProductsSection />
      <CategoryGrid />
    </main>
  );
}
