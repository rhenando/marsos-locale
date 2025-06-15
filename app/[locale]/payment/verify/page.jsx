import { Suspense } from "react";
import PaymentVerifier from "./PaymentVerifier";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentVerifier />
    </Suspense>
  );
}
