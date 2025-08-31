'use client'

import { useState, useRef, useEffect } from 'react'

interface MessageEditorProps {
  message: string
  onChange: (message: string) => void
  onSave: () => void
  onRegenerate: () => void
  isPreviewMode: boolean
  onTogglePreview: () => void
  personName: string
}

export function MessageEditor({
  message,
  onChange,
  onSave,
  onRegenerate,
  isPreviewMode,
  onTogglePreview,
  personName
}: MessageEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [characterCount, setCharacterCount] = useState(0)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const MAX_WHATSAPP_LENGTH = 4096

  useEffect(() => {
    setCharacterCount(message.length)
  }, [message])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [message])

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value
    if (newMessage.length <= MAX_WHATSAPP_LENGTH) {
      onChange(newMessage)
    }
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      await onRegenerate()
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault()
      onSave()
    }
    
    // Ctrl+R to regenerate
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault()
      handleRegenerate()
    }
  }

  const getCharacterCountColor = () => {
    if (characterCount > MAX_WHATSAPP_LENGTH * 0.9) return 'text-red-600'
    if (characterCount > MAX_WHATSAPP_LENGTH * 0.75) return 'text-orange-600'
    return 'text-gray-500'
  }

  const formatMessageForWhatsApp = (text: string) => {
    // Simple formatting to show how it would look in WhatsApp
    return text
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>') // Bold
      .replace(/_([^_]+)_/g, '<em>$1</em>') // Italic
      .replace(/\n/g, '<br>') // Line breaks
  }

  return (
    <div className="space-y-4">
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {isPreviewMode ? 'Visualização da Mensagem' : 'Editar Mensagem'}
        </h3>
        
        <div className="flex items-center space-x-2">
          {/* Preview Toggle */}
          <button
            onClick={onTogglePreview}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              isPreviewMode 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isPreviewMode ? 'Editar' : 'Visualizar'}
          </button>
          
          {/* Regenerate Button */}
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            title="Ctrl+R para regenerar"
          >
            {isRegenerating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Regenerando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Regenerar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      {isPreviewMode ? (
        /* WhatsApp Preview */
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="max-w-xs mx-auto">
            {/* WhatsApp Header */}
            <div className="bg-green-600 text-white p-3 rounded-t-lg flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold">
                  {personName.charAt(0)}
                </span>
              </div>
              <div>
                <div className="font-medium text-sm">{personName}</div>
                <div className="text-xs opacity-75">online</div>
              </div>
            </div>
            
            {/* Message Bubble */}
            <div className="bg-white p-3 rounded-b-lg">
              <div className="bg-green-100 p-3 rounded-lg max-w-xs ml-auto">
                <div 
                  className="text-sm text-gray-900 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: formatMessageForWhatsApp(message) 
                  }}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {new Date().toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Text Editor */
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder={`Escreva sua mensagem para ${personName}...`}
            className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={6}
          />
          
          {/* Character Counter */}
          <div className="flex justify-between items-center text-sm">
            <div className="text-gray-500">
              <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+S</kbd> para salvar •{' '}
              <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+R</kbd> para regenerar
            </div>
            <div className={getCharacterCountColor()}>
              {characterCount}/{MAX_WHATSAPP_LENGTH}
            </div>
          </div>
        </div>
      )}

      {/* Formatting Help */}
      {!isPreviewMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Formatação WhatsApp</h4>
          <div className="text-xs text-blue-800 space-y-1">
            <div><strong>*texto*</strong> = <strong>negrito</strong></div>
            <div><em>_texto_</em> = <em>itálico</em></div>
            <div>Use quebras de linha para separar parágrafos</div>
          </div>
        </div>
      )}

      {/* Warning for long messages */}
      {characterCount > MAX_WHATSAPP_LENGTH * 0.75 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-orange-800">
              <strong>Mensagem longa:</strong> Considere dividir em mensagens menores para melhor legibilidade.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}