import { LayoutDashboard, Users, FileText, Settings, Phone } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Motoristas", url: "/motoristas", icon: Users },
  { title: "Notas", url: "/notas-fiscais", icon: FileText },
  { title: "Contato", url: "/contato", icon: Phone },
  { title: "Config", url: "/configuracoes", icon: Settings },
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t safe-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {items.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg transition-colors text-muted-foreground",
                isActive && "text-primary"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">{item.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
