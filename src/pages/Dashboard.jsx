const db = globalThis.__B44_DB__;


import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Activity, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";

const statCards = [
  { label: "Pacientes", icon: Users, path: "/patients", color: "bg-primary/10 text-primary", key: "patients" },
  { label: "Evaluaciones", icon: Activity, path: "/scales", color: "bg-accent/10 text-accent", key: "scales" },
  { label: "Signos Vitales", icon: Heart, path: "/vitals", color: "bg-destructive/10 text-destructive", key: "vitals" },
];

export default function Dashboard() {
  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => db.entities.Patient.list(),
  });
  const { data: scales = [] } = useQuery({
    queryKey: ["scales"],
    queryFn: () => db.entities.ScaleAssessment.list(),
  });
  const { data: vitals = [] } = useQuery({
    queryKey: ["vitals"],
    queryFn: () => db.entities.VitalSigns.list(),
  });
  const counts = {
    patients: patients.length,
    scales: scales.length,
    vitals: vitals.length,
  };

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Resumen general de la actividad clínica" />
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        {statCards.map((card) => (
          <Link key={card.key} to={card.path}>
            <Card className="hover:shadow-lg transition-all duration-300 border-border/50 group cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl ${card.color} flex items-center justify-center`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <span className="text-3xl font-bold text-foreground">{counts[card.key]}</span>
                </div>
                <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {card.label}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Últimas Evaluaciones</h3>
            {scales.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay evaluaciones registradas</p>
            ) : (
              <div className="space-y-3">
                {scales.slice(0, 5).map((s) => {
                  const patient = patients.find(p => p.id === s.patient_id);
                  return (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{patient?.full_name || "Paciente"}</p>
                        <p className="text-xs text-muted-foreground">Score: {s.total_score || 0}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        s.risk_level === "critico" ? "bg-destructive/10 text-destructive" :
                        s.risk_level === "alto" ? "bg-orange-100 text-orange-700" :
                        s.risk_level === "moderado" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {s.care_frequency || 0}x/24h
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Pacientes Recientes</h3>
            {patients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay pacientes registrados</p>
            ) : (
              <div className="space-y-3">
                {patients.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground">{p.diagnosis || "Sin diagnóstico"}</p>
                    </div>
                    {p.bed_number && (
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                        Cama {p.bed_number}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}