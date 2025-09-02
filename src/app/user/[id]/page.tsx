"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Textarea,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Clock,
  Lightbulb,
  MessageSquare,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

interface UserPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Dados mockados para demonstração
const getUserData = (id: string) => {
  const users = {
    "1": {
      id: "1",
      name: "João Silva",
      email: "joao.silva@email.com",
      phone: "5511988328828",
      address: "São Paulo, SP",
      imageUrl:
        "https://images.unsplash.com/photo-1755511268115-a7a68109cc8b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      status: "active" as const,
      joinDate: "2021-03-15",
      lastContact: "2024-08-28",
      description: "Líder de célula há 3 anos, responsável por 15 membros",
      activities: [
        {
          date: "2024-08-28",
          type: "Reunião",
          description: "Reunião de célula semanal",
        },
        {
          date: "2024-08-25",
          type: "Visita",
          description: "Visita pastoral à família Santos",
        },
        {
          date: "2024-08-20",
          type: "Evento",
          description: "Organização do culto jovem",
        },
      ],
    },
    "2": {
      id: "2",
      name: "Maria Santos",
      email: "maria.santos@email.com",
      phone: "(11) 88888-8888",
      address: "São Paulo, SP",
      imageUrl:
        "https://images.unsplash.com/photo-1756408263381-ed1488d9b1ea?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      status: "new" as const,
      joinDate: "2024-08-01",
      lastContact: "2024-08-27",
      description: "Nova liderança, iniciou este mês",
      activities: [
        {
          date: "2024-08-27",
          type: "Treinamento",
          description: "Curso de liderança básica",
        },
        {
          date: "2024-08-24",
          type: "Mentoria",
          description: "Sessão de mentoria com líder sênior",
        },
      ],
    },
    "3": {
      id: "3",
      name: "Pedro Costa",
      email: "pedro.costa@email.com",
      phone: "(11) 77777-7777",
      address: "São Paulo, SP",
      imageUrl:
        "https://images.unsplash.com/photo-1746310712275-c80c0f2dab27?q=80&w=1931&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      status: "active" as const,
      joinDate: "2019-05-10",
      lastContact: "2024-08-29",
      description: "Líder experiente, mentor de novos líderes",
      activities: [
        {
          date: "2024-08-29",
          type: "Mentoria",
          description: "Mentoria com novos líderes",
        },
        {
          date: "2024-08-26",
          type: "Reunião",
          description: "Reunião de planejamento mensal",
        },
        {
          date: "2024-08-22",
          type: "Evento",
          description: "Coordenação do retiro espiritual",
        },
      ],
    },
  };

  return users[id as keyof typeof users] || null;
};

export default function UserPage({ params }: UserPageProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const resolvedParams = use(params);

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

  const userData = getUserData(resolvedParams.id);

  if (!userData) {
    router.push("/dashboard");
    return null;
  }

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
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-lg font-semibold text-foreground truncate">
                {userData.name}
              </h1>
            </div>
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
      </nav>

      {/* Mobile-first content */}
      <main className="px-4 py-4 space-y-4">
        {/* User Profile Header */}
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 flex-shrink-0">
              {userData.imageUrl ? (
                <AvatarImage src={userData.imageUrl} alt={userData.name} />
              ) : null}
              <AvatarFallback className="text-lg font-bold">
                {userData.name
                  .split(" ")
                  .map((n) => n.charAt(0))
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <Link href={`/user/${userData.id}/details`}>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-foreground truncate">
                    {userData.name}
                  </h2>
                  <Badge
                    variant={
                      userData.status === "active"
                        ? "default"
                        : userData.status === "new"
                        ? "outline"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {userData.status === "active"
                      ? "Ativo"
                      : userData.status === "new"
                      ? "Novo"
                      : "Inativo"}
                  </Badge>
                </div>
              </Link>
              {/* <p className="text-sm text-muted-foreground">
                {userData.description}
              </p> */}
            </div>
          </div>
        </div>

        {/* Insights da Interação Geral */}
        <div className="space-y-3">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
            <p className="text-sm text-blue-800">
              <strong>Insight:</strong> João está em um momento de transição e
              crescimento. É um bom momento para investir em seu desenvolvimento
              como líder e oferecer suporte nas questões pessoais.
            </p>
          </div>
        </div>

        {/* Section 1: Últimas Iterações */}
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Últimas Iterações
            </h3>
          </div>
          <div className="space-y-3">
            {userData.activities.slice(0, 4).map((activity, index) => (
              <div key={index} className="border-l-2 border-primary pl-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">
                    {activity.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  {activity.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Insights da Interação */}
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Insights da Interação
            </h3>
          </div>
          <div className="space-y-3">
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">
                Resumo das Últimas Conversas
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  • <strong>Última conversa (28/08):</strong> João demonstrou
                  interesse em assumir mais responsabilidades na célula.
                  Mencionou que tem se sentido mais confiante para liderar
                  estudos bíblicos.
                </p>
                <p>
                  • <strong>Conversa anterior (21/08):</strong> Compartilhou
                  desafios pessoais relacionados ao trabalho e como isso tem
                  afetado sua participação nas atividades. Pediu oração pela
                  situação profissional.
                </p>
                <p>
                  • <strong>Observação (15/08):</strong> Mostrou-se muito
                  engajado durante o retiro espiritual. Teve um momento de
                  quebrantamento durante a ministração e demonstrou desejo de
                  crescer espiritualmente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Próximas Ações Sugeridas */}
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Próximas Ações Sugeridas
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium text-foreground mb-1">
                  Agendar reunião individual
                </h4>
                <p className="text-sm text-muted-foreground">
                  Marcar um encontro para conversar sobre crescimento espiritual
                  e desafios pessoais.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium text-foreground mb-1">
                  Enviar material de estudo
                </h4>
                <p className="text-sm text-muted-foreground">
                  Compartilhar recursos sobre liderança cristã e desenvolvimento
                  pessoal.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium text-foreground mb-1">
                  Convidar para evento
                </h4>
                <p className="text-sm text-muted-foreground">
                  Incluir nas próximas atividades da célula e eventos especiais
                  da igreja.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: WhatsApp Message Draft */}
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Rascunho de Mensagem
            </h3>
          </div>
          <div className="space-y-4">
            <Textarea
              placeholder="Olá! Como você está? Gostaria de conversar sobre..."
              className="min-h-[120px] resize-none"
              defaultValue={`Olá ${userData.name.split(" ")[0]}! 👋

Espero que você esteja bem! Queria saber como tem sido sua caminhada e se há algo em que posso te ajudar.

Que tal marcarmos um café para conversarmos? Tenho algumas ideias interessantes para compartilhar com você.

Fica com Deus! 🙏`}
            />
            <Button
              className="w-full"
              onClick={() => {
                const textarea = document.querySelector(
                  "textarea"
                ) as HTMLTextAreaElement;
                if (textarea) {
                  const message = encodeURIComponent(textarea.value);
                  const phoneNumber = userData.phone.replace(/\D/g, ""); // Remove non-digits
                  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
                  window.open(whatsappUrl, "_blank");

                  localStorage.setItem("lastProcessedUser", resolvedParams.id);
                  router.push(`/completion?from=${resolvedParams.id}`);
                }
              }}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Enviar via WhatsApp
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
