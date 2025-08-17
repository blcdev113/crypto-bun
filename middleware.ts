import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the referral code from query parameters
  const refCode = request.nextUrl.searchParams.get('ref')
  
  // Create response object
  const response = NextResponse.next()
  
  // If referral code exists, save it to cookie
  if (refCode) {
    // Set cookie to expire in 30 days
    const expires = new Date()
    expires.setDate(expires.getDate() + 30)
    
    response.cookies.set('ref', refCode, {
      expires,
      httpOnly: false, // Allow client-side access for Supabase integration
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
  }
  
  return response
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}