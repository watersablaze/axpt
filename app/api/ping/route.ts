export async function GET() {
  return new Response(JSON.stringify({ pong: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
