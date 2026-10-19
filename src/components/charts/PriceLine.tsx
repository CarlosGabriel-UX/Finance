"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate, monthLabel } from "@/lib/format";

export function PriceLine({ data }: { data: { date: string; close: number }[] }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tickFormatter={monthLabel} tick={{ fill: "#9b8f86", fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={40} />
          <YAxis
            orientation="right"
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            tick={{ fill: "#9b8f86", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            formatter={(v: number) => [v.toLocaleString("pt-BR", { maximumFractionDigits: 0 }), "Pontos"]}
            labelFormatter={(d: string) => formatDate(d)}
            contentStyle={{ background: "#fff", borderRadius: 14, border: 0, color: "#000" }}
          />
          <Line type="monotone" dataKey="close" stroke="#f07a2a" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
