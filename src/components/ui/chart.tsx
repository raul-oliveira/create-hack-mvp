"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ChartData {
  name: string
  value: number
  color?: string
}

interface PieChartProps {
  data: ChartData[]
  className?: string
  size?: number
}

const PieChart = React.forwardRef<HTMLDivElement, PieChartProps>(
  ({ data, className, size = 200 }, ref) => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    let cumulativePercentage = 0

    const defaultColors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
    ]

    const createPath = (percentage: number, startAngle: number) => {
      const angle = (percentage / 100) * 360
      const endAngle = startAngle + angle
      const largeArcFlag = angle > 180 ? 1 : 0

      const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180)
      const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180)
      const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180)
      const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180)

      return `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
    }

    return (
      <div ref={ref} className={cn("flex flex-col items-center", className)}>
        <svg width={size} height={size} viewBox="0 0 100 100" className="transform -rotate-90">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100
            const startAngle = (cumulativePercentage / 100) * 360
            const path = createPath(percentage, startAngle)
            const color = item.color || defaultColors[index % defaultColors.length]
            
            cumulativePercentage += percentage

            return (
              <path
                key={item.name}
                d={path}
                fill={color}
                stroke="hsl(var(--background))"
                strokeWidth="1"
                className="hover:opacity-80 transition-opacity"
              />
            )
          })}
        </svg>
        
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1)
            const color = item.color || defaultColors[index % defaultColors.length]
            
            return (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground">
                  {item.name}: {percentage}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
PieChart.displayName = "PieChart"

interface ChartContainerProps {
  children: React.ReactNode
  className?: string
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ children, className }, ref) => (
    <div
      ref={ref}
      className={cn("w-full p-4 bg-card rounded-lg border", className)}
    >
      {children}
    </div>
  )
)
ChartContainer.displayName = "ChartContainer"

export { PieChart, ChartContainer, type ChartData }
