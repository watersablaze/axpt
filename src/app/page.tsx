"use client"

import React from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import Footer from '../components/Footer';
import PaymentForm from '../components/PaymentForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Load the Stripe object with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');


export default function Home() {
  return (
    <main>
      <Header />
      <HeroSection />
    <Elements stripe={stripePromise}>
      <PaymentForm />
      </Elements>
      <Footer />
    </main>
  );
}