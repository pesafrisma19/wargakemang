'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X, AlertCircle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
    message: string
    type: ToastType
    onClose: () => void
    duration?: number
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, duration)

        return () => clearTimeout(timer)
    }, [duration, onClose])

    const bgColors = {
        success: 'bg-emerald-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    }

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-white" />,
        error: <XCircle className="w-5 h-5 text-white" />,
        info: <AlertCircle className="w-5 h-5 text-white" />
    }

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transform transition-all duration-300 animate-in slide-in-from-bottom-5 ${bgColors[type]}`}>
            <div className="flex-shrink-0">
                {icons[type]}
            </div>
            <p className="text-white font-medium text-sm">{message}</p>
            <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-full transition-colors text-white"
            >
                <X size={16} />
            </button>
        </div>
    )
}
