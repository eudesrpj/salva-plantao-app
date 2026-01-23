/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com
*/

import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  FileEdit,
  FileBadge,
  FileCheck,
  ArrowRightLeft,
  Stethoscope,
  ClipboardList,
  AlertCircle
} from "lucide-react";

const ATTENDANCE_SHORTCUTS = [
  {
    title: "Prescrição",
    description: "Criar nova prescrição",
    icon: FileText,
    href: "/prescriptions",
    color: "bg-blue-100"
  },
  {
    title: "Evolução",
    description: "Adicionar evolução",
    icon: FileEdit,
    href: "/evolution",
    color: "bg-green-100"
  },
  {
    title: "Exames",
    description: "Solicitar/gerar exames",
    icon: Stethoscope,
    href: "/exams",
    color: "bg-purple-100"
  },
  {
    title: "Atestado",
    description: "Gerar atestado médico",
    icon: FileBadge,
    href: "/medical-certificate",
    color: "bg-orange-100"
  },
  {
    title: "Encaminhamento",
    description: "Criar encaminhamento",
    icon: ArrowRightLeft,
    href: "/referral",
    color: "bg-pink-100"
  },
  {
    title: "Declaração",
    description: "Declaração de comparecimento",
    icon: FileCheck,
    href: "/attendance-declaration",
    color: "bg-cyan-100"
  },
  {
    title: "Protocolos",
    description: "Acessar protocolos",
    icon: ClipboardList,
    href: "/protocols",
    color: "bg-indigo-100"
  },
  {
    title: "Emergência",
    description: "Acesso rápido emergência",
    icon: AlertCircle,
    href: "/",
    color: "bg-red-100",
    featured: true
  }
];

export default function AtendimentoHub() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-display">
            Atendimento
          </h1>
          <p className="text-slate-600 mt-2">
            Acesso rápido às principais ferramentas de atendimento
          </p>
        </header>

        {/* Featured - Emergency */}
        <div className="mb-8">
          <Link href="/emergency">
            <a>
              <Card className="border-2 border-red-300 bg-gradient-to-r from-red-50 to-red-100 hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-12 w-12 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-red-900">Emergência</h2>
                    <p className="text-red-700">Acesso rápido para situações de emergência</p>
                  </div>
                  <div className="text-red-600 text-2xl">→</div>
                </CardContent>
              </Card>
            </a>
          </Link>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ATTENDANCE_SHORTCUTS.filter(s => !s.featured).map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Link key={shortcut.href} href={shortcut.href}>
                <a>
                  <Card className={`h-full ${shortcut.color} hover:shadow-lg transition-shadow cursor-pointer border-0`}>
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <Icon className="h-8 w-8 mb-3 text-slate-700" />
                      <h3 className="font-semibold text-slate-900">{shortcut.title}</h3>
                      <p className="text-xs text-slate-600 mt-1">{shortcut.description}</p>
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
