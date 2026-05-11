'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Warga } from '@/types/database'
import { Search, X, User } from 'lucide-react'

interface WargaSearchSelectProps {
    onSelect: (warga: Warga) => void
    selectedWarga: Warga | null
    onClear: () => void
    filterJenisKelamin?: 'L' | 'P'
}

export default function WargaSearchSelect({ onSelect, selectedWarga, onClear, filterJenisKelamin }: WargaSearchSelectProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Warga[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()
    const wrapperRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)

        if (query.length < 2) {
            setResults([])
            setIsOpen(false)
            return
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            const query_builder = supabase
                .from('warga')
                .select('*')
                .or(`nama.ilike.%${query}%,nik.ilike.%${query}%`)

            if (filterJenisKelamin) {
                query_builder.eq('jenis_kelamin', filterJenisKelamin)
            }

            const { data } = await query_builder
                .order('nama')
                .limit(10)

            setResults(data || [])
            setIsOpen(true)
            setLoading(false)
        }, 300)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query])

    if (selectedWarga) {
        return (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">{selectedWarga.nama}</p>
                            <p className="text-sm text-gray-500 font-mono">{selectedWarga.nik}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClear}
                        className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Ganti warga"
                    >
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Ketik nama atau NIK warga..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setIsOpen(true)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base text-gray-800 placeholder-gray-400 transition-all"
                />
                {loading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent"></div>
                    </div>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-64 overflow-y-auto">
                    {results.length > 0 ? (
                        results.map((w) => (
                            <button
                                key={w.id}
                                onClick={() => {
                                    onSelect(w)
                                    setQuery('')
                                    setIsOpen(false)
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                            >
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-gray-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-800 truncate">{w.nama}</p>
                                    <p className="text-xs text-gray-500">
                                        <span className="font-mono">{w.nik}</span>
                                        <span className="mx-1">•</span>
                                        <span>RT {w.rt}/RW {w.rw}</span>
                                    </p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-6 text-center text-gray-500 text-sm">
                            Tidak ada warga ditemukan
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
