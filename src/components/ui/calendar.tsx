"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalendarProps {
  className?: string
  selected?: Date
  onSelect?: (date: Date) => void
}

function Calendar({ className, selected, onSelect }: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }
  
  const selectDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    onSelect?.(date)
  }
  
  const isSelected = (day: number) => {
    if (!selected) return false
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return date.toDateString() === selected.toDateString()
  }
  
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
  
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
  
  return (
    <div className={cn("p-3 bg-card rounded-lg border", className)}>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={previousMonth}
          className="p-1 hover:bg-accent rounded"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-medium">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-accent rounded"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="p-2"></div>
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          return (
            <button
              key={day}
              onClick={() => selectDate(day)}
              className={cn(
                "p-2 text-sm hover:bg-accent rounded text-center",
                isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary"
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { Calendar }
