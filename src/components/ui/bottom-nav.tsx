"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, User, CheckSquare, Book } from "lucide-react";
import { lazy } from "zod/v3";

interface BottomNavProps {
  className?: string;
}

const BottomNav = React.forwardRef<HTMLDivElement, BottomNavProps>(
  ({ className }, ref) => {
    const router = useRouter();
    const pathname = usePathname();

    const navItems = [
      {
        icon: Home,
        label: "Home",
        path: "/dashboard",
        isActive: pathname === "/dashboard",
      },
      {
        icon: User,
        label: "Discípulos",
        path: "/discipulos",
        isActive: pathname === "/discipulos",
      },
      {
        icon: CheckSquare,
        label: "Tarefas",
        path: "/tasks",
        isActive: pathname === "/tasks",
      },
      {
        icon: Book,
        label: "Recursos",
        path: "/resources",
        isActive: pathname === "/resources",
      },
    ];

    return (
      <div
        ref={ref}
        className={cn(
          "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50",
          "bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl shadow-lg",
          "px-2 py-1.5",
          className
        )}
      >
        <div className="flex items-center justify-center gap-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200",
                  "hover:bg-blue-50 active:scale-95",
                  item.isActive
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-blue-600"
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6 transition-colors",
                    item.isActive ? "text-blue-600" : "text-gray-500"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    item.isActive ? "text-blue-600" : "text-gray-500"
                  )}
                >
                  {/* {item.label} */}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);
BottomNav.displayName = "BottomNav";

export { BottomNav };
