"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Textarea } from "@/components/ui";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

export default function FinalizePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [iterationText, setIterationText] = useState("");
  const [sending, setSending] = useState(false);

  const userId = searchParams.get("userId") || "1";
  const userName = searchParams.get("userName") || "Usuário";

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

  const handleSendIteration = async () => {
    if (!iterationText.trim()) return;

    setSending(true);

    // Simulate API call to save iteration
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Here you would typically send the iteration data to your backend
    console.log("Iteration saved:", {
      userId,
      userName,
      description: iterationText,
      date: new Date().toISOString(),
    });

    setSending(false);
    router.push("/dashboard");
  };

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
      {/* Navigation */}
      <nav className="bg-card border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/completion">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-lg font-semibold text-foreground">
                Finalizar a Interação com o Discipulado
              </h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-2xl mx-auto">
        <div className="bg-card rounded-lg border p-6 space-y-6">
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

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Resumo da Interação
              </label>
              <Textarea
                placeholder="Descreva como foi a conversa, principais tópicos abordados, próximos passos, observações importantes..."
                className="min-h-[200px] resize-none"
                value={iterationText}
                onChange={(e) => setIterationText(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSendIteration}
                disabled={!iterationText.trim() || sending}
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
