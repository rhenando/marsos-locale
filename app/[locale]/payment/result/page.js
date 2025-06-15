// app/payment/result/page.jsx
"use client";

import { Suspense } from "react";
import PaymentResultContent from "./content";

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<p>🔄 Verifying payment...</p>}>
      <PaymentResultContent />
    </Suspense>
  );
}
