import { useDrivers } from "@/hooks/use-store";
import { AddDriverDialog } from "@/components/AddDriverDialog";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DriversListPage() {
  const { drivers, add: addDriver } = useDrivers();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Motoristas</h1>
        <AddDriverDialog onAdd={addDriver} />
      </div>
      <div className="space-y-2">
        {drivers.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Nenhum motorista cadastrado.</p>
        ) : (
          drivers.map((d) => (
            <button
              key={d.id}
              onClick={() => navigate(`/motorista/${d.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-card rounded-lg border hover:shadow-md transition-shadow text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{d.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[d.model, d.plate].filter(Boolean).join(" • ") || d.truck || "Sem veículo"}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
