import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user profile from users table
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    const userName = profile?.name || 'User'
    const userRole = profile?.role || 'rt'
    const userRT = profile?.rt || ''
    const userRW = profile?.rw || ''

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar
                userName={userName}
                userRole={userRole}
                userRT={userRT}
                userRW={userRW}
            />
            {/* Main content with padding for mobile header/footer and desktop sidebar */}
            <main className="lg:ml-64 min-h-screen pt-16 pb-20 lg:pt-0 lg:pb-0">
                <div className="p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
