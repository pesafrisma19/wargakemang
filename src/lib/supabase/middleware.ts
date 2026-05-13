import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    let userRole = null;
    if (user) {
        // We use admin client here? No, just normal supabase since user is authenticated
        const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
        userRole = profile?.role
    }

    const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
    const isPortal = request.nextUrl.pathname.startsWith('/portal')
    const isLoginOrRegister = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register'

    // Not logged in -> Redirect to login if trying to access protected routes
    if (!user) {
        if (isDashboard || isPortal) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
    } else {
        // Logged in -> Route based on role
        if (userRole === 'warga') {
            if (isDashboard || isLoginOrRegister) {
                const url = request.nextUrl.clone()
                url.pathname = '/portal'
                return NextResponse.redirect(url)
            }
        } else if (userRole === 'admin' || userRole === 'rt') {
            if (isPortal || isLoginOrRegister) {
                const url = request.nextUrl.clone()
                url.pathname = '/dashboard'
                return NextResponse.redirect(url)
            }
        }
    }

    return supabaseResponse
}
