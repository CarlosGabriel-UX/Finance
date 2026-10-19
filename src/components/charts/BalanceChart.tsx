"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatBRL, formatCompactBRL, formatDate, monthLabel } from "@/lib/format";
import type { BalancePoint } from "@/lib/finance";

function TooltipBox({ active, payload }: { active?: boolean; payload?: { payload: BalancePoint }[] }) {
  const p = active ? payload?.[0]?.payload : undefined;
  if (!p) return null;
  return (
    <div className="rounded-2xl bg-white px-4 py-2.5 text-black shadow-xl">
      <p className="text-xs text-black/60">{formatDate(p.date)}</p>
      <p className="text-sm font-semibold">{formatBRL(p.balance)}</p>
    </div>
  );
}

export function BalanceChart({ data }: { data: BalancePoint[] }) {
  const firstOfMonth = data.filter((p) => p.date.endsWith("-01")).map((p) => p.date);
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f07a2a" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#f07a2a" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 6" />
          <XAxis
            dataKey="date"
            ticks={firstOfMonth.length ? firstOfMonth : undefined}
            tickFormatter={(d: string) => monthLabel(d)}
            tick={{ fill: "#9b8f86", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            minTickGap={20}
          />
          <YAxis
            orientation="right"
            tickFormatter={(v: number) => formatCompactBRL(v)}
            tick={{ fill: "#9b8f86", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={64}
            domain={["auto", "auto"]}
          />
          <Tooltip content={<TooltipBox />} cursor={{ stroke: "rgba(255,255,255,0.35)", strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#ff9a4d"
            strokeWidth={2}
            fill="url(#balanceFill)"
            activeDot={{ r: 6, fill: "#fff", stroke: "#f07a2a", strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
