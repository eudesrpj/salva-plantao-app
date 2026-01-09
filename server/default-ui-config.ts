
import type { UIConfig } from "@shared/ui-config";

export const DEFAULT_UI_CONFIG: UIConfig = {
  sidebarMenu: [
    { id: "dashboard", label: "Dashboard", route: "/", icon: "LayoutDashboard", visible: true, adminOnly: false },
    { id: "prescriptions", label: "Prescrições", route: "/prescriptions", icon: "FileText", visible: true, adminOnly: false },
    { id: "evolution", label: "Evolução", route: "/evolution", icon: "FileEdit", visible: true, adminOnly: false },
    { id: "medical-certificate", label: "Atestado", route: "/medical-certificate", icon: "FileBadge", visible: true, adminOnly: false },
    { id: "attendance-declaration", label: "Declaração", route: "/attendance-declaration", icon: "FileCheck", visible: true, adminOnly: false },
    { id: "referral", label: "Encaminhamento", route: "/referral", icon: "ArrowRightLeft", visible: true, adminOnly: false },
    { id: "protocols", label: "Protocolos", route: "/protocols", icon: "ClipboardList", visible: true, adminOnly: false },
    { id: "checklists", label: "Condutas", route: "/checklists", icon: "CheckSquare", visible: true, adminOnly: false },
    { id: "drug-interactions", label: "Interações", route: "/drug-interactions", icon: "Pill", visible: true, adminOnly: false },
    { id: "memorize", label: "Memorização", route: "/memorize", icon: "Brain", visible: true, adminOnly: false },
    { id: "import-templates", label: "Importação", route: "/import-templates", icon: "Upload", visible: true, adminOnly: true },
    { id: "handovers", label: "Passagem (SBAR)", route: "/handovers", icon: "Stethoscope", visible: true, adminOnly: false },
    { id: "shifts", label: "Plantões", route: "/shifts", icon: "CalendarDays", visible: true, adminOnly: false },
    { id: "finance", label: "Financeiro", route: "/finance", icon: "DollarSign", visible: true, adminOnly: false },
    { id: "ai-webview", label: "Assistente IA", route: "/ai-webview", icon: "MessageCircle", visible: true, adminOnly: false },
    { id: "library", label: "Biblioteca", route: "/library", icon: "Library", visible: true, adminOnly: false },
    { id: "notes", label: "Anotações", route: "/notes", icon: "StickyNote", visible: true, adminOnly: false },
    { id: "donate", label: "Doar", route: "/donate", icon: "Heart", visible: true, adminOnly: false },
    { id: "profile", label: "Meu Perfil", route: "/profile", icon: "User", visible: true, adminOnly: false },
    { id: "settings", label: "Personalizar", route: "/settings", icon: "Palette", visible: true, adminOnly: false },
  ],
  pageTabs: {
    prescriptions: [
      { id: "patologias", label: "Por Patologia", value: "patologias", visible: true, adminOnly: false },
      { id: "minhas", label: "Minhas Prescrições", value: "minhas", visible: true, adminOnly: false },
      { id: "favoritos", label: "Favoritos", value: "favoritos", visible: true, adminOnly: false },
    ],
  },
};
