"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Avatar, AvatarFallback, UserCard } from "@/components/ui";
import { Check } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function CompletionPage() {
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
        router.push("/auth/signin");
        return;
      }

      setCurrentUser(user);
      setLoading(false);
    };

    getUser();
  }, [router]);

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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 text-center flex flex-col gap-6">
          <div className="flex flex-col justify-center align-center gap-4">
            <h2 className="text-3xl font-bold text-foreground">
              Bem vindo,{" "}
              {currentUser.user_metadata?.full_name?.split(" ")[0] || currentUser.email}
            </h2>
            <p className="text-muted-foreground mb-6">
              Aqui você poderá gerenciar seus liderados e acompanhar as
              iniciativas com seus discipulos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <UserCard
              id="1"
              imageUrl="https://images.unsplash.com/photo-1755511268115-a7a68109cc8b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              name="João Silva"
              description="Iteração pendente - 6 dias"
              status="active"
            />
            <UserCard
              id="2"
              imageUrl="https://images.unsplash.com/photo-1755511268115-a7a68109cc8b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              name="Maria Santos"
              description="Iteração pendente - 4 dias"
              status="new"
            />
            <UserCard
              id="3"
              imageUrl="https://images.unsplash.com/photo-1756408263381-ed1488d9b1ea?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              name="Pedro Costa"
              description="Iteração pendente - 2 dias"
              status="active"
            />
          </div>

          {/* Yellow Finalizar Button */}
          <div className="flex justify-center mt-8">
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-3 text-lg"
              onClick={() => router.push("/dashboard")}
            >
              <Check className="mr-2 h-5 w-5" />
              Finalizar
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
