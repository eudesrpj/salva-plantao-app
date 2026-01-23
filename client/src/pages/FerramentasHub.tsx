/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com
*/

import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import {
  Brain,
  Pill,
  ArrowLeftRight,
  MessageCircle,
  BookMarked,
  Calculator
} from "lucide-react";

const TOOLS_SHORTCUTS = [
  {
    title: "Calculadoras",
    description: "Ferramentas de cálculo rápido",
    icon: Calculator,
    href: "/calculators",
    color: "bg-blue-100"
  },
  {
    title: "Interações",
    description: "Verificar interações medicamentosas",
    icon: ArrowLeftRight,
    href: "/drug-interactions",
    color: "bg-amber-100"
  },
  {
    title: "Medicações",
    description: "Biblioteca de medicações",
    icon: Pill,
    href: "/library",
    color: "bg-green-100"
  },
  {
    title: "Memorização",
    description: "Flashcards e estudo",
    icon: Brain,
    href: "/memorize",
    color: "bg-purple-100"
  },
  {
    title: "Chat Médico",
    description: "Chat com outros médicos",
    icon: MessageCircle,
    href: "/chat",
    color: "bg-pink-100"
  },
  {
    title: "Assistente IA",
    description: "Assistente inteligente",
    icon: BookMarked,
    href: "/ai-webview",
    color: "bg-indigo-100"
  }
];

export default function FerramentasHub() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-display">
            Ferramentas
          </h1>
          <p className="text-slate-600 mt-2">
            Calculadoras, referências e recursos de aprendizado
          </p>
        </header>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS_SHORTCUTS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href}>
                <a>
                  <Card className={`h-full ${tool.color} hover:shadow-lg transition-shadow cursor-pointer border-0`}>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <Icon className="h-10 w-10 mb-3 text-slate-700" />
                      <h3 className="font-semibold text-slate-900 text-lg">{tool.title}</h3>
                      <p className="text-sm text-slate-600 mt-2">{tool.description}</p>
                    </CardContent>
                  </Card>
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
