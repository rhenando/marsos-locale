// content.jsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ThankYouPage() {
  const router = useRouter();
  const { locale } = router;
  const isAr = locale === "ar";

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push(isAr ? "/ar" : "/");
    }, 10000);
    return () => clearTimeout(timeout);
  }, [router, isAr]);

  return (
    <section className='px-6 py-20 min-h-[70vh] flex items-center justify-center text-center'>
      <div className='max-w-xl'>
        <h1 className='text-4xl font-bold text-primary mb-6'>
          {isAr ? "🎉 شكراً لتواصلك معنا!" : "🎉 Thanks for Reaching Out!"}
        </h1>

        <p className='text-lg text-muted-foreground mb-8 whitespace-pre-line'>
          {isAr
            ? "لقد تلقينا استفسارك وسنقوم بالرد عليك خلال يوم عمل واحد.\n\nبالإضافة إلى ذلك، يمكنك تصفح منتجاتنا أو التحقق من أفضل العروض أثناء انتظارك."
            : "We’ve received your inquiry and will get back to you within one business day.\n\nIn the meantime, feel free to browse our products or check out our best deals."}
        </p>

        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Button asChild className='bg-primary text-primary-foreground'>
            <Link href={isAr ? "/ar" : "/"}>
              {isAr ? "متابعة التسوق" : "Continue Shopping"}
            </Link>
          </Button>
          <Button
            variant='outline'
            asChild
            className='border-primary text-primary'
          >
            <Link
              href={
                isAr
                  ? "/ar/collections/best-sellers"
                  : "/collections/best-sellers"
              }
            >
              {isAr ? "أفضل العروض" : "Shop Best Sellers"}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
