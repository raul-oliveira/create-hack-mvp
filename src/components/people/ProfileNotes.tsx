'use client'

import { useState, useEffect } from 'react'
import { Person } from '@/lib/schemas/people'

interface Note {
  id: string
  content: string
  category: 'observation' | 'prayer_request' | 'follow_up' | 'personal'
  created_at: string
  updated_at: string
}

interface ProfileNotesProps {
  person: Person
  leaderId: string
}

export function ProfileNotes({ person, leaderId }: ProfileNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newNote, setNewNote] = useState({ content: '', category: 'observation' as const })
  const [filter, setFilter] = useState<'all' | 'observation' | 'prayer_request' | 'follow_up' | 'personal'>('all')
  const [loading, setLoading] = useState(false)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockNotes: Note[] = [
      {
        id: '1',
        content: 'Conversamos sobre suas dificuldades financeiras recentes. Demonstrou preocupação mas também muita fé.',
        category: 'observation',
        created_at: '2025-08-25T10:30:00Z',
        updated_at: '2025-08-25T10:30:00Z'
      },
      {
        id: '2',
        content: 'Orar pela situação profissional - está em processo seletivo para nova vaga.',
        category: 'prayer_request',
        created_at: '2025-08-23T15:45:00Z',
        updated_at: '2025-08-23T15:45:00Z'
      },
      {
        id: '3',
        content: 'Agendar visita para próxima semana - mencionou que esposa está passando por momento difícil.',
        category: 'follow_up',
        created_at: '2025-08-20T09:15:00Z',
        updated_at: '2025-08-20T09:15:00Z'
      }
    ]
    setNotes(mockNotes)
  }, [person.id])

  const getCategoryColor = (category: string) => {
    const colors = {
      'observation': 'bg-blue-100 text-blue-800 border-blue-200',
      'prayer_request': 'bg-purple-100 text-purple-800 border-purple-200',
      'follow_up': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'personal': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      'observation': 'Observação',
      'prayer_request': 'Pedido de Oração',
      'follow_up': 'Acompanhamento',
      'personal': 'Pessoal'
    }
    return labels[category as keyof typeof labels] || category
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'observation':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )
      case 'prayer_request':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        )
      case 'follow_up':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'personal':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )
      default:
        return null
    }
  }

  const handleCreateNote = async () => {
    if (!newNote.content.trim()) return

    setLoading(true)
    // In real app, make API call here
    const createdNote: Note = {
      id: Date.now().toString(),
      content: newNote.content.trim(),
      category: newNote.category,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setNotes(prev => [createdNote, ...prev])
    setNewNote({ content: '', category: 'observation' })
    setIsCreating(false)
    setLoading(false)
  }

  const handleEditNote = async (noteId: string) => {
    if (!editContent.trim()) return

    setLoading(true)
    // In real app, make API call here
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, content: editContent.trim(), updated_at: new Date().toISOString() }
        : note
    ))
    setEditingNote(null)
    setEditContent('')
    setLoading(false)
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) return

    setLoading(true)
    // In real app, make API call here
    setNotes(prev => prev.filter(note => note.id !== noteId))
    setLoading(false)
  }

  const startEdit = (note: Note) => {
    setEditingNote(note.id)
    setEditContent(note.content)
  }

  const cancelEdit = () => {
    setEditingNote(null)
    setEditContent('')
  }

  const filteredNotes = notes.filter(note => {
    if (filter === 'all') return true
    return note.category === filter
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="p-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Anotações</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 transition-colors flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nova Anotação
        </button>
      </div>

      {/* Create Note Form */}
      {isCreating && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
              <select
                value={newNote.category}
                onChange={(e) => setNewNote(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="observation">Observação</option>
                <option value="prayer_request">Pedido de Oração</option>
                <option value="follow_up">Acompanhamento</option>
                <option value="personal">Pessoal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo</label>
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
                placeholder="Digite sua anotação..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewNote({ content: '', category: 'observation' })
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNote}
                disabled={!newNote.content.trim() || loading}
                className="bg-indigo-600 text-white px-4 py-1 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'all', label: 'Todas', count: notes.length },
            { id: 'observation', label: 'Observações', count: notes.filter(n => n.category === 'observation').length },
            { id: 'prayer_request', label: 'Orações', count: notes.filter(n => n.category === 'prayer_request').length },
            { id: 'follow_up', label: 'Acompanhamento', count: notes.filter(n => n.category === 'follow_up').length },
            { id: 'personal', label: 'Pessoal', count: notes.filter(n => n.category === 'personal').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                filter === tab.id ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes List */}
      {filteredNotes.length > 0 ? (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(note.category)}`}>
                    {getCategoryIcon(note.category)}
                    <span className="ml-1">{getCategoryLabel(note.category)}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {new Date(note.created_at).toLocaleDateString('pt-BR')} às {new Date(note.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => startEdit(note)}
                      className="text-gray-400 hover:text-indigo-600 p-1"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Excluir"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {editingNote === note.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleEditNote(note.id)}
                      disabled={!editContent.trim() || loading}
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
              )}
              
              {note.updated_at !== note.created_at && editingNote !== note.id && (
                <div className="mt-2 text-xs text-gray-400">
                  Editado em {new Date(note.updated_at).toLocaleDateString('pt-BR')} às {new Date(note.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma anotação encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'Não há anotações registradas para este liderado ainda.'
              : `Não há anotações da categoria "${getCategoryLabel(filter)}" para este liderado.`
            }
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-3 text-indigo-600 hover:text-indigo-500 text-sm font-medium"
          >
            Criar primeira anotação
          </button>
        </div>
      )}
    </div>
  )
}