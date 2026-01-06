import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, FileText, ClipboardList, 
  Bot, Calendar, Wallet, Library, StickyNote, 
  LogOut, User, Activity, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/prescriptions", icon: FileText, label: "Prescrições" },
    { href: "/checklists", icon: ClipboardList, label: "Checklists" },
    { href: "/ai-chat", icon: Bot, label: "Interconsulta IA", highlight: true },
    { href: "/shifts", icon: Calendar, label: "Agenda & Plantões" },
    { href: "/finance", icon: Wallet, label: "Financeiro" },
    { href: "/library", icon: Library, label: "Biblioteca" },
    { href: "/notes", icon: StickyNote, label: "Anotações" },
  ];

  return (
    <div className="flex h-screen flex-col border-r bg-white w-64 hidden md:flex fixed left-0 top-0 shadow-lg z-20">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-slate-900 leading-none">Salva Plantão</h1>
            <p className="text-xs text-slate-500 mt-1">Sua central médica</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  item.highlight && !isActive && "text-blue-600 bg-blue-50 border border-blue-100"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-9 w-9 border bg-white">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">DR</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate text-slate-900">{user?.firstName || "Doutor"}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
        <div className="mt-4 text-[10px] text-center text-slate-400 font-medium">
          Criado por: Dr. Eudes Rodrigues
        </div>
      </div>
    </div>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  const navItems = [
    { href: "/", icon: LayoutDashboard },
    { href: "/shifts", icon: Calendar },
    { href: "/ai-chat", icon: Bot },
    { href: "/notes", icon: StickyNote },
    { href: "/finance", icon: Wallet },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-50 pb-safe">
      <div className="flex justify-around items-center p-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all",
                isActive ? "text-primary bg-primary/10" : "text-slate-400"
              )}>
                <item.icon className="h-6 w-6" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
