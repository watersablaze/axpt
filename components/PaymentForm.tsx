"use client";

import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import styles from "./PaymentForm.module.css";

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setMessage("❌ Stripe has not loaded yet.");
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        process.env.NEXT_PUBLIC_STRIPE_CLIENT_SECRET || "",
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        }
      );

      if (error) {
        setMessage(error.message || "❌ An error occurred.");
      } else if (paymentIntent?.status === "succeeded") {
        setMessage("✅ Payment successful!");
      }
    } catch (err: unknown) {
      console.error("❌ Payment error:", err);
      setMessage("❌ Payment failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.paymentFormContainer}>
      <div className={styles.cardInput}>
        <CardElement />
      </div>
      <button className={styles.submitButton} type="submit" disabled={isProcessing}>
        {isProcessing ? "Processing..." : "Pay"}
      </button>
      {message && <div className={styles.message}>{message}</div>}
    </form>
  );
};

export default PaymentForm;