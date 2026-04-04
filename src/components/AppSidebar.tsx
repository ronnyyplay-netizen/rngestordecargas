import { LayoutDashboard, Users, Calculator, Phone, Settings, FileText, Truck } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useDrivers, useSettings } from "@/hooks/use-store";
import { AddDriverDialog } from "@/components/AddDriverDialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { settings } = useSettings();
  const { drivers, add: addDriver } = useDrivers();

  const mainItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    
    { title: "Contato", url: "/contato", icon: Phone },
    { title: "Notas Fiscais", url: "/notas-fiscais", icon: FileText },
    { title: "Configurações", url: "/configuracoes", icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        <div className="px-4 py-5 flex items-center gap-3">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 rounded-md object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Truck className="w-4 h-4 text-primary" />
            </div>
          )}
          {!collapsed && (
            <span className="font-bold text-sm text-sidebar-foreground truncate">
              {settings.companyName}
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="nav-item text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      activeClassName="nav-item-active"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
            Motoristas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {drivers.map((d) => (
                <SidebarMenuItem key={d.id}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`/motorista/${d.id}`}
                      className="nav-item text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      activeClassName="nav-item-active"
                    >
                      <Users className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>{d.name}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {!collapsed && (
                <SidebarMenuItem>
                  <AddDriverDialog onAdd={drivers.length >= 0 ? addDriver : async () => {}} />
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
