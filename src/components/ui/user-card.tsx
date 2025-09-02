"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";

type Rating = "pessimo" | "ruim" | "regular" | "bom" | "otimo";

interface UserCardProps {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  status?: "active" | "inactive" | "new";
  className?: string;
  isFinalizing?: boolean;
  rating?: Rating;
  hasPendingInteraction?: boolean;
}

const UserCard = React.forwardRef<HTMLDivElement, UserCardProps>(
  ({ id, name, description, imageUrl, className, isFinalizing }, ref) => {
    const router = useRouter();
    const getInitials = (name: string) => {
      return name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
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
      <div ref={ref} className={cn("space-y-4", className)}>
        <div
          className={cn(
            "bg-card rounded-2xl border p-3 hover:shadow-md transition-shadow h-24 flex items-center",
            !isFinalizing && "cursor-pointer hover:bg-accent/50"
          )}
          onClick={!isFinalizing ? () => router.push(`/user/${id}`) : undefined}
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
                {isFinalizing && (
                  <div className="flex">
                    <p className="text-sm text-muted-foreground ">
                      Em Progresso
                    </p>
                  </div>
                )}
                <div className="flex gap-1">
                  <h3 className="font-semibold text-foreground">{name}</h3>
                  {/* {getStatusBadge()} */}
                </div>
                <div className="flex gap-1">
                  <p className="text-sm text-muted-foreground text-orange-700">
                    {description}
                  </p>
                </div>
              </div>

              {isFinalizing && (
                <div className="flex justify-center items-center">
                  <Button
                    className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-2 py-2 text-sm"
                    onClick={() =>
                      router.push(
                        `/finalize?userId=${id}&userName=${encodeURIComponent(
                          name
                        )}`
                      )
                    }
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Finalizar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
UserCard.displayName = "UserCard";

export { UserCard, type UserCardProps };
