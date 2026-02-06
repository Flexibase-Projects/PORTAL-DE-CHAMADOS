import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Send,
  Inbox,
  Settings,
  BookOpen,
  ChevronLeft,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/useTheme";
import { UserNav } from "./UserNav";

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const navCategories: { label: string; items: NavItem[] }[] = [
  {
    label: "Início",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/" },
    ],
  },
  {
    label: "Chamados",
    items: [
      { title: "Enviar Chamado", icon: Send, path: "/criar-chamado" },
      { title: "Meus Chamados", icon: Inbox, path: "/meus-chamados" },
    ],
  },
  {
    label: "Administração",
    items: [
      { title: "Painel Administrativo", icon: Settings, path: "/painel-administrativo" },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { title: "Base de Conhecimento", icon: BookOpen, path: "/base-conhecimento" },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar } = useSidebar();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      {/* Expandido: [Logo] [Texto] [Seta esquerda]. Retraído: [Logo] [Sep] [Botão expandir] [Sep] */}
      <SidebarHeader className="p-2">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              PC
            </div>
            <Separator className="w-full" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={toggleSidebar}
                  aria-label="Expandir menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expandir menu</TooltipContent>
            </Tooltip>
            <Separator className="w-full" />
          </div>
        ) : (
          <div className="flex flex-row items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              PC
            </div>
            <span className="flex-1 min-w-0 text-sm font-semibold truncate">
              Portal de Chamados
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={toggleSidebar}
                  aria-label="Retrair menu"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Retrair menu</TooltipContent>
            </Tooltip>
          </div>
        )}
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        {navCategories.map((category) => (
          <SidebarGroup key={category.label}>
            {!collapsed && <SidebarGroupLabel>{category.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {category.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => navigate(item.path)}
                        tooltip={item.title}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={theme === "light" ? "Modo escuro" : "Modo claro"}
              onClick={toggleTheme}
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span>Alternar tema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <Separator className="my-1" />
          <SidebarMenuItem>
            <UserNav collapsed={collapsed} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
