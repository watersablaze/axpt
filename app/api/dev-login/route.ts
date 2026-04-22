import { NextResponse } from "next/server"

export async function GET() {

  const res = NextResponse.redirect(
    new URL("/admin/treasury", "http://localhost:3000")
  )

  res.cookies.set("dev_actor_email", "connect@axpt.io", {
    path: "/",
    httpOnly: false
  })

  return res
}