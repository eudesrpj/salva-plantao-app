import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmergencyFloatingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function EmergencyFloatingPanel({ isOpen, onClose, children }: EmergencyFloatingPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-slate-100 dark:bg-slate-950 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-red-600">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Ações Rápidas de Emergência
          </h2>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={onClose}
            className="text-white hover:bg-red-700"
            data-testid="button-close-emergency-panel"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="p-4 max-h-[calc(90vh-80px)]">
          {children}
        </ScrollArea>
      </div>
    </div>
  );
}
