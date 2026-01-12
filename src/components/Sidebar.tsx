'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    LogOut,
    Menu,
    X,
    FileSpreadsheet,
    Home,
    UserPlus,
    UserCog
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
    userName: string
    userRole: string
    userRT?: string
    userRW?: string
}

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, adminOnly: false },
    { name: 'Data Warga', href: '/dashboard/warga', icon: Users, adminOnly: false },
    { name: 'Data Keluarga', href: '/dashboard/keluarga', icon: Home, adminOnly: false },
    { name: 'Import Data', href: '/dashboard/import', icon: FileSpreadsheet, adminOnly: false },
    { name: 'Kelola Users', href: '/dashboard/users', icon: UserCog, adminOnly: true },
]

// Mobile bottom nav items (simplified)
const mobileNavItems = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Warga', href: '/dashboard/warga', icon: Users },
    { name: 'Keluarga', href: '/dashboard/keluarga', icon: Home },
    { name: 'Tambah', href: '/dashboard/warga/tambah', icon: UserPlus },
]

export default function Sidebar({ userName, userRole, userRT, userRW }: SidebarProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <>
            {/* Mobile Top Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-white">Warga Kemang</h1>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-2 py-2 safe-area-pb">
                <div className="flex items-center justify-around">
                    {mobileNavItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href))
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${isActive
                                    ? 'text-emerald-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                    {item.name}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block fixed top-0 left-0 z-40 h-screen w-64 bg-gradient-to-b from-emerald-700 to-teal-800">
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">Warga Kemang</h1>
                                <p className="text-xs text-white/60">Sistem Data Warga</p>
                            </div>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="p-4 mx-4 mt-4 bg-white/10 rounded-xl">
                        <p className="text-white font-medium truncate">{userName}</p>
                        <p className="text-white/60 text-sm">
                            {userRole === 'admin' ? 'Administrator' : `RT ${userRT} / RW ${userRW}`}
                        </p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        {menuItems
                            .filter(item => !item.adminOnly || userRole === 'admin')
                            .map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== '/dashboard' && pathname.startsWith(item.href))
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                            ? 'bg-white text-emerald-700 shadow-lg'
                                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <item.icon size={20} />
                                        <span className="font-medium">{item.name}</span>
                                    </Link>
                                )
                            })}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-white/10">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-xl transition-all"
                        >
                            <LogOut size={20} />
                            <span className="font-medium">Keluar</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
