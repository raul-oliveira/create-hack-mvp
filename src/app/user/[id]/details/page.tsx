"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import {
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  Progress,
} from "@/components/ui";
import {
  ArrowLeft,
  User as UserIcon,
  Calendar,
  Tag,
  Clock,
  Heart,
} from "lucide-react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

interface UserDetailsPageProps {
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
      age: 28,
      gender: "Masculino",
      relationship: "Solteiro",
      imageUrl:
        "https://images.unsplash.com/photo-1755511268115-a7a68109cc8b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      tags: ["Ansiedade", "Orgulho", "Procrastinação"],
      timeline: [
        {
          date: "2024-04-20",
          description: "Demonstrou interesse em servir no ministério de louvor",
        },
        {
          date: "2024-05-15",
          description:
            "Participou do retiro espiritual e teve um momento de quebrantamento",
        },
        {
          date: "2024-06-10",
          description: "Começou a liderar um pequeno grupo de jovens",
        },
        {
          date: "2024-07-22",
          description: "Compartilhou testemunho durante o culto principal",
        },
      ],
      relationshipStatus: "bom" as const,
    },
    "2": {
      id: "2",
      name: "Maria Santos",
      age: 32,
      gender: "Feminino",
      relationship: "Casada",
      imageUrl:
        "https://images.unsplash.com/photo-1756408263381-ed1488d9b1ea?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      tags: ["Timidez", "Perfeccionismo"],
      timeline: [
        {
          date: "2024-03-10",
          description: "Iniciou processo de discipulado",
        },
        {
          date: "2024-04-05",
          description: "Demonstrou interesse em ministério infantil",
        },
        {
          date: "2024-05-20",
          description: "Começou a auxiliar nas atividades com crianças",
        },
      ],
      relationshipStatus: "regular" as const,
    },
    "3": {
      id: "3",
      name: "Pedro Costa",
      age: 35,
      gender: "Masculino",
      relationship: "Casado",
      imageUrl:
        "https://images.unsplash.com/photo-1746310712275-c80c0f2dab27?q=80&w=1931&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      tags: ["Liderança", "Mentoria"],
      timeline: [
        {
          date: "2024-02-15",
          description: "Assumiu liderança de célula",
        },
        {
          date: "2024-03-30",
          description: "Organizou evento evangelístico no bairro",
        },
        {
          date: "2024-06-12",
          description: "Iniciou mentoria com novos líderes",
        },
      ],
      relationshipStatus: "otimo" as const,
    },
    "5": {
      id: "5",
      name: "Carlos Ferreira",
      age: 24,
      gender: "Masculino",
      relationship: "Solteiro",
      imageUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      tags: ["Ansiedade", "Insegurança"],
      timeline: [
        {
          date: "2024-01-08",
          description: "Primeira visita à igreja",
        },
        {
          date: "2024-02-20",
          description: "Aceitou Jesus como Salvador",
        },
        {
          date: "2024-04-15",
          description: "Iniciou curso de novos convertidos",
        },
      ],
      relationshipStatus: "ruim" as const,
    },
    "6": {
      id: "6",
      name: "Lucia Mendes",
      age: 29,
      gender: "Feminino",
      relationship: "Solteira",
      imageUrl:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      tags: ["Dedicação", "Organização"],
      timeline: [
        {
          date: "2024-01-20",
          description: "Assumiu coordenação do ministério infantil",
        },
        {
          date: "2024-03-15",
          description: "Organizou acampamento para crianças",
        },
        {
          date: "2024-05-30",
          description: "Iniciou curso de pedagogia cristã",
        },
      ],
      relationshipStatus: "otimo" as const,
    },
  };

  return users[id as keyof typeof users] || null;
};

type RelationshipStatus = "pessimo" | "ruim" | "regular" | "bom" | "otimo";

export default function UserDetailsPage({ params }: UserDetailsPageProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const resolvedParams = use(params);
  const userData = getUserData(resolvedParams.id);
  const [relationshipStatus, setRelationshipStatus] =
    useState<RelationshipStatus>(userData?.relationshipStatus || "regular");

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

  if (!userData) {
    router.push("/discipulos");
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

  const statusLevels: RelationshipStatus[] = [
    "pessimo",
    "ruim",
    "regular",
    "bom",
    "otimo",
  ];
  const statusLabels = {
    pessimo: "Péssimo",
    ruim: "Ruim",
    regular: "Regular",
    bom: "Bom",
    otimo: "Ótimo",
  };

  const getStatusColor = (status: RelationshipStatus) => {
    switch (status) {
      case "pessimo":
        return "bg-red-500";
      case "ruim":
        return "bg-orange-500";
      case "regular":
        return "bg-yellow-500";
      case "bom":
        return "bg-blue-500";
      case "otimo":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusPercentage = (status: RelationshipStatus) => {
    const index = statusLevels.indexOf(status);
    return ((index + 1) / statusLevels.length) * 100;
  };

  const getStatusFromClick = (
    clickX: number,
    totalWidth: number
  ): RelationshipStatus => {
    const percentage = (clickX / totalWidth) * 100;
    const stepSize = 100 / statusLevels.length;
    const stepIndex = Math.floor(percentage / stepSize);
    return statusLevels[Math.min(stepIndex, statusLevels.length - 1)];
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Navigation */}
      <nav className="bg-card border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/discipulos">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-lg font-semibold text-foreground truncate">
                Detalhes do Discípulo
              </h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Sessão 1: Nome e Foto do Usuário */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <Avatar className="w-24 h-24 flex-shrink-0">
              {userData.imageUrl ? (
                <AvatarImage src={userData.imageUrl} alt={userData.name} />
              ) : null}
              <AvatarFallback className="text-2xl font-bold">
                {userData.name
                  .split(" ")
                  .map((n) => n.charAt(0))
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {userData.name}
              </h2>
              <p className="text-lg text-muted-foreground">Discípulo</p>
            </div>
          </div>
        </div>

        {/* Sessão 2: Perfil */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-6">
            <UserIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-foreground">Perfil</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center sm:text-left">
              <div className="text-sm text-muted-foreground mb-1">Idade</div>
              <div className="text-2xl font-bold text-foreground">
                {userData.age}
              </div>
              <div className="text-sm text-muted-foreground">anos</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-sm text-muted-foreground mb-1">Sexo</div>
              <div className="text-lg font-semibold text-foreground">
                {userData.gender}
              </div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-sm text-muted-foreground mb-1">
                Relacionamento
              </div>
              <div className="text-lg font-semibold text-foreground">
                {userData.relationship}
              </div>
            </div>
          </div>
        </div>

        {/* Sessão 3: Tags */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Tag className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-foreground">Tags</h3>
          </div>
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            {userData.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="px-4 py-2 text-sm font-medium"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Sessão 4: Timeline */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-foreground">Timeline</h3>
          </div>
          <div className="space-y-6">
            {userData.timeline.map((event, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-blue-600 rounded-full flex-shrink-0"></div>
                  {index < userData.timeline.length - 1 && (
                    <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-blue-600">
                      {new Date(event.date).toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-foreground leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sessão 5: Status da Relação */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-foreground">
              Status da Relação
            </h3>
          </div>
          <div className="space-y-4">
            {statusLevels.map((status) => (
              <div
                key={status}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setRelationshipStatus(status)}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    relationshipStatus === status
                      ? `${getStatusColor(status)} border-transparent`
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {relationshipStatus === status && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <label
                  className={`text-lg cursor-pointer transition-colors ${
                    relationshipStatus === status
                      ? "font-bold text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {statusLabels[status]}
                </label>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
