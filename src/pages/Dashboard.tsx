import { useState, useEffect, useMemo } from "react";
import { useDrivers, useExpenses, useRevenues, useSettings } from "@/hooks/use-store";
import { DollarSign, TrendingDown, TrendingUp, Truck } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = [
  "hsl(210, 60%, 45%)",
  "hsl(35, 90%, 50%)",
  "hsl(150, 50%, 40%)",
  "hsl(0, 65%, 50%)",
  "hsl(270, 50%, 50%)",
  "hsl(190, 60%, 45%)",
];

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatBRL(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-2.5 text-xs shadow-lg">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatBRL(p.value)}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-2.5 text-xs shadow-lg">
      <p className="font-semibold">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill }}>{formatBRL(payload[0].value)}</p>
    </div>
  );
};

export default function Dashboard() {
  const { drivers } = useDrivers();
  const { expenses } = useExpenses();
  const { revenues } = useRevenues();
  const { settings } = useSettings();

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalRevenues = revenues.reduce((s, r) => s + r.amount, 0);
  const profit = totalRevenues - totalExpenses;

  const stats = [
    { label: "Faturamento", value: totalRevenues, icon: DollarSign, color: "text-accent" },
    { label: "Despesas", value: totalExpenses, icon: TrendingDown, color: "text-destructive" },
    { label: "Lucro", value: profit, icon: TrendingUp, color: profit >= 0 ? "text-success" : "text-destructive" },
    { label: "Caminhões", value: drivers.length, icon: Truck, color: "text-primary", isCurrency: false },
  ];

  const monthlyData = useMemo(() => {
    const data = MONTHS.map((m, i) => ({ month: m, despesas: 0, faturamento: 0 }));
    expenses.forEach((e) => {
      const month = new Date(e.date).getMonth();
      data[month].despesas += e.amount;
    });
    revenues.forEach((r) => {
      const month = new Date(r.date).getMonth();
      data[month].faturamento += r.amount;
    });
    return data.filter((d) => d.despesas > 0 || d.faturamento > 0);
  }, [expenses, revenues]);

  const expensesByDriver = useMemo(
    () =>
      drivers.map((d, i) => ({
        name: d.name,
        value: expenses.filter((e) => e.driverId === d.id).reduce((s, e) => s + e.amount, 0),
        fill: COLORS[i % COLORS.length],
      })).filter((d) => d.value > 0),
    [drivers, expenses],
  );

  const revenuesByDriver = useMemo(
    () =>
      drivers.map((d, i) => ({
        name: d.name,
        value: revenues.filter((r) => r.driverId === d.id).reduce((s, r) => s + r.amount, 0),
        fill: COLORS[i % COLORS.length],
      })).filter((d) => d.value > 0),
    [drivers, revenues],
  );

  return (
    <div className="space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral da {settings.companyName}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={s.label} className="stat-card animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>
              {s.isCurrency === false ? s.value : formatBRL(s.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="stat-card animate-fade-in-up" style={{ animationDelay: "320ms" }}>
        <h2 className="font-semibold mb-4">Despesas e Faturamento por Mês</h2>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="despesas" name="Despesas" fill="hsl(0, 65%, 50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="faturamento" name="Faturamento" fill="hsl(210, 60%, 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-8">Nenhum dado disponível. Adicione despesas e receitas para visualizar o gráfico.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
        <div className="stat-card">
          <h2 className="font-semibold mb-4">Despesas por Motorista</h2>
          {expensesByDriver.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={expensesByDriver} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {expensesByDriver.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">Sem despesas registradas.</p>
          )}
        </div>

        <div className="stat-card">
          <h2 className="font-semibold mb-4">Faturamento por Motorista</h2>
          {revenuesByDriver.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={revenuesByDriver} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {revenuesByDriver.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">Sem faturamento registrado.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: "480ms" }}>
        <div className="stat-card">
          <h2 className="font-semibold mb-4">Detalhes Despesas por Motorista</h2>
          {drivers.map((d) => {
            const dExp = expenses.filter((e) => e.driverId === d.id).reduce((s, e) => s + e.amount, 0);
            const pct = totalExpenses > 0 ? (dExp / totalExpenses) * 100 : 0;
            return (
              <div key={d.id} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-muted-foreground tabular-nums">{formatBRL(dExp)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="stat-card">
          <h2 className="font-semibold mb-4">Detalhes Faturamento por Motorista</h2>
          {drivers.map((d) => {
            const dRev = revenues.filter((r) => r.driverId === d.id).reduce((s, r) => s + r.amount, 0);
            const pct = totalRevenues > 0 ? (dRev / totalRevenues) * 100 : 0;
            return (
              <div key={d.id} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-muted-foreground tabular-nums">{formatBRL(dRev)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
