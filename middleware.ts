import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Feed routes that should be handled by the unified feed view
const FEED_ROUTES = [
  '/dashboard/home',
  '/dashboard/popular',
  '/dashboard/global',
  '/dashboard/saved',
  '/dashboard/history',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect dashboard root to feed view
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/dashboard/feed', request.url))
  }

  // Check if the current path is one of our feed routes
  if (FEED_ROUTES.includes(pathname)) {
    // Extract the feed type from the URL
    const feedType = pathname.split('/').pop()
    
    // Create a new URL for the unified feed view
    const url = new URL(`/dashboard/feed`, request.url)
    url.searchParams.set('type', feedType!)
    
    // Redirect to the unified feed view while preserving the feed type
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/dashboard/:path*',
} 