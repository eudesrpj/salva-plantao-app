import { useState, useRef, useEffect, useCallback } from "react";
import { X, GripVertical, Pill, FileText, Calculator, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { EmergencyPanelItem } from "@shared/schema";

interface EmergencyFloatingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  patientType?: "adulto" | "pediatrico";
  children?: React.ReactNode;
}

const KIND_ICONS: Record<string, React.ReactNode> = {
  med: <Pill className="h-4 w-4 text-blue-500" />,
  protocol: <FileText className="h-4 w-4 text-green-500" />,
  calc: <Calculator className="h-4 w-4 text-orange-500" />,
  shortcut: <Link2 className="h-4 w-4 text-purple-500" />,
};

export function EmergencyFloatingPanel({ isOpen, onClose, patientType = "adulto", children }: EmergencyFloatingPanelProps) {
  const { toast } = useToast();
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  const { data: items = [], isLoading } = useQuery<EmergencyPanelItem[]>({
    queryKey: ["/api/emergency-panel-items"],
    enabled: isOpen,
  });

  const filteredItems = items.filter((item) => {
    if (!item.enabled) return false;
    if (patientType === "adulto" && item.pedOnly) return false;
    if (patientType === "pediatrico" && item.adultOnly) return false;
    return true;
  });

  const clampPosition = useCallback((x: number, y: number) => {
    if (!panelRef.current) return { x, y };
    const panel = panelRef.current;
    const rect = panel.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    };
  }, []);

  const centerPanel = useCallback(() => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const x = Math.max(0, (window.innerWidth - rect.width) / 2);
    const y = Math.max(0, (window.innerHeight - rect.height) / 2);
    setPosition({ x, y });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(centerPanel, 10);
    }
  }, [isOpen, centerPanel]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev.x, prev.y));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampPosition]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { x: position.x, y: position.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const newPos = clampPosition(initialPos.current.x + dx, initialPos.current.y + dy);
    setPosition(newPos);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleItemClick = (item: EmergencyPanelItem) => {
    const payload = item.payload as Record<string, unknown> | null;
    if (payload?.link && typeof payload.link === "string") {
      window.open(payload.link, "_blank");
      return;
    }
    if (payload?.template && typeof payload.template === "string") {
      navigator.clipboard.writeText(payload.template);
      toast({ title: "Copiado!", description: item.label });
      return;
    }
    if (payload?.dose && typeof payload.dose === "string") {
      navigator.clipboard.writeText(`${item.label}: ${payload.dose}`);
      toast({ title: "Dose copiada!", description: `${item.label}: ${payload.dose}` });
      return;
    }
    toast({ title: item.label, description: item.subtitle || "Ação rápida de emergência" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 print:hidden">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        data-testid="emergency-panel-backdrop"
      />
      <div
        ref={panelRef}
        className="absolute bg-background rounded-xl shadow-2xl overflow-hidden border border-border"
        style={{
          left: position.x,
          top: position.y,
          width: "min(360px, calc(100vw - 32px))",
          maxHeight: "min(80vh, calc(100vh - 64px))",
          touchAction: "none",
        }}
        data-testid="emergency-floating-panel"
      >
        <div
          className="flex items-center justify-between px-3 py-2 bg-red-600 cursor-move select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          data-testid="emergency-panel-header"
        >
          <div className="flex items-center gap-2 text-white">
            <GripVertical className="h-4 w-4 opacity-60" />
            <span className="font-semibold text-sm">Emergência</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-7 w-7 text-white hover:bg-red-700"
            data-testid="button-close-emergency-panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="p-3 overflow-y-auto" style={{ height: "calc(min(80vh, calc(100vh - 64px)) - 44px)" }}>
          {children ? (
            children
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Nenhum item configurado
            </p>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                  data-testid={`emergency-item-${item.id}`}
                >
                  <div className="flex-shrink-0">
                    {KIND_ICONS[item.kind] || KIND_ICONS.shortcut}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.label}</p>
                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
