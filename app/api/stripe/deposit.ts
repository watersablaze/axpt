import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia", // ✅ Upgrade to latest version
});

export async function POST(req: Request) {
  try {
    const { userAddress, amount } = await req.json();

    if (!userAddress || !amount) {
      return NextResponse.json({ success: false, message: "Missing parameters" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Deposit to Wallet" },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?cancel=true`,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error("❌ Stripe Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}