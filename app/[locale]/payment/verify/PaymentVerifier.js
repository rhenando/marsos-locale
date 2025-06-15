"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PaymentVerifier() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const resourcePath = searchParams.get("resourcePath");
    const userId = searchParams.get("userId");
    const supplierId = searchParams.get("supplierId");

    if (!resourcePath || !userId || !supplierId) {
      router.replace("/payment-failed?error=missing-info");
      return;
    }

    window.location.href = `https://marsos.com.sa/api3/api/payment-status?resourcePath=${resourcePath}&userId=${userId}&supplierId=${supplierId}`;
  }, [searchParams, router]);

  return (
    <div className='flex items-center justify-center h-[60vh]'>
      <p className='text-gray-600'>Verifying your payment, please wait...</p>
    </div>
  );
}
