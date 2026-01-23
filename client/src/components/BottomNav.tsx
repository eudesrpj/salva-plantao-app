/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com
*/

import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import React from "react";
import {
  Activity,
  Wrench,
  DollarSign,
  User
} from "lucide-react";

interface BottomNavTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const BOTTOM_NAV_TABS: BottomNavTab[] = [
  {
    id: "attendance",
    label: "Atendimento",
    icon: Activity,
    href: "/atendimento"
  },
  {
    id: "tools",
    label: "Ferramentas",
    icon: Wrench,
    href: "/ferramentas"
  },
  {
    id: "finance",
    label: "Financeiro",
    icon: DollarSign,
    href: "/financeiro"
  },
  {
    id: "profile",
    label: "Perfil",
    icon: User,
    href: "/perfil"
  }
];

export function BottomNav() {
  const [location] = useLocation();

  // Check if we're on one of the new hub routes
  const isOnNewNav = BOTTOM_NAV_TABS.some(tab => location.startsWith(tab.href));

  if (!isOnNewNav && !location.includes("atendimento") && !location.includes("ferramentas") && !location.includes("financeiro") && !location.includes("perfil")) {
    return null; // Don't show on old routes yet
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden">
      <div className="flex justify-around items-center h-16">
        {BOTTOM_NAV_TABS.map((tab) => {
          const isActive = location.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link key={tab.id} href={tab.href}>
              <a
                className={cn(
                  "flex flex-col items-center justify-center w-full h-16 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary border-t-2 border-primary bg-blue-50"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Icon className="h-6 w-6 mb-1" />
                <span className="truncate">{tab.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
