import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe"; // ✅ Use the centralized Stripe instance

export async function POST(request: Request) {
  try {
    const { amount, currency } = await request.json();
 
    if (!amount || !currency) {
      return NextResponse.json({ error: "Invalid request: Amount and currency are required" }, { status: 400 });
    }

    // ✅ Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert dollars to cents
      currency,
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("❌ Stripe Error:", error);
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 });
  }
}