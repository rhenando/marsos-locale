"use client";

import { useSearchParams } from "next/navigation";

export default function PaymentPendingContent() {
  const params = useSearchParams();

  return (
    <div className='max-w-md mx-auto mt-10 px-6 py-8 bg-white border rounded shadow'>
      <h1 className='text-xl font-bold mb-4 text-center text-[#2c6449]'>
        Payment Pending
      </h1>
      <p>
        <strong>Invoice No:</strong> {params.get("invoice")}
      </p>
      <p>
        <strong>SADAD No:</strong> {params.get("sadad")}
      </p>
      <p>
        <strong>Amount:</strong> {params.get("amount")} SAR
      </p>
      <p>
        <strong>Issued:</strong> {params.get("issue")}
      </p>
      <p>
        <strong>Expires:</strong> {params.get("expire")}
      </p>
      <p className='text-sm text-gray-600 mt-4'>
        Please pay using the SADAD number within 3 days. After payment, your
        order will be processed automatically.
      </p>
    </div>
  );
}
