"use client"

import { cn } from "@/lib/utils"

export const CustomTooltip = ({ active, payload, label, chartType }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/20 bg-black/95 backdrop-blur-sm p-3 shadow-lg text-sm">
        {chartType === 'pie' ? (
          <div>
            <p className="font-bold text-white capitalize">{`${payload[0].name}`}</p>
            <p className="text-white/60">{`Total: ${payload[0].value}`}</p>
          </div>
        ) : (
          <div>
            <p className="font-bold text-white capitalize">{`${label}`}</p>
            <p className="text-white/60">{`Engajamento: ${payload[0].value}`}</p>
          </div>
        )}
      </div>
    )
  }
  return null
}

export const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, payload }: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}
