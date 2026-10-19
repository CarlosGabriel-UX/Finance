"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { formatBRL, formatCompactBRL, monthLabel } from "@/lib/format";
import type { MonthValue } from "@/lib/finance";

export function MonthlyBars({ data }: { data: MonthValue[] }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 28, right: 0, left: 0, bottom: 0 }} barCategoryGap={6}>
          <defs>
            <linearGradient id="barBrown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5a3a28" />
              <stop offset="100%" stopColor="#1d1411" />
            </linearGradient>
            <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#4ade80" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fill: "#9b8f86", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            formatter={(v: number) => [formatBRL(v), "Investido"]}
            labelFormatter={(m: string) => monthLabel(m)}
            contentStyle={{ background: "#fff", borderRadius: 14, border: 0, color: "#000" }}
          />
          <Bar dataKey="value" radius={[10, 10, 4, 4]}>
            {data.map((d) => (
              <Cell key={d.month} fill={d.value === max && max > 0 ? "url(#barGreen)" : "url(#barBrown)"} />
            ))}
            <LabelList dataKey="value" position="top" formatter={(v: number) => formatCompactBRL(v)} fill="#d6ccc4" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
