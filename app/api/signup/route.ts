// 🔒 Temporarily disabled for clean deploy.

export async function POST() {
  return new Response("🔒 Temporarily paused", { status: 503 });
}
