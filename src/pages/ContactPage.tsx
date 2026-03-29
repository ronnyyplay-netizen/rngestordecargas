import { useDrivers, useSettings } from "@/hooks/use-store";
import { MessageCircle, Truck, Phone } from "lucide-react";

export default function ContactPage() {
  const { drivers } = useDrivers();
  const { settings } = useSettings();

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold">Contato</h1>
        <p className="text-muted-foreground text-sm mt-1">Entre em contato com os motoristas da {settings.companyName}</p>
      </div>

      <div className="space-y-4">
        {drivers.map((d, i) => (
          <div
            key={d.id}
            className="stat-card flex items-center justify-between animate-fade-in-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{d.name}</p>
                <p className="text-sm text-muted-foreground">{d.truck}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" /> {d.phone}
                </p>
              </div>
            </div>
            <a
              href={`https://wa.me/${d.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-success text-success-foreground rounded-lg font-medium text-sm hover:bg-success/90 transition-colors active:scale-97"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
