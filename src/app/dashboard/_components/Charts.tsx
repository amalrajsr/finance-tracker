"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  value: number | string | ReadonlyArray<number | string> | undefined,
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

export type ChartPalette = {
  credit: string;
  debit: string;
  primary: string;
  grid: string;
  tick: string;
  cursor: string;
  tooltipBg: string;
  tooltipBorder: string;
  legendColor: string;
  othersSlice: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  chart6: string;
};

function readChartPalette(): ChartPalette {
  const r = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) =>
    r.getPropertyValue(name).trim() || fallback;
  return {
    credit: pick("--app-credit", "#2D6A4F"),
    debit: pick("--app-debit", "#9B2C2C"),
    primary: pick("--app-primary", "#1B1510"),
    grid: pick("--app-chart-grid", "#DDD8D0"),
    tick: pick("--app-chart-tick", "#74685E"),
    cursor: pick("--app-chart-cursor", "#EDE8DF"),
    tooltipBg: pick("--app-chart-tooltip-bg", "#FFFDF9"),
    tooltipBorder: pick("--app-chart-tooltip-border", "#D6D0C8"),
    legendColor: pick("--app-text-primary", "#1B1510"),
    othersSlice: pick("--app-text-muted", "#9A8E84"),
    chart1: pick("--app-chart-1", "#1B1510"),
    chart2: pick("--app-chart-2", "#7C6650"),
    chart3: pick("--app-chart-3", "#A4845C"),
    chart4: pick("--app-chart-4", "#6B8F71"),
    chart5: pick("--app-chart-5", "#9C7178"),
    chart6: pick("--app-chart-6", "#5E7F8A"),
  };
}

function useChartPalette(): ChartPalette {
  const [palette, setPalette] = useState<ChartPalette>(() => ({
    credit: "#2D6A4F",
    debit: "#9B2C2C",
    primary: "#1B1510",
    grid: "#DDD8D0",
    tick: "#74685E",
    cursor: "#EDE8DF",
    tooltipBg: "#FFFDF9",
    tooltipBorder: "#D6D0C8",
    legendColor: "#1B1510",
    othersSlice: "#9A8E84",
    chart1: "#1B1510",
    chart2: "#7C6650",
    chart3: "#A4845C",
    chart4: "#6B8F71",
    chart5: "#9C7178",
    chart6: "#5E7F8A",
  }));

  useEffect(() => {
    const sync = () => setPalette(readChartPalette());
    queueMicrotask(sync);
    const obs = new MutationObserver(() => queueMicrotask(sync));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  return palette;
}

function useTooltipStyle(palette: ChartPalette) {
  return useMemo(
    () => ({
      borderRadius: 8,
      border: `1px solid ${palette.tooltipBorder}`,
      backgroundColor: palette.tooltipBg,
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    }),
    [palette.tooltipBg, palette.tooltipBorder],
  );
}

export type MonthlyTrendRow = {
  month: string;
  debits: string | number;
  credits: string | number;
};

export type CategoryBreakdownRow = {
  name: string;
  total: string | number;
  colour?: string | null;
};

export type DailyHeatmapRow = {
  date: string;
  total: string | number;
};

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = () => setIsMobile(mql.matches);
    mql.addEventListener("change", handler);
    queueMicrotask(handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

export function MonthlyTrendChart({ data }: { data: MonthlyTrendRow[] }) {
  const palette = useChartPalette();
  const tooltipStyle = useTooltipStyle(palette);

  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-text-muted text-center py-10">
        No trend data available
      </div>
    );
  }

  const formattedData = data.map((d) => {
    const date = new Date(d.month + "-01");
    const monthName = date.toLocaleString("default", { month: "short" });
    return {
      ...d,
      displayMonth: monthName,
      debits: parseFloat(String(d.debits)),
      credits: parseFloat(String(d.credits)),
    };
  });

  const tickStyle = { fontSize: 12, fill: palette.tick };

  return (
    <div className="h-72 w-full font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={palette.grid}
          />
          <XAxis
            dataKey="displayMonth"
            axisLine={false}
            tickLine={false}
            tick={tickStyle}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={tickStyle}
            tickFormatter={(val) => `₹${val / 1000}k`}
          />
          <Tooltip
            formatter={(value) => formatTooltipCurrency(value)}
            contentStyle={tooltipStyle}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{
              fontSize: 12,
              paddingTop: 10,
              color: palette.legendColor,
            }}
          />
          <Bar
            dataKey="credits"
            name="Income"
            fill={palette.credit}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="debits"
            name="Expenses"
            fill={palette.debit}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryBreakdownChart({
  data,
}: {
  data: CategoryBreakdownRow[];
}) {
  const palette = useChartPalette();
  const tooltipStyle = useTooltipStyle(palette);
  const isMobile = useIsMobile();

  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-text-muted text-center py-10">
        No category data available
      </div>
    );
  }

  const chartData = data.slice(0, 6).map((d) => ({
    name: d.name,
    value: parseFloat(String(d.total)),
    colour: d.colour || palette.chart3,
  }));

  if (data.length > 6) {
    const othersTotal = data
      .slice(6)
      .reduce((sum, d) => sum + parseFloat(String(d.total)), 0);
    chartData.push({
      name: "Others",
      value: othersTotal,
      colour: palette.othersSlice,
    });
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
            contentStyle={tooltipStyle}
          />
          <Legend
            layout={isMobile ? "horizontal" : "vertical"}
            verticalAlign={isMobile ? "bottom" : "middle"}
            align={isMobile ? "center" : "right"}
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: palette.legendColor }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DailySpendingChart({ data }: { data: DailyHeatmapRow[] }) {
  const palette = useChartPalette();
  const tooltipStyle = useTooltipStyle(palette);

  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-text-muted text-center py-10">
        No daily data available
      </div>
    );
  }

  const chartData = data.slice(-30).map((d) => ({
    date: d.date.split("-").slice(1).join("/"),
    amount: parseFloat(String(d.total)),
  }));

  const tickStyle = { fontSize: 10, fill: palette.tick };

  return (
    <div className="h-60 w-full font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={palette.grid}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={tickStyle}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={tickStyle}
            tickFormatter={(val) => `₹${val / 1000}k`}
          />
          <Tooltip
            formatter={(value) => formatTooltipCurrency(value)}
            contentStyle={{ ...tooltipStyle, fontSize: 12 }}
            cursor={{ fill: palette.cursor }}
          />
          <Bar
            dataKey="amount"
            name="Spent"
            fill={palette.chart2}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
