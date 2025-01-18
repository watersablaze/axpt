import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login", // Redirect to this page if not authenticated
  },
});

// Configure specific routes to protect
export const config = {
  matcher: ["/dashboard", "/profile", "/settings"], // Protect these routes
};