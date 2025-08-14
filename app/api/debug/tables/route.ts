// app/api/debug/tables/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // if (process.env.NODE_ENV === 'production') return NextResponse.json({ ok:false }, { status: 404 });

  try {
    const [info] = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        current_database()                       AS db,
        current_schema()                          AS schema,
        current_user                              AS "user",
        current_setting('search_path', true)      AS search_path
    `);

    const tables = await prisma.$queryRawUnsafe<any[]>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    return NextResponse.json({
      ok: true,
      info,
      count: tables.length,
      tables: tables.map(t => t.table_name),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'unknown' }, { status: 500 });
  }
}