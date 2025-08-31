"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { Badge } from "./badge";

interface UserCardProps {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  status?: "active" | "inactive" | "new";
  className?: string;
}

const UserCard = React.forwardRef<HTMLDivElement, UserCardProps>(
  ({ id, name, description, imageUrl, status, className }, ref) => {
    const router = useRouter();
    const getInitials = (name: string) => {
      return name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    const getStatusBadge = () => {
      switch (status) {
        case "active":
          return <Badge className="text-xs">Ativo</Badge>;
        case "inactive":
          return (
            <Badge variant="secondary" className="text-xs">
              Inativo
            </Badge>
          );
        case "new":
          return (
            <Badge variant="outline" className="text-xs">
              Novo
            </Badge>
          );
        default:
          return null;
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-card rounded-2xl border p-3 hover:shadow-md transition-shadow cursor-pointer hover:bg-accent/50",
          className
        )}
        onClick={() => router.push(`/user/${id}`)}
      >
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 flex-shrink-0">
            {imageUrl ? <AvatarImage src={imageUrl} alt={name} /> : null}
            <AvatarFallback className="text-lg font-semibold">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col space-y-2 flex-1">
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
        </div>
      </div>
    );
  }
);
UserCard.displayName = "UserCard";

export { UserCard, type UserCardProps };
