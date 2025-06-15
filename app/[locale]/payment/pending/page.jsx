"use client";

import { Suspense } from "react";
import PaymentPendingContent from "./PaymentPendingContent";

export default function PaymentPendingPage() {
  return (
    <Suspense
      fallback={<p className='text-center mt-10'>Loading payment info...</p>}
    >
      <PaymentPendingContent />
    </Suspense>
  );
}
