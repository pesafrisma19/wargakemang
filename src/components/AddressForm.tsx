import React, { useEffect } from 'react'

export interface AddressData {
    alamat: string;
    rt: string;
    rw: string;
    desa: string;
    kecamatan: string;
    kabupaten: string;
}

interface AddressFormProps {
    value: AddressData;
    onChange: (data: AddressData) => void;
    inputCls: string;
    labelPrefix?: string;
    defaultDesa?: string;
    defaultKecamatan?: string;
    defaultKabupaten?: string;
}

export const formatAddress = (data: AddressData): string => {
    let parts = []
    if (data.alamat) parts.push(data.alamat)
    if (data.rt && data.rw) parts.push(`RT. ${data.rt} RW. ${data.rw}`)
    else if (data.rt) parts.push(`RT. ${data.rt}`)
    else if (data.rw) parts.push(`RW. ${data.rw}`)
    
    if (data.desa) parts.push(`Desa ${data.desa}`)
    if (data.kecamatan) parts.push(`Kec. ${data.kecamatan}`)
    if (data.kabupaten) parts.push(`Kab. ${data.kabupaten}`)
    
    return parts.join(' ')
}

export default function AddressForm({ 
    value, 
    onChange, 
    inputCls, 
    labelPrefix = "Alamat",
    defaultDesa = "",
    defaultKecamatan = "",
    defaultKabupaten = ""
}: AddressFormProps) {

    // Auto-fill defaults if empty
    useEffect(() => {
        if (!value.desa && defaultDesa) updateField('desa', defaultDesa)
        if (!value.kecamatan && defaultKecamatan) updateField('kecamatan', defaultKecamatan)
        if (!value.kabupaten && defaultKabupaten) updateField('kabupaten', defaultKabupaten)
    }, [defaultDesa, defaultKecamatan, defaultKabupaten])

    const updateField = (field: keyof AddressData, val: string) => {
        onChange({ ...value, [field]: val })
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                    {labelPrefix} (Kampung / Jalan)
                </label>
                <input 
                    type="text" 
                    value={value.alamat} 
                    onChange={(e) => updateField('alamat', e.target.value)} 
                    placeholder="Contoh: Kp. Cikupa"
                    className={inputCls} 
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">RT</label>
                    <input 
                        type="text" 
                        value={value.rt} 
                        onChange={(e) => updateField('rt', e.target.value)} 
                        placeholder="Contoh: 001"
                        className={inputCls} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">RW</label>
                    <input 
                        type="text" 
                        value={value.rw} 
                        onChange={(e) => updateField('rw', e.target.value)} 
                        placeholder="Contoh: 002"
                        className={inputCls} 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Desa/Kelurahan</label>
                    <input 
                        type="text" 
                        value={value.desa} 
                        onChange={(e) => updateField('desa', e.target.value)} 
                        className={inputCls} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Kecamatan</label>
                    <input 
                        type="text" 
                        value={value.kecamatan} 
                        onChange={(e) => updateField('kecamatan', e.target.value)} 
                        className={inputCls} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Kabupaten</label>
                    <input 
                        type="text" 
                        value={value.kabupaten} 
                        onChange={(e) => updateField('kabupaten', e.target.value)} 
                        className={inputCls} 
                    />
                </div>
            </div>
        </div>
    )
}
