"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

const data = [
  { name: "Jan", ppm: 2400, otif: 98 },
  { name: "Feb", ppm: 1398, otif: 96 },
  { name: "Mar", ppm: 9800, otif: 90 },
  { name: "Apr", ppm: 3908, otif: 99 },
  { name: "May", ppm: 4800, otif: 95 },
  { name: "Jun", ppm: 3800, otif: 97 },
]

export function OverviewChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis 
          dataKey="name" 
          stroke="#888888" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip 
             contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}
             itemStyle={{ fontSize: '12px' }}
        />
        <Line 
            type="monotone" 
            dataKey="ppm" 
            stroke="#2563eb" 
            strokeWidth={2} 
            dot={false} 
            activeDot={{ r: 4 }}
            name="PPM"
        />
        <Line 
            type="monotone" 
            dataKey="otif" 
            stroke="#16a34a" 
            strokeWidth={2} 
            dot={false}
            name="OTIF %" 
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
