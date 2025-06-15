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
          {isAr ? "🎉 شكراً لتواصلك!" : "🎉 Thanks for Reaching Out!"}
        </h1>

        <p className='text-lg text-muted-foreground mb-8'>
          {isAr
            ? "لقد استلمنا رسالتك وسنرد عليك خلال يوم عمل واحد.\n\nسيتم إعادة توجيهك إلى الصفحة الرئيسية قريبًا."
            : "We’ve received your message and will get back to you within one business day.\n\nYou’ll be redirected to the homepage shortly."}
        </p>

        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Button asChild className='bg-primary text-primary-foreground'>
            <Link href={isAr ? "/ar" : "/"}>
              {isAr ? "العودة إلى الرئيسية" : "Back to Home"}
            </Link>
          </Button>
          <Button
            variant='outline'
            asChild
            className='border-primary text-primary'
          >
            <Link href={isAr ? "/ar/portfolio" : "/portfolio"}>
              {isAr ? "عرض أعمالنا" : "See Our Work"}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
