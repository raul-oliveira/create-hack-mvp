"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

type Rating = "pessimo" | "ruim" | "regular" | "bom" | "otimo";

interface MemberCardProps {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  status?: "active" | "inactive" | "new";
  className?: string;
  isFinalizing?: boolean;
  rating?: Rating;
}

const MemberCard = React.forwardRef<HTMLDivElement, MemberCardProps>(
  ({ id, name, imageUrl, className, isFinalizing, rating }, ref) => {
    const router = useRouter();
    const getInitials = (name: string) => {
      return name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    const getRatingDisplay = () => {
      if (!rating) return null;

      const ratingConfig = {
        pessimo: { label: "Péssimo", color: "bg-red-500" },
        ruim: { label: "Ruim", color: "bg-red-400" },
        regular: { label: "Regular", color: "bg-yellow-500" },
        bom: { label: "Bom", color: "bg-green-400" },
        otimo: { label: "Ótimo", color: "bg-green-600" },
      };

      const config = ratingConfig[rating];

      return (
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
          <span className="text-xs text-gray-600">{config.label}</span>
        </div>
      );
    };

    // const getStatusBadge = () => {
    //   switch (status) {
    //     case "active":
    //       return <Badge className="text-xs">Ativo</Badge>;
    //     case "inactive":
    //       return (
    //         <Badge variant="secondary" className="text-xs">
    //           Inativo
    //         </Badge>
    //       );
    //     case "new":
    //       return (
    //         <Badge variant="outline" className="text-xs">
    //           Novo
    //         </Badge>
    //       );
    //     default:
    //       return null;
    //   }
    // };

    return (
      <div ref={ref} className={cn("space-y-4 w-[21rem]", className)}>
        <div
          className={cn(
            "bg-card rounded-2xl border p-3 hover:shadow-md transition-shadow h-24 flex items-center",
            !isFinalizing && "cursor-pointer hover:bg-accent/50"
          )}
          onClick={
            !isFinalizing ? () => router.push(`/user/${id}/details`) : undefined
          }
        >
          <div className="flex items-center gap-4 w-full">
            <Avatar className="w-16 h-16 flex-shrink-0">
              {imageUrl ? <AvatarImage src={imageUrl} alt={name} /> : null}
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex  align-center space-y-2 flex-1">
              <div className="flex flex-col space-y-2 flex-1">
                <div className="flex flex-col gap-2 justify-between">
                  <h3 className="font-semibold text-foreground">{name}</h3>
                  {getRatingDisplay()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
MemberCard.displayName = "MemberCard";

export { MemberCard, type MemberCardProps };
