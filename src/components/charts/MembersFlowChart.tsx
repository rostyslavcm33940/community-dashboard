"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

type Point = { date: string; joined: number; left: number };

export function MembersFlowChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={200}>
      <BarChart data={data} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#71717a", fontSize: 10 }}
          axisLine={{ stroke: "#3f3f46" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#a1a1aa" }}
          itemStyle={{ color: "#e4e4e7" }}
          cursor={{ fill: "#27272a" }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} iconType="circle" />
        <Bar dataKey="joined" name="Joined" fill="#34d399" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="left" name="Left" fill="#f43f5e" radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
