'use client';

import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import styles from './Wallet.module.css';

const stripePromise = loadStripe('your_publishable_key_here'); // Replace with your Stripe publishable key

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setMessage('Stripe has not loaded yet.');
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        'client_secret_from_api', // Replace with your actual client secret
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        }
      );

      if (error) {
        setMessage(error.message || 'An error occurred.');
      } else if (paymentIntent?.status === 'succeeded') {
        setMessage('Payment successful!');
      }
    } catch (err) {
      setMessage('An error occurred.');
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
        {isProcessing ? 'Processing...' : 'Pay'}
      </button>
      {message && <div className={styles.message}>{message}</div>}
    </form>
  );
};

const WalletPage = () => {
  return (
    <div className={styles.walletContainer}>
      <h1 className={styles.title}>Wallet</h1>
      <p className={styles.description}>
        Manage your transactions securely with our platform.
      </p>
      <Elements stripe={stripePromise}>
        <PaymentForm />
      </Elements>
    </div>
  );
};

export default WalletPage;