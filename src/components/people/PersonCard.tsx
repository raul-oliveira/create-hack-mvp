'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Person } from '@/lib/schemas/people'

interface PersonCardProps {
  person: Person
  onUpdate: (person: Person) => void
  onDelete: (personId: string) => void
  viewMode?: 'grid' | 'list'
}

export function PersonCard({ person, onUpdate, onDelete, viewMode = 'grid' }: PersonCardProps) {
  const [showActions, setShowActions] = useState(false)

  const formatPhone = (phone: string | null) => {
    if (!phone) return null
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      const number = cleaned.substring(2)
      return `(${number.substring(0, 2)}) ${number.substring(2, 7)}-${number.substring(7)}`
    }
    return phone
  }

  const getAge = () => {
    if (!person.birth_date) return null
    const birth = new Date(person.birth_date)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const getSyncSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      'manual': 'Manual',
      'webhook': 'InChurch (Webhook)',
      'daily_polling': 'InChurch (Sync)'
    }
    return labels[source] || source
  }

  const getSyncSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'manual': 'bg-blue-100 text-blue-800',
      'webhook': 'bg-green-100 text-green-800',
      'daily_polling': 'bg-green-100 text-green-800'
    }
    return colors[source] || 'bg-gray-100 text-gray-800'
  }

  const getMaritalStatusLabel = (status: string | undefined) => {
    const labels: Record<string, string> = {
      'single': 'Solteiro(a)',
      'married': 'Casado(a)',
      'divorced': 'Divorciado(a)',
      'widowed': 'Viúvo(a)',
      'separated': 'Separado(a)',
      'engaged': 'Noivo(a)'
    }
    return status ? labels[status] || status : null
  }

  const handleWhatsAppClick = () => {
    if (!person.phone) {
      alert('Número de telefone não disponível para esta pessoa.')
      return
    }

    const phoneNumber = person.phone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/55${phoneNumber}`
    window.open(whatsappUrl, '_blank')
  }

  const handleCallClick = () => {
    if (!person.phone) {
      alert('Número de telefone não disponível para esta pessoa.')
      return
    }

    const phoneNumber = person.phone.replace(/\D/g, '')
    window.open(`tel:+55${phoneNumber}`, '_self')
  }

  const personId = (person as any).id || person.name

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {person.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Person Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {person.name}
                </h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSyncSourceColor(person.sync_source)}`}>
                  {getSyncSourceLabel(person.sync_source)}
                </span>
              </div>

              <div className="flex items-center space-x-4 text-xs text-gray-500">
                {person.email && (
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {person.email}
                  </span>
                )}
                {person.phone && (
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {formatPhone(person.phone)}
                  </span>
                )}
                {getAge() && (
                  <span>{getAge()} anos</span>
                )}
                {getMaritalStatusLabel((person as any).marital_status) && (
                  <span>{getMaritalStatusLabel((person as any).marital_status)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {person.phone && (
              <>
                <button
                  onClick={handleWhatsAppClick}
                  className="bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition-colors"
                  title="WhatsApp"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z"/>
                  </svg>
                </button>
                <button
                  onClick={handleCallClick}
                  className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
                  title="Ligar"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                </button>
              </>
            )}
            <Link
              href={`/dashboard/people/${personId}`}
              className="bg-indigo-600 text-white px-3 py-2 rounded-md text-xs hover:bg-indigo-700 transition-colors"
            >
              Ver Perfil
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Grid view (default)
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-white">
              {person.name.charAt(0).toUpperCase()}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900">{person.name}</h3>
            {getAge() && (
              <p className="text-sm text-gray-500">{getAge()} anos</p>
            )}
          </div>
        </div>

        {/* Sync Source Badge */}
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSyncSourceColor(person.sync_source)}`}>
          {getSyncSourceLabel(person.sync_source)}
        </span>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {person.email && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{person.email}</span>
          </div>
        )}
        
        {person.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>{formatPhone(person.phone)}</span>
          </div>
        )}

        {getMaritalStatusLabel((person as any).marital_status) && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{getMaritalStatusLabel((person as any).marital_status)}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Link
          href={`/dashboard/people/${personId}`}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors text-center block"
        >
          Ver Perfil Completo
        </Link>

        {person.phone && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleWhatsAppClick}
              className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z"/>
              </svg>
              WhatsApp
            </button>
            
            <button
              onClick={handleCallClick}
              className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              Ligar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}