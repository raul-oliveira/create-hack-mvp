import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import {
  Button,
  Calendar,
  Avatar,
  Badge,
  PieChart,
  ChartContainer,
  UserCard,
  BottomNav,
} from "@/components/ui";
import {
  Users,
  Target,
  AlertCircle,
  Calendar as CalendarIcon,
  BarChart3,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Dados de exemplo para o gráfico
  const chartData = [
    { name: "Ativos", value: 45, color: "hsl(var(--chart-1))" },
    { name: "Novos", value: 25, color: "hsl(var(--chart-2))" },
    { name: "Inativos", value: 20, color: "hsl(var(--chart-3))" },
    { name: "Visitantes", value: 10, color: "hsl(var(--chart-4))" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* <nav className="bg-card border-b hidden md:flex md:jus ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-foreground">
                Assistente do Líder de Célula
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar>
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  {(user.user_metadata?.full_name || user.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              </Avatar>
              <span className="text-muted-foreground">
                Olá, {user.user_metadata?.full_name || user.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav> */}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 text-center flex flex-col gap-6">
          <div className="flex flex-col justify-center align-center gap-4">
            <h2 className="text-3xl font-bold text-blue-600">
              Bem vindo,{" "}
              {user.user_metadata?.full_name.split(" ")[0] || user.email}
            </h2>
            <p className="text-blue-700 mb-6">
              Aqui você poderá gerenciar seus liderados e acompanhar as
              iniciativas com seus discípulos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <UserCard
              id="1"
              imageUrl="https://images.unsplash.com/photo-1755511268115-a7a68109cc8b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              name="João Silva"
              description="Interação pendente - 6 dias"
              status="active"
            />
            <UserCard
              id="2"
              imageUrl="https://images.unsplash.com/photo-1755511268115-a7a68109cc8b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              name="Maria Santos"
              description="Interação pendente - 4 dias"
              status="new"
            />
            <UserCard
              id="3"
              imageUrl="https://images.unsplash.com/photo-1756408263381-ed1488d9b1ea?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              name="Pedro Costa"
              description="Interação pendente - 2 dias"
              status="active"
            />
          </div>
        </div>
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
