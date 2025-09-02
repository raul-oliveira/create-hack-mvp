"use client";

import { Avatar, AvatarFallback, BottomNav } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function MetricsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUser(user);
      setLoading(false);
    };

    getUser();
  }, [router]);

  // Dados para o gráfico de pizza - Saúde dos Relacionamentos
  const relationshipHealthData = [
    { name: "Péssimo", value: 5, color: "#ef4444" },
    { name: "Ruim", value: 5, color: "#f97316" },
    { name: "Regular", value: 15, color: "#eab308" },
    { name: "Bom", value: 40, color: "#3b82f6" },
    { name: "Ótimo", value: 35, color: "#22c55e" },
  ];

  // Dados para o gráfico de barras - Interações Mensais
  const monthlyInteractionsData = [
    { month: "Ago", interactions: 18 },
    { month: "Set", interactions: 25 },
    { month: "Out", interactions: 22 },
    { month: "Nov", interactions: 28 },
    { month: "Dez", interactions: 30 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-600">Métricas</h1>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {(
                  currentUser.user_metadata?.full_name ||
                  currentUser.email ||
                  "U"
                )
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-8">
        {/* Saúde dos Relacionamentos - Gráfico de Pizza */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Saúde dos Relacionamentos
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={relationshipHealthData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {relationshipHealthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, "Percentual"]} />
                {/* <Legend /> */}
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interações Mensais - Gráfico de Barras */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Interações Mensais
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyInteractionsData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 5,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 30]} />
                <Tooltip formatter={(value) => [`${value}`, "Interações"]} />
                <Bar
                  dataKey="interactions"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Resumo Geral
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">123</div>
              <div className="text-sm text-muted-foreground">
                Total de Interações
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">75%</div>
              <div className="text-sm text-muted-foreground">
                Relacionamentos Saudáveis
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                24.6
              </div>
              <div className="text-sm text-muted-foreground">
                Tempo de RespostaMédio
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
