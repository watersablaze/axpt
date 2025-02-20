import Stripe from "stripe";
import { NextResponse } from "next/server";

// Initialize Stripe with the correct API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-01-27.acacia", // ✅ Fixed API version
});

export async function POST(req: Request) {
  try {
    // Parse the JSON body from the request
    const body: { amount: number } = await req.json();

    // Validate amount
    if (!body.amount || body.amount <= 0 || isNaN(body.amount)) {
      return NextResponse.json(
        { error: "Invalid amount. Amount must be a positive number." },
        { status: 400 }
      );
    }

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(body.amount * 100), // Convert amount to cents
      currency: "usd", // Adjust currency as needed
      automatic_payment_methods: { enabled: true },
    });

    // Return the clientSecret
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error creating payment intent:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 });
  }
}