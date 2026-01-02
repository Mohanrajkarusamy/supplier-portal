"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts"
import { MonthlyPerformance } from "@/lib/performance"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function PerformanceLineChart({ data, type }: { data: MonthlyPerformance[], type: "Quality" | "Delivery" | "Complaints" }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip />
        <Line 
            type="monotone" 
            dataKey={type === "Quality" ? "qualityScore" : type === "Delivery" ? "deliveryScore" : "complaints"} 
            stroke={type === "Quality" ? "#2563eb" : type === "Delivery" ? "#16a34a" : "#dc2626"} 
            strokeWidth={2} 
            dot={{ r: 4 }} 
            activeDot={{ r: 8 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function TargetVsReceivedLineChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#000" fontSize={12} tickLine={false} axisLine={true} />
                <YAxis stroke="#000" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}/>
                <Legend verticalAlign="top" height={36}/>
                <Line type="monotone" dataKey="castingIssued" name="Target Qty" stroke="#2563eb" strokeWidth={2} dot={{ r: 4, fill: "#2563eb" }} />
                <Line type="monotone" dataKey="loadReceived" name="Received Qty" stroke="#dc2626" strokeWidth={2} dot={{ r: 4, fill: "#dc2626" }} />
            </LineChart>
        </ResponsiveContainer>
    )
}

export function DailyRejectionBarChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#000" fontSize={10} tickLine={false} />
                <YAxis stroke="#000" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend verticalAlign="bottom" />
                <Bar dataKey="rejectedQty" name="Rej Qty" fill="#dc2626" barSize={15}>
                    {/* Optional: Add labels on top of bars if needed */}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}

export function RejectionPieChart({ data }: { data: { name: string, value: number, fill: string }[] }) {
  const validData = data.filter(d => d.value > 0)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={validData}
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }: any) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
        >
          {validData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}
