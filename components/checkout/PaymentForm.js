// components/PaymentForm.js

"use client";

import { useEffect, useState } from "react";

export default function PaymentForm({ amount, currency, paymentType }) {
  const [checkoutId, setCheckoutId] = useState(null);

  useEffect(() => {
    const initiateCheckout = async () => {
      try {
        const response = await fetch("/api/hyperpay/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, currency, paymentType }),
        });

        const data = await response.json();
        console.log("🧾 HyperPay response:", data);

        if (data.id) {
          setCheckoutId(data.id);
        } else {
          console.error(
            "❌ Failed to receive valid checkoutId from API:",
            data
          );
        }
      } catch (error) {
        console.error("🔥 Error fetching checkout ID:", error);
      }
    };

    initiateCheckout();
  }, [amount, currency, paymentType]);

  useEffect(() => {
    if (checkoutId) {
      const script = document.createElement("script");
      script.src = `https://eu-test.oppwa.com/v1/paymentWidgets.js?checkoutId=${checkoutId}`;
      script.async = true;
      document.body.appendChild(script);

      // Optional cleanup if needed
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [checkoutId]);

  return (
    <div>
      {checkoutId ? (
        <form
          action='/payment/result'
          className='paymentWidgets'
          data-brands='VISA MASTER MADA'
        ></form>
      ) : (
        <p className='text-red-500'>Initializing payment widget…</p>
      )}
    </div>
  );
}
