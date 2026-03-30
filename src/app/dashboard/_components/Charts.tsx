"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const formatCurrency = (val: number) => `₹${val.toLocaleString("en-IN")}`;

function formatTooltipCurrency(
  value: number | string | ReadonlyArray<number | string> | undefined
): string {
  if (value == null) return "";
  const n =
    typeof value === "number"
      ? value
      : Array.isArray(value)
        ? Number(value[0])
        : Number(value);
  return Number.isFinite(n) ? formatCurrency(n) : String(value);
}

const THEME_CREDIT = "#059669";
const THEME_DEBIT = "#e11d48";
const THEME_PRIMARY = "#4f46e5";

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

// ---------------------------------------------------------------------------
// 1. Monthly Trend Chart (Bar Chart)
// ---------------------------------------------------------------------------
export function MonthlyTrendChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-text-muted text-center py-10">No trend data available</div>;
  }

  // Format month label (e.g. "2024-03" -> "Mar")
  const formattedData = data.map((d) => {
    const date = new Date(d.month + "-01");
    const monthName = date.toLocaleString("default", { month: "short" });
    return {
      ...d,
      displayMonth: monthName,
      debits: parseFloat(d.debits),
      credits: parseFloat(d.credits),
    };
  });

  return (
    <div className="h-72 w-full font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey="displayMonth" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} tickFormatter={(val) => `₹${val/1000}k`} />
          <Tooltip
            formatter={(value) => formatTooltipCurrency(value)}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
          <Bar dataKey="credits" name="Income" fill={THEME_CREDIT} radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="debits" name="Expenses" fill={THEME_DEBIT} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Category Breakdown Chart (Donut Chart)
// ---------------------------------------------------------------------------
export function CategoryBreakdownChart({ data }: { data: any[] }) {
  const isMobile = useIsMobile();

  if (!data || data.length === 0) {
    return <div className="text-sm text-text-muted text-center py-10">No category data available</div>;
  }

  const chartData = data.slice(0, 6).map((d) => ({
    name: d.name,
    value: parseFloat(d.total),
    colour: d.colour || "#9CA3AF"
  }));

  if (data.length > 6) {
    const othersTotal = data.slice(6).reduce((sum, d) => sum + parseFloat(d.total), 0);
    chartData.push({ name: "Others", value: othersTotal, colour: "#D1D5DB" });
  }

  return (
    <div className={`w-full font-sans relative ${isMobile ? "h-80" : "h-72"}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy={isMobile ? "40%" : "50%"}
            innerRadius={isMobile ? 50 : 60}
            outerRadius={isMobile ? 75 : 90}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.colour} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatTooltipCurrency(value)}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend
            layout={isMobile ? "horizontal" : "vertical"}
            verticalAlign={isMobile ? "bottom" : "middle"}
            align={isMobile ? "center" : "right"}
            iconType="circle"
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Daily Spending Heatmap (Simple Bar Chart proxy for heatmap)
// ---------------------------------------------------------------------------
export function DailySpendingChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-text-muted text-center py-10">No daily data available</div>;
  }

  // Show only last 30 days
  const chartData = data.slice(-30).map((d) => ({
    date: d.date.split("-").slice(1).join("/"), // MM/DD
    amount: parseFloat(d.total),
  }));

  return (
    <div className="h-60 w-full font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6B7280" }} interval="preserveStartEnd" minTickGap={20} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6B7280" }} tickFormatter={(val) => `₹${val/1000}k`} />
          <Tooltip
            formatter={(value) => formatTooltipCurrency(value)}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
            cursor={{ fill: '#F3F4F6' }}
          />
          <Bar dataKey="amount" name="Spent" fill={THEME_PRIMARY} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
