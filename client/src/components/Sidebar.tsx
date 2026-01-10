
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  CalendarDays,
  StickyNote,
  Library,
  MessageSquareText,
  LogOut,
  Menu,
  Stethoscope,
  Activity,
  DollarSign,
  Shield,
  ClipboardList,
  Brain,
  User,
  Settings,
  Palette,
  Bot,
  Crown,
  RefreshCw,
  Pill,
  FileEdit,
  FileBadge,
  FileCheck,
  ArrowRightLeft,
  MessageCircle,
  Upload,
  Heart
} from "lucide-react";
import { SubscribeButton } from "@/components/SubscriptionDialog";
import { NotificationBell } from "@/components/NotificationBell";
import { useState } from "react";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FileText, label: "Prescrições", href: "/prescriptions" },
  { icon: FileEdit, label: "Evolução", href: "/evolution" },
  { icon: FileBadge, label: "Atestado", href: "/medical-certificate" },
  { icon: FileCheck, label: "Declaração", href: "/attendance-declaration" },
  { icon: ArrowRightLeft, label: "Encaminhamento", href: "/referral" },
  { icon: Stethoscope, label: "Exames", href: "/exams" },
  { icon: ClipboardList, label: "Protocolos", href: "/protocols" },
  { icon: CheckSquare, label: "Condutas", href: "/checklists" },
  { icon: Pill, label: "Interações", href: "/drug-interactions" },
  { icon: Brain, label: "Memorização", href: "/memorize" },
  { icon: Upload, label: "Importação", href: "/import-templates", adminOnly: true },
  { icon: Stethoscope, label: "Passagem (SBAR)", href: "/handovers" },
  { icon: CalendarDays, label: "Plantões", href: "/shifts" },
  { icon: DollarSign, label: "Financeiro", href: "/finance" },
  { icon: MessageCircle, label: "Assistente IA", href: "/ai-webview" },
  { icon: Library, label: "Biblioteca", href: "/library" },
  { icon: StickyNote, label: "Anotações", href: "/notes" },
  { icon: Heart, label: "Doar", href: "/donate" },
  { icon: User, label: "Meu Perfil", href: "/profile" },
  { icon: Palette, label: "Personalizar", href: "/settings" },
];

function NavContent({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const handleSwitchAccount = () => {
    // Limpa toda a sessão local para garantir que nenhum token antigo permaneça
    localStorage.clear();
    sessionStorage.clear();
    
    // Constrói a URL de logout que redireciona para o login com os parâmetros corretos
    const loginUrl = new URL('/api/login', window.location.origin);
    loginUrl.searchParams.set('prompt', 'select_account');
    loginUrl.searchParams.set('ui_locales', 'pt-BR');

    const logoutUrl = new URL('/api/logout', window.location.origin);
    logoutUrl.searchParams.set('redirect', loginUrl.pathname + loginUrl.search);
    
    // Redireciona para o fluxo de logout -> login
    window.location.href = logoutUrl.toString();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-xl font-bold font-display bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Salva Plantão
          </h1>
          <NotificationBell />
        </div>
        <p className="text-xs text-slate-500 mt-1">Dr. Eudes Rodrigues</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {NAV_ITEMS.filter(item => !item.adminOnly || user?.role === 'admin').map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/25 font-semibold"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "animate-pulse" : "group-hover:text-white")} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}

        {user?.role === 'admin' && (
          <Link href="/admin">
            <div
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group mt-4 border border-amber-900/50",
                location === '/admin'
                  ? "bg-amber-900/20 text-amber-400 shadow-lg shadow-amber-900/10 font-semibold"
                  : "text-amber-500/70 hover:bg-amber-900/20 hover:text-amber-400"
              )}
            >
              <Shield className={cn("h-5 w-5", location === '/admin' ? "animate-pulse" : "group-hover:text-amber-400")} />
              <span>Administrador</span>
            </div>
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        {user?.status !== 'active' && user?.role !== 'admin' && (
          <SubscribeButton className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg" />
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          onClick={handleSwitchAccount}
          data-testid="button-switch-account"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Trocar de Conta
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/20"
          onClick={() => logout()}
          data-testid="button-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
      <NavContent />
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-2 md:hidden">
      <h1 className="text-lg font-bold font-display text-white">Salva Plantão</h1>
      <div className="flex items-center gap-1">
        <NotificationBell />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 bg-slate-900 border-r-slate-800 text-white">
            <NavContent onClose={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
