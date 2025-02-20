"use client";

import React, { useState, useEffect } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./Wallet.module.css";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""); // ✅ Use ENV variable

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
        process.env.NEXT_PUBLIC_STRIPE_CLIENT_SECRET || "", // ✅ Use environment variable
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        }
      );

      if (error) {
        console.error("❌ Payment error:", error);
        setMessage(error.message || "❌ An error occurred.");
      } else if (paymentIntent?.status === "succeeded") {
        setMessage("✅ Payment successful!");
      }
    } catch (err: unknown) {
      console.error("❌ Payment failed:", err);
      setMessage("❌ An error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.paymentForm}>
      <h2 className={styles.formTitle}>Make a Transaction</h2>
      <div className={styles.cardInput}>
        <CardElement />
      </div>
      <button
        className={styles.submitButton}
        type="submit"
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? "Processing..." : "Pay"}
      </button>
      {message && <div className={styles.message}>{message}</div>}
    </form>
  );
};

const WalletPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wallet, setWallet] = useState<{ address: string; balance: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const fetchWallet = async () => {
        try {
          const res = await fetch("/api/wallet");
          const data = await res.json();
          if (res.ok) {
            setWallet(data.wallet);
          } else {
            console.error("Failed to load wallet:", data.message);
          }
        } catch (error: unknown) {
          console.error("Error fetching wallet:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchWallet();
    }
  }, [status, router]);

  if (loading) return <p>Loading...</p>;
  if (!wallet) return <p>Wallet could not be loaded.</p>;

  return (
    <div className={styles.walletContainer}>
      <h1 className={styles.title}>Wallet</h1>
      <p className={styles.description}>
        Welcome, {session?.user?.name || "User"}! Here is your wallet:
      </p>
      <div className={styles.walletInfo}>
        <p><strong>Wallet Address:</strong> {wallet.address}</p>
        <p><strong>Balance:</strong> {wallet.balance} ETH</p>
      </div>
      <Elements stripe={stripePromise}>
        <PaymentForm />
      </Elements>
    </div>
  );
};

export default WalletPage;