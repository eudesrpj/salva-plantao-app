import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationSettings } from "@/components/NotificationSettings";
import { Bell, AlertTriangle, Info, ExternalLink, Check, Loader2, Settings } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";

interface NotificationMessage {
  id: number;
  title: string;
  body: string;
  url: string | null;
  category: string;
  segment: string | null;
  createdAt: string;
  isRead: boolean;
}

export default function Notifications() {
  const [, setLocation] = useLocation();
  
  const { data, isLoading, refetch } = useQuery<{ messages: NotificationMessage[] }>({
    queryKey: ["/api/notifications/inbox"],
  });
  
  const markReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return apiRequest("POST", "/api/notifications/read", { messageId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/inbox"] });
    },
  });
  
  const messages = data?.messages || [];
  const unreadCount = messages.filter(m => !m.isRead).length;
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "emergency":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "update":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "emergency":
        return <Badge variant="destructive" className="text-xs">Emergência</Badge>;
      case "update":
        return <Badge variant="secondary" className="text-xs">Atualização</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Geral</Badge>;
    }
  };
  
  const handleOpenNotification = (msg: NotificationMessage) => {
    if (!msg.isRead) {
      markReadMutation.mutate(msg.id);
    }
    if (msg.url) {
      if (msg.url.startsWith("http")) {
        window.open(msg.url, "_blank");
      } else {
        setLocation(msg.url);
      }
    }
  };
  
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notificações
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} não lida{unreadCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="inbox" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inbox" data-testid="tab-inbox">
            <Bell className="h-4 w-4 mr-2" />
            Caixa de Entrada
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-notification-settings">
            <Settings className="h-4 w-4 mr-2" />
            Preferências
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inbox" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhuma notificação</p>
                <p className="text-sm text-muted-foreground">
                  Quando você receber notificações, elas aparecerão aqui
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => (
                <Card
                  key={msg.id}
                  className={`cursor-pointer transition-colors hover-elevate ${
                    !msg.isRead ? "bg-primary/5 border-primary/20" : ""
                  } ${msg.category === "emergency" ? "border-red-500/50" : ""}`}
                  onClick={() => handleOpenNotification(msg)}
                  data-testid={`notification-item-${msg.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getCategoryIcon(msg.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className={`font-medium ${!msg.isRead ? "font-semibold" : ""}`}>
                            {msg.title}
                          </h3>
                          {getCategoryBadge(msg.category)}
                          {msg.segment && (
                            <Badge variant="outline" className="text-xs">
                              {msg.segment}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {msg.body}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>
                            {format(new Date(msg.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          {msg.url && (
                            <span className="flex items-center gap-1 text-primary">
                              <ExternalLink className="h-3 w-3" />
                              Abrir
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {msg.isRead ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="settings">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
