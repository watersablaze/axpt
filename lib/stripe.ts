import Stripe from "stripe";

// ✅ Ensure Stripe Secret Key is set
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("❌ Missing STRIPE_SECRET_KEY in environment variables");
}

// ✅ Initialize Stripe with the latest API version
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia", // ✅ Use latest API version
});

// ✅ Alternative: Use default account version
// export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: null, // Uses the account's default version
// });