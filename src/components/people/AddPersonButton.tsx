'use client'

import { useState } from 'react'

export function AddPersonButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <button 
      onClick={() => setIsOpen(true)}
      className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 transition-colors flex items-center"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Adicionar Pessoa
    </button>
  )
}