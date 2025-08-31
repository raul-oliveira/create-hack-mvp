"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Button,
  Avatar,
  AvatarFallback,
  Badge,
  UserCard,
  BottomNav,
} from "@/components/ui";
import { Search, Filter, Plus, User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { MemberCard } from "@/components/ui/memberCard";

export default function DiscipulosPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Mock data for disciples
  const disciples = [
    {
      id: "1",
      name: "João Silva",
      description: "Líder de célula há 3 anos",
      imageUrl:
        "https://images.unsplash.com/photo-1755511268115-a7a68109cc8b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      status: "active" as const,
      lastContact: "2024-08-28",
      cellGroup: "Célula Alpha",
      rating: "otimo" as const,
    },
    {
      id: "2",
      name: "Maria Santos",
      description: "Nova liderança, iniciou este mês",
      imageUrl:
        "https://images.unsplash.com/photo-1746310712275-c80c0f2dab27?q=80&w=1931&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      status: "new" as const,
      lastContact: "2024-08-27",
      cellGroup: "Célula Beta",
      rating: "bom" as const,
    },
    {
      id: "3",
      name: "Pedro Costa",
      description: "Líder experiente, mentor de novos líderes",
      imageUrl:
        "https://images.unsplash.com/photo-1756408263381-ed1488d9b1ea?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      status: "active" as const,
      lastContact: "2024-08-29",
      cellGroup: "Célula Gamma",
      rating: "otimo" as const,
    },
    {
      id: "5",
      name: "Carlos Ferreira",
      description: "Em processo de discipulado",
      imageUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      status: "new" as const,
      lastContact: "2024-08-25",
      cellGroup: "Célula Beta",
      rating: "regular" as const,
    },
    {
      id: "6",
      name: "Lucia Mendes",
      description: "Coordenadora de ministério infantil",
      imageUrl:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      status: "active" as const,
      lastContact: "2024-08-30",
      cellGroup: "Célula Gamma",
      rating: "bom" as const,
    },
  ];

  const filteredDisciples = disciples.filter(
    (disciple) =>
      disciple.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      disciple.cellGroup.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-blue-600">
                Meus Discípulos
              </h1>
              <Button
                size="icon"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/add-disciple")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nome ..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Stats */}
            {/* <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">
                  {disciples.filter((d) => d.status === "active").length} Ativos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">
                  {disciples.filter((d) => d.status === "new").length} Novos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-gray-600">{disciples.length} Total</span>
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 py-6">
        {filteredDisciples.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <UserIcon className="h-12 w-12 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum discípulo encontrado
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? "Tente ajustar sua busca"
                : "Comece adicionando seus primeiros discípulos"}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center align-center md:justify-start">
            {filteredDisciples.map((disciple) => (
              <MemberCard
                key={disciple.id}
                id={disciple.id}
                name={disciple.name}
                imageUrl={disciple.imageUrl}
                status={disciple.status}
                rating={disciple.rating}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
