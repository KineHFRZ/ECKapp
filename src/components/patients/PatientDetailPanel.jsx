const db = globalThis.__B44_DB__;


import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getResult } from "@/components/scales/ScaleResult";
import { Activity, Heart, User, Calendar, Stethoscope, TrendingUp, TrendingDown, Minus } from "lucide-react";

const assistanceColors = { leve: "bg-green-100 text-green-700", moderada: "bg-yellow-100 text-yellow-700", severa: "bg-red-100 text-red-700" };

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export default function PatientDetailPanel({ patient }) {
  const { data: allScales = [] } = useQuery({
    queryKey: ["scales"],
    queryFn: () => db.entities.ScaleAssessment.list("-created_date", 50),
  });

  const { data: allVitals = [] } = useQuery({
    queryKey: ["vitals"],
    queryFn: () => db.entities.VitalSigns.list("-created_date", 50),
  });

  const scales = allScales
    .filter((s) => s.patient_id === patient.id)
    .sort((a, b) => new Date(b.assessment_date || b.created_date) - new Date(a.assessment_date || a.created_date));

  const vitals = allVitals
    .filter((v) => v.patient_id === patient.id)
    .sort((a, b) => new Date(b.record_date || b.created_date) - new Date(a.record_date || a.created_date));

  const latestScale = scales[0] || null;
  const latestVital = vitals[0] || null;

  const genderLabel = { masculino: "Masculino", femenino: "Femenino", otro: "Otro" };

  return (
    <div className="space-y-4 pt-4 pb-2 px-1">
      {/* Datos del paciente */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm">Datos del Paciente</h4>
        </div>
        <div className="space-y-0">
          <InfoRow label="RUT" value={patient.rut} />
          <InfoRow label="Edad" value={patient.age ? `${patient.age} años` : null} />
          <InfoRow label="Sexo" value={genderLabel[patient.gender]} />
          <InfoRow label="Diagnóstico" value={patient.diagnosis} />
          <InfoRow label="Cama" value={patient.bed_number} />
          <InfoRow label="Servicio" value={patient.service} />
          <InfoRow label="Médico tratante" value={patient.attending_physician} />
          <InfoRow label="Fecha ingreso" value={patient.admission_date ? format(new Date(patient.admission_date), "dd/MM/yyyy") : null} />
        </div>
      </div>

      {/* Última ECK */}
      {latestScale && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm">Última Escala ECK</h4>
            <span className="text-xs text-muted-foreground ml-auto">
              {format(new Date(latestScale.assessment_date || latestScale.created_date), "dd/MM/yyyy HH:mm", { locale: es })}
            </span>
          </div>
          <Card className="border-border/40 bg-muted/30">
            <CardContent className="p-4 space-y-2">
              {[
                { key: "consciousness_dimension", label: "Estado de Conciencia" },
                { key: "ventilatory_dimension", label: "Carga Ventilatoria" },
                { key: "devices_dimension", label: "Dispositivos y Drenajes" },
                { key: "mobility_dimension", label: "Movilidad Funcional" },
              ].map(({ key, label }) => {
                const raw = latestScale[key];
                const val = raw != null && raw !== "" ? Number(raw) : null;
                const color = val === 0 ? "bg-green-500" : val === 1 ? "bg-yellow-500" : val === 2 ? "bg-orange-500" : val === 3 ? "bg-red-600" : "bg-muted";
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-white text-[10px] ${color}`}>{val != null ? val : "—"}/3</span>
                  </div>
                );
              })}
              <div className="border-t border-border/50 pt-2 flex items-center justify-between">
                <span className="text-xs font-semibold">Puntaje Total</span>
                <div className="text-right">
                  <span className="text-sm font-black">{latestScale.total_score}/12</span>
                  <p className="text-[10px] text-muted-foreground">{getResult(latestScale.total_score).label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Últimos signos vitales */}
      {latestVital && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm">Últimos Signos Vitales</h4>
            <span className="text-xs text-muted-foreground ml-auto">
              {format(new Date(latestVital.record_date || latestVital.created_date), "dd/MM/yyyy HH:mm", { locale: es })}
            </span>
          </div>
          <Card className="border-border/40 bg-muted/30">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {latestVital.heart_rate && <div className="flex justify-between"><span className="text-muted-foreground">FC</span><span className="font-semibold">{latestVital.heart_rate} lpm</span></div>}
                {latestVital.systolic_bp && <div className="flex justify-between"><span className="text-muted-foreground">PA</span><span className="font-semibold">{latestVital.systolic_bp}/{latestVital.diastolic_bp} mmHg</span></div>}
                {latestVital.spo2 && <div className="flex justify-between"><span className="text-muted-foreground">SpO₂</span><span className="font-semibold">{latestVital.spo2}%</span></div>}
                {latestVital.respiratory_rate && <div className="flex justify-between"><span className="text-muted-foreground">FR</span><span className="font-semibold">{latestVital.respiratory_rate} rpm</span></div>}
                {latestVital.temperature && <div className="flex justify-between"><span className="text-muted-foreground">T°</span><span className="font-semibold">{latestVital.temperature}°C</span></div>}
                {latestVital.pain_scale != null && <div className="flex justify-between"><span className="text-muted-foreground">EVA</span><span className="font-semibold">{latestVital.pain_scale}/10</span></div>}
              </div>
              {latestVital.techniques?.length > 0 && (
                <div className="mt-3 pt-2 border-t border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Intervenciones</p>
                  <p className="text-xs">{latestVital.techniques.join(", ")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Historial ECK */}
      {scales.length > 1 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm">Historial ECK</h4>
          </div>
          <div className="space-y-1.5">
            {scales.slice(0, 5).map((s, idx) => {
              const prev = scales[idx + 1];
              const diff = prev ? s.total_score - prev.total_score : null;
              return (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 text-xs gap-2">
                  <p className="text-muted-foreground">{format(new Date(s.assessment_date || s.created_date), "dd/MM HH:mm", { locale: es })}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {diff !== null && (
                      <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${diff > 0 ? "text-red-500" : diff < 0 ? "text-green-600" : "text-muted-foreground"}`}>
                        {diff > 0 ? <TrendingUp className="w-3 h-3" /> : diff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    )}
                    <span className="font-black">{s.total_score}/12</span>
                    <span className={`px-1.5 py-0.5 rounded-full font-semibold text-[10px] ${assistanceColors[s.assistance_level] || "bg-muted text-muted-foreground"}`}>
                      {s.assistance_level || "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {scales.length === 0 && vitals.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Sin registros clínicos para este paciente</p>
      )}
    </div>
  );
}