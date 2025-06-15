"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { db } from "@/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

export default function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);
  const transactionId = searchParams.get("transactionId");

  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!transactionId) return;

    const verifyPayment = async () => {
      try {
        const res = await fetch("/api/hyperpay/manual-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ merchantTransactionId: transactionId }),
        });

        const data = await res.json();
        setResult(data);

        if (data.result?.code?.startsWith("000.")) {
          await addDoc(collection(db, "orders"), {
            userId: user?.uid || "unknown",
            userEmail: user?.email || "unknown",
            result: data.result,
            createdAt: serverTimestamp(),
            paymentMethod: "Card",
            transactionId: data.ndc || transactionId,
          });

          router.replace("/orders");
        } else {
          toast.error("❌ Payment failed or incomplete.");
        }
      } catch (error) {
        console.error("Failed to manually verify payment:", error);
        toast.error("Something went wrong.");
      }
    };

    verifyPayment();
  }, [transactionId]);

  if (!transactionId) return <p>❌ Missing transaction ID.</p>;
  if (!result) return <p>🔄 Verifying payment...</p>;

  return (
    <div className='container mx-auto p-6'>
      <h1 className='text-xl font-bold mb-4'>Payment Result</h1>
      <pre className='bg-gray-100 p-4 rounded text-sm overflow-x-auto'>
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
