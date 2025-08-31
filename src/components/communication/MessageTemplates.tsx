'use client'

import { useState, useEffect } from 'react'

interface MessageTemplate {
  id: string
  name: string
  category: 'birthday' | 'prayer' | 'follow_up' | 'celebration' | 'sympathy' | 'invitation' | 'custom'
  content: string
  variables: string[]
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

interface MessageTemplatesProps {
  organizationId: string
  leaderId: string
}

export function MessageTemplates({ organizationId, leaderId }: MessageTemplatesProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [filter, setFilter] = useState<'all' | MessageTemplate['category']>('all')
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'custom' as MessageTemplate['category'],
    content: ''
  })

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true)
        
        // Mock data - in real implementation would fetch from database
        const mockTemplates: MessageTemplate[] = [
          {
            id: '1',
            name: 'Feliz Aniversário',
            category: 'birthday',
            content: 'Feliz aniversário, {{nome}}! 🎉 Que Deus abençoe muito sua vida neste novo ano e que seja repleto de alegrias, paz e realizações! Desejamos que este dia seja especial e cheio de bênçãos. Parabéns! 🙏❤️',
            variables: ['nome'],
            usageCount: 15,
            createdAt: new Date('2025-08-01'),
            updatedAt: new Date('2025-08-01')
          },
          {
            id: '2',
            name: 'Pedido de Oração',
            category: 'prayer',
            content: 'Olá {{nome}}, como você está? Gostaríamos de saber como podemos orar por você nesta semana. Se houver alguma situação específica em sua vida ou família que precisem de oração, compartilhe conosco. Estamos aqui para apoiá-lo(a)! 🙏',
            variables: ['nome'],
            usageCount: 8,
            createdAt: new Date('2025-07-15'),
            updatedAt: new Date('2025-08-20')
          },
          {
            id: '3',
            name: 'Acompanhamento Semanal',
            category: 'follow_up',
            content: 'Oi {{nome}}! Como foi sua semana? Espero que esteja tudo bem com você e sua família. Gostaria de saber se há algo em que possamos ajudar ou orar. Lembre-se de que estamos sempre aqui para você! ☺️',
            variables: ['nome'],
            usageCount: 23,
            createdAt: new Date('2025-07-10'),
            updatedAt: new Date('2025-08-25')
          },
          {
            id: '4',
            name: 'Convite para Culto',
            category: 'invitation',
            content: 'Olá {{nome}}! Esperamos você no culto deste {{dia}} às {{horario}}. Teremos uma palavra especial e um tempo de comunhão maravilhoso. Sua presença sempre nos alegra muito! Nos vemos lá! 🏛️✨',
            variables: ['nome', 'dia', 'horario'],
            usageCount: 12,
            createdAt: new Date('2025-06-20'),
            updatedAt: new Date('2025-08-15')
          },
          {
            id: '5',
            name: 'Condolências',
            category: 'sympathy',
            content: 'Querido(a) {{nome}}, nossos corações estão com você neste momento difícil. Que Deus console seu coração e de toda sua família. Estaremos orando por vocês e estamos disponíveis para qualquer coisa que precisem. Com carinho e orações. 💙🙏',
            variables: ['nome'],
            usageCount: 3,
            createdAt: new Date('2025-05-30'),
            updatedAt: new Date('2025-07-22')
          }
        ]

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800))
        setTemplates(mockTemplates)
      } catch (error) {
        console.error('Error fetching templates:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [organizationId, leaderId])

  const getCategoryLabel = (category: MessageTemplate['category']) => {
    const labels = {
      birthday: 'Aniversário',
      prayer: 'Oração',
      follow_up: 'Acompanhamento',
      celebration: 'Celebração',
      sympathy: 'Condolências',
      invitation: 'Convite',
      custom: 'Personalizado'
    }
    return labels[category]
  }

  const getCategoryColor = (category: MessageTemplate['category']) => {
    const colors = {
      birthday: 'bg-pink-100 text-pink-800',
      prayer: 'bg-purple-100 text-purple-800',
      follow_up: 'bg-blue-100 text-blue-800',
      celebration: 'bg-yellow-100 text-yellow-800',
      sympathy: 'bg-gray-100 text-gray-800',
      invitation: 'bg-green-100 text-green-800',
      custom: 'bg-indigo-100 text-indigo-800'
    }
    return colors[category]
  }

  const getFilteredTemplates = () => {
    if (filter === 'all') return templates
    return templates.filter(template => template.category === filter)
  }

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      alert('Nome e conteúdo são obrigatórios')
      return
    }

    // Extract variables from content ({{variable}} format)
    const variables = Array.from(newTemplate.content.matchAll(/{{(\w+)}}/g))
      .map(match => match[1])
      .filter((v, i, arr) => arr.indexOf(v) === i) // Remove duplicates

    const template: MessageTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name.trim(),
      category: newTemplate.category,
      content: newTemplate.content.trim(),
      variables,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setTemplates(prev => [template, ...prev])
    setNewTemplate({ name: '', category: 'custom', content: '' })
    setIsCreating(false)
  }

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template)
    setNewTemplate({
      name: template.name,
      category: template.category,
      content: template.content
    })
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !newTemplate.name.trim() || !newTemplate.content.trim()) {
      alert('Nome e conteúdo são obrigatórios')
      return
    }

    const variables = Array.from(newTemplate.content.matchAll(/{{(\w+)}}/g))
      .map(match => match[1])
      .filter((v, i, arr) => arr.indexOf(v) === i)

    const updatedTemplate: MessageTemplate = {
      ...editingTemplate,
      name: newTemplate.name.trim(),
      category: newTemplate.category,
      content: newTemplate.content.trim(),
      variables,
      updatedAt: new Date()
    }

    setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t))
    setEditingTemplate(null)
    setNewTemplate({ name: '', category: 'custom', content: '' })
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return
    setTemplates(prev => prev.filter(t => t.id !== templateId))
  }

  const handleCopyTemplate = (content: string) => {
    navigator.clipboard.writeText(content)
    alert('Template copiado para a área de transferência!')
  }

  const handleUseTemplate = (template: MessageTemplate) => {
    // Simulate using template (increment usage count)
    setTemplates(prev => prev.map(t => 
      t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
    ))
    
    // Copy to clipboard
    handleCopyTemplate(template.content)
  }

  const cancelEditing = () => {
    setEditingTemplate(null)
    setIsCreating(false)
    setNewTemplate({ name: '', category: 'custom', content: '' })
  }

  const filteredTemplates = getFilteredTemplates()

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Modelos de Mensagem</h3>
          <p className="text-sm text-gray-500">Crie e gerencie templates reutilizáveis para suas comunicações</p>
        </div>
        
        {!isCreating && !editingTemplate && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Novo Template
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingTemplate) && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            {editingTemplate ? 'Editar Template' : 'Criar Novo Template'}
          </h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Template</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Feliz Aniversário"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="custom">Personalizado</option>
                  <option value="birthday">Aniversário</option>
                  <option value="prayer">Oração</option>
                  <option value="follow_up">Acompanhamento</option>
                  <option value="celebration">Celebração</option>
                  <option value="sympathy">Condolências</option>
                  <option value="invitation">Convite</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo da Mensagem</label>
              <textarea
                value={newTemplate.content}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                placeholder="Digite o conteúdo do template... Use {{variavel}} para campos dinâmicos como {{nome}}, {{idade}}, etc."
              />
              <div className="mt-1 text-xs text-gray-500">
                Use {{nome}}, {{idade}}, {{dia}}, {{horario}} etc. para personalização automática
              </div>
            </div>

            {/* Variable Preview */}
            {newTemplate.content && (
              <div className="bg-white border border-gray-200 rounded-md p-3">
                <div className="text-sm text-gray-600 mb-1">Pré-visualização com variáveis:</div>
                <div className="text-sm">
                  {newTemplate.content
                    .replace(/{{nome}}/g, 'João Silva')
                    .replace(/{{idade}}/g, '35')
                    .replace(/{{dia}}/g, 'domingo')
                    .replace(/{{horario}}/g, '19:00')
                  }
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelEditing}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {editingTemplate ? 'Atualizar' : 'Criar'} Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', label: 'Todos', count: templates.length },
            { id: 'birthday', label: 'Aniversário', count: templates.filter(t => t.category === 'birthday').length },
            { id: 'prayer', label: 'Oração', count: templates.filter(t => t.category === 'prayer').length },
            { id: 'follow_up', label: 'Acompanhamento', count: templates.filter(t => t.category === 'follow_up').length },
            { id: 'invitation', label: 'Convite', count: templates.filter(t => t.category === 'invitation').length },
            { id: 'custom', label: 'Personalizado', count: templates.filter(t => t.category === 'custom').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                filter === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-600">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-3 bg-gray-300 rounded w-full"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="space-y-4">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{template.name}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                      {getCategoryLabel(template.category)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Usado {template.usageCount} vez{template.usageCount !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                    {template.content}
                  </p>
                  
                  {template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-xs text-gray-500">Variáveis:</span>
                      {template.variables.map(variable => (
                        <span key={variable} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400">
                    Criado em {template.createdAt.toLocaleDateString('pt-BR')}
                    {template.updatedAt > template.createdAt && (
                      <span> • Atualizado em {template.updatedAt.toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                    title="Usar template"
                  >
                    Usar
                  </button>
                  <button
                    onClick={() => handleCopyTemplate(template.content)}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
                    title="Copiar"
                  >
                    Copiar
                  </button>
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700 transition-colors"
                    title="Editar"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                    title="Excluir"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filter === 'all' ? 'Nenhum template encontrado' : `Nenhum template de ${getCategoryLabel(filter as MessageTemplate['category'])} encontrado`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Crie seu primeiro template para facilitar suas comunicações.
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="mt-3 text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              Ver todos os templates
            </button>
          )}
        </div>
      )}
    </div>
  )
}