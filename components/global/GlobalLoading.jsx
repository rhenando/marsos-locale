"use client";

import { useEffect } from "react";
import { useLoading } from "@/context/LoadingContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

const GlobalLoading = () => {
  const { isLoading, startLoading, stopLoading } = useLoading();
  const router = useRouter();

  useEffect(() => {
    if (!router) return;

    const handleStart = () => startLoading();
    const handleComplete = () => stopLoading();
    const handleError = () => stopLoading();

    router.events?.on("routeChangeStart", handleStart);
    router.events?.on("routeChangeComplete", handleComplete);
    router.events?.on("routeChangeError", handleError);

    return () => {
      router.events?.off("routeChangeStart", handleStart);
      router.events?.off("routeChangeComplete", handleComplete);
      router.events?.off("routeChangeError", handleError);
    };
  }, [router, startLoading, stopLoading]);

  if (!isLoading) return null;

  return (
    <div className='fixed inset-0 z-[9999] bg-white flex items-center justify-center'>
      <div className='relative w-32 h-32 flex items-center justify-center'>
        {/* Ultra-thin SVG spinner */}
        <svg
          className='animate-spin'
          width='128'
          height='128'
          viewBox='0 0 50 50'
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          <circle
            cx='25'
            cy='25'
            r='20'
            fill='none'
            stroke='#e5e7eb'
            strokeWidth='.7'
          />
          <circle
            cx='25'
            cy='25'
            r='20'
            fill='none'
            stroke='#2c6449'
            strokeWidth='.7'
            strokeLinecap='round'
            strokeDasharray='100'
            strokeDashoffset='60'
          />
        </svg>
        {/* Centered Logo */}
        <Image
          src='/logo.png'
          alt='Loading Logo'
          width={70}
          height={70}
          priority
          className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain rounded-full'
        />
      </div>
    </div>
  );
};

export default GlobalLoading;
