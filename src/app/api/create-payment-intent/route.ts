import Stripe from 'stripe';
import { NextResponse } from 'next/server';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia', // Use the full API version including ".acadia"
});

export async function POST(req: Request) {
  try {
    // Parse the JSON body from the request
    const body = await req.json();

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: body.amount, // Amount in cents
      currency: 'usd', // Adjust currency as needed
      automatic_payment_methods: { enabled: true },
    });

    // Return the clientSecret
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Error creating payment intent:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 } // Server error response
    );
  }
}