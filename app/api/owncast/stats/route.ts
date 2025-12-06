// app/api/owncast/stats/route.ts
import { NextResponse } from 'next/server';

const OWNCAT_URL = "http://owncast:8080/api/stats";

export async function GET() {
  try {
    const res = await fetch(OWNCAT_URL, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json({ error: "Owncast unreachable" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Owncast connection error" }, { status: 500 });
  }
}