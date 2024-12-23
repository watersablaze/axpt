"use client";

import React from "react";
import PaymentForm from "../../components/PaymentForm";
import styles from "./Wallet.module.css";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Load the Stripe object with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const Wallet = () => {
  return (
    <div className={styles.walletContainer}>
      <h1 className={styles.title}>Transaction Portal</h1>
      <p className={styles.description}>
        Use this portal to make secure transactions with Axis Point.
      </p>
      <PaymentForm />
      <Elements stripe={stripePromise}>
      </Elements>
    </div>
  );
};

export default Wallet;