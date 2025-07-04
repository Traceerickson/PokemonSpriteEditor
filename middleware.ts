import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect API routes that require authentication
        if (req.nextUrl.pathname.startsWith("/api/projects")) {
          return !!token
        }
        return true
      },
    },
  },
)

export const config = {
  matcher: ["/api/projects/:path*"],
}
