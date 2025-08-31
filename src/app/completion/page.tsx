"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Button,
  Avatar,
  AvatarFallback,
  UserCard,
  BottomNav,
} from "@/components/ui";
import { Check } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function CompletionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fromUserId = searchParams.get("from");

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
            <h2 className="text-3xl font-bold text-blue-600">
              Bem vindo,{" "}
              {currentUser.user_metadata?.full_name?.split(" ")[0] ||
                currentUser.email}
            </h2>
            <p className="text-blue-400 mb-6">
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
              isFinalizing={fromUserId === "1"}
              hasPendingInteraction={true}
            />
            <UserCard
              id="2"
              imageUrl="https://images.unsplash.com/photo-1755511268115-a7a68109cc8b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              name="Maria Santos"
              description="Interação pendente - 4 dias"
              status="new"
              isFinalizing={fromUserId === "2"}
              hasPendingInteraction={true}
            />
            <UserCard
              id="3"
              imageUrl="https://images.unsplash.com/photo-1756408263381-ed1488d9b1ea?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              name="Pedro Costa"
              description="Interação pendente - 2 dias"
              status="active"
              isFinalizing={fromUserId === "3"}
              hasPendingInteraction={true}
            />
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
