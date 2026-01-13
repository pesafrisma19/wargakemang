'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X, AlertCircle, Loader2 } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'loading'

interface ToastProps {
    message: string
    type: ToastType
    onClose: () => void
    duration?: number
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Animate in
        setTimeout(() => setIsVisible(true), 10)

        // Auto close (except for loading type)
        if (type !== 'loading') {
            const timer = setTimeout(() => {
                setIsVisible(false)
                setTimeout(onClose, 300) // Wait for animation to finish
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [duration, onClose, type])

    const styles = {
        success: {
            bg: 'bg-white',
            border: 'border-emerald-200',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            textColor: 'text-emerald-800'
        },
        error: {
            bg: 'bg-white',
            border: 'border-red-200',
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            textColor: 'text-red-800'
        },
        info: {
            bg: 'bg-white',
            border: 'border-blue-200',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            textColor: 'text-blue-800'
        },
        loading: {
            bg: 'bg-white',
            border: 'border-gray-200',
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-600',
            textColor: 'text-gray-800'
        }
    }

    const icons = {
        success: <CheckCircle className={`w-5 h-5 ${styles[type].iconColor}`} />,
        error: <XCircle className={`w-5 h-5 ${styles[type].iconColor}`} />,
        info: <AlertCircle className={`w-5 h-5 ${styles[type].iconColor}`} />,
        loading: <Loader2 className={`w-5 h-5 ${styles[type].iconColor} animate-spin`} />
    }

    const style = styles[type]

    return (
        <div className="fixed inset-x-0 top-4 z-[100] flex justify-center pointer-events-none px-4">
            <div
                className={`
                    pointer-events-auto
                    flex items-center gap-3 
                    px-4 py-3 
                    rounded-xl 
                    shadow-xl 
                    border-2
                    ${style.bg} ${style.border}
                    transform transition-all duration-300 ease-out
                    ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
                `}
            >
                <div className={`flex-shrink-0 p-1.5 rounded-full ${style.iconBg}`}>
                    {icons[type]}
                </div>
                <p className={`font-medium text-sm ${style.textColor}`}>{message}</p>
                {type !== 'loading' && (
                    <button
                        onClick={() => {
                            setIsVisible(false)
                            setTimeout(onClose, 300)
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    )
}
