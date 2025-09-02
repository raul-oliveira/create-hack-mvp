"use client";

import { BottomNav, UserCard, ThemeToggle, Avatar, AvatarFallback } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizedUsers, setFinalizedUsers] = useState<string[]>([]);

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

      // Load finalized users from localStorage
      const finalized = JSON.parse(
        localStorage.getItem("finalizedUsers") || "[]"
      );
      setFinalizedUsers(finalized);

      setLoading(false);
    };

    getUser();
  }, [router]);

  // Define all users with their data
  const allUsers = [
    {
      id: "1",
      name: "João Silva",
      description: "Interação pendente - 6 dias",
      status: "active" as const,
      imageUrl:
        "https://images.unsplash.com/photo-1755511268115-a7a68109cc8b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: "2",
      name: "Maria Santos",
      description: "Interação pendente - 4 dias",
      status: "new" as const,
      imageUrl:
        "https://images.unsplash.com/photo-1756408263381-ed1488d9b1ea?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: "3",
      name: "Pedro Costa",
      description: "Interação pendente - 2 dias",
      status: "active" as const,
      imageUrl:
        "https://images.unsplash.com/photo-1746310712275-c80c0f2dab27?q=80&w=1931&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ];

  // Filter out finalized users
  const pendingUsers = allUsers.filter(
    (user) => !finalizedUsers.includes(user.id)
  );

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-foreground">
                Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {(
                    currentUser?.user_metadata?.full_name ||
                    currentUser?.email ||
                    "U"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 text-center flex flex-col gap-6">
          <div className="flex flex-col justify-center align-center gap-4">
            <h2 className="text-3xl font-bold text-blue-600">
              Bem vindo,{" "}
              {currentUser?.user_metadata?.full_name?.split(" ")[0] ||
                currentUser?.email}
            </h2>
            <p className="text-blue-700 mb-6">
              Aqui você poderá gerenciar seus liderados e acompanhar as
              iniciativas com seus discípulos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingUsers.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-2">
                  <Users className="h-12 w-12 mx-auto mb-4" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Todas as interações foram finalizadas!
                </h3>
                <p className="text-gray-500">
                  Parabéns! Você completou todas as interações pendentes.
                </p>
              </div>
            ) : (
              pendingUsers.map((user) => (
                <UserCard
                  key={user.id}
                  id={user.id}
                  imageUrl={user.imageUrl}
                  name={user.name}
                  description={user.description}
                  status={user.status}
                  hasPendingInteraction={true}
                />
              ))
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
