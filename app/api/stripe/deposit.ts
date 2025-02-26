import { NextResponse } from "next/server";
import Stripe from "stripe";

// ✅ Ensure Stripe Secret Key is available
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("❌ STRIPE_SECRET_KEY is not set in environment variables.");
}

// ✅ Use the latest API version required by Stripe's TypeScript types
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia", // ✅ No TypeScript error
} as Stripe.StripeConfig);

// ✅ Define the expected request body structure
interface StripeRequestBody {
  userAddress: string;
  amount: number;
}

export async function POST(req: Request) {
  try {
    const body: StripeRequestBody = await req.json();

    // ✅ Validate user address
    if (!body.userAddress || typeof body.userAddress !== "string") {
      return NextResponse.json({ success: false, message: "Invalid or missing user address" }, { status: 400 });
    }

    // ✅ Validate amount (ensure it's a positive number)
    if (!body.amount || isNaN(body.amount) || body.amount <= 0) {
      return NextResponse.json({ success: false, message: "Invalid or missing amount" }, { status: 400 });
    }

    // ✅ Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Deposit to Wallet" },
            unit_amount: Math.round(body.amount * 100), // Convert dollars to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?cancel=true`,
    });

    // ✅ Ensure session URL is returned
    if (!session.url) {
      return NextResponse.json({ success: false, message: "Failed to create Stripe session" }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: session.url });
  } catch (error) {
    console.error("❌ Stripe Error:", error);

    // ✅ Proper error handling
    const errorMessage = error instanceof Error ? error.message : "Unexpected error occurred";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}