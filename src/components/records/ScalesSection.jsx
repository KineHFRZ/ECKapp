const db = globalThis.__B44_DB__;

import { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Activity } from "lucide-react";
import ScaleDimension from "@/components/scales/ScaleDimension";
import ScaleResult, { getResult } from "@/components/scales/ScaleResult";
import ScaleEvolutionChart from "@/components/scales/ScaleEvolutionChart";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const dimensions = [
  {
    key: "consciousness_dimension", label: "Estado de Conciencia",
    description: "Vigilia voluntaria y cumplimiento de órdenes",
    criteria: ["Vigilia voluntaria, lúcido o vigil al llamado", "Sopor superficial, responde de manera confusa", "Sopor medio o agitado o no sigue órdenes", "Sopor profundo o sin conexión al medio"],
  },
  {
    key: "ventilatory_dimension", label: "Carga Ventilatoria",
    description: "Índice Kinésico de la Carga del Trabajo Ventilatorio (IKCTV)",
    criteria: ["IKCTV Leve (0–4)", "IKCTV Leve (5–8)", "IKCTV Moderado (9–16)", "IKCTV Severo (17–24)"],
  },
  {
    key: "devices_dimension", label: "Permeabilización de la Vía Aérea",
    description: "Evaluación de la tos y necesidad de asistencia",
    criteria: ["Tos efectiva, no requiere asistencia de PVA", "Tos débil, requiere asistencia para PVA", "Tos débil, requiere aspiración de secreciones", "Ausencia de tos, requiere aspiración de secreciones"],
  },
  {
    key: "mobility_dimension", label: "Movilidad Funcional",
    description: "Funcionalidad global mediante escala FSS-ICU",
    criteria: ["FSS-ICU 30–35", "FSS-ICU 21–29", "FSS-ICU 11–20", "FSS-ICU ≤10 o NV"],
  },
];

const initialScores = { consciousness_dimension: null, ventilatory_dimension: null, devices_dimension: null, mobility_dimension: null };
const assistanceColors = { leve: "bg-green-100 text-green-700", moderada: "bg-yellow-100 text-yellow-700", severa: "bg-red-100 text-red-700" };
const assistanceLabels = { leve: "Leve", moderada: "Moderada", severa: "Severa" };

export default function ScalesSection({ patientId, scores: externalScores, onScoresChange }) {
  const isControlled = externalScores !== undefined;
  const [internalScores, setInternalScores] = useState(initialScores);
  const scores = isControlled ? externalScores : internalScores;
  const setScores = isControlled ? onScoresChange : setInternalScores;
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const allFilled = Object.values(scores).every((v) => v !== null);
  const totalScore = Object.values(scores).reduce((sum, v) => sum + (v ?? 0), 0);
  const result = getResult(totalScore);

  const { data: assessments = [] } = useQuery({ queryKey: ["scales"], queryFn: () => db.entities.ScaleAssessment.list("-created_date", 20) });
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: () => db.entities.Patient.list() });

  const saveMut = useMutation({
    mutationFn: (data) => db.entities.ScaleAssessment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scales"] });
      setScores(initialScores);
      setNotes("");
      toast.success("Evaluación guardada correctamente");
    },
  });

  const handleSave = () => {
    if (!patientId) { toast.error("Selecciona un paciente"); return; }
    if (!allFilled) { toast.error("Completa todas las dimensiones"); return; }
    saveMut.mutate({ patient_id: patientId, assessment_date: new Date().toISOString(), ...scores, total_score: totalScore, care_frequency: result.frequency, assistance_level: result.level, notes });
  };

  const patientAssessments = patientId ? assessments.filter((a) => a.patient_id === patientId) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pt-2">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Escala ECK</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dimensions.map((dim) => (
          <ScaleDimension key={dim.key} label={dim.label} description={dim.description} criteria={dim.criteria}
            value={scores[dim.key]} onChange={(val) => setScores((prev) => ({ ...prev, [dim.key]: val }))} />
        ))}
      </div>

      {/* Result + frequency table side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScaleResult totalScore={allFilled ? totalScore : 0} />

        <Card className="border-border/50">
          <CardContent className="p-5">
            <h4 className="font-semibold text-sm mb-3">Tabla de Frecuencia</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                <div><span className="font-bold text-green-800">0 – 4 pts</span><p className="text-green-700 mt-0.5">Asistencia Kinésica Leve</p></div>
                <span className="font-black text-green-700 text-right text-xs leading-tight">1 atención<br/>/24 hrs</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div><span className="font-bold text-yellow-800">5 – 8 pts</span><p className="text-yellow-700 mt-0.5">Asistencia Kinésica Moderada</p></div>
                <span className="font-black text-yellow-700 text-right text-xs leading-tight">2 atenciones<br/>/24 hrs</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                <div><span className="font-bold text-red-800">9 – 12 pts</span><p className="text-red-700 mt-0.5">Asistencia Kinésica Severa</p></div>
                <span className="font-black text-red-700 text-right text-xs leading-tight">≥3 atenciones<br/>/24 hrs</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-3">
          <Label>Observaciones</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales de la evaluación..." className="min-h-[80px]" />
          <Button onClick={handleSave} className="w-full gap-2" disabled={saveMut.isPending || !allFilled || !patientId}>
            <Save className="w-4 h-4" />
            {saveMut.isPending ? "Guardando..." : "Guardar Evaluación ECK"}
          </Button>
          {!allFilled && <p className="text-xs text-muted-foreground text-center">Asigna puntaje a todas las dimensiones para guardar</p>}
        </CardContent>
      </Card>

      {patientId && patientAssessments.length >= 2 && (
        <Card className="border-border/50">
          <CardContent className="p-5">
            <h4 className="font-semibold text-sm mb-4">Evolución ECK</h4>
            <ScaleEvolutionChart assessments={assessments} patientId={patientId} />
          </CardContent>
        </Card>
      )}

      {patientAssessments.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-5">
            <h4 className="font-semibold text-sm mb-3">Historial Reciente</h4>
            <div className="space-y-2">
              {patientAssessments.slice(0, 6).map((a) => (
                <div key={a.id} className="flex justify-between items-center p-2.5 rounded-lg bg-muted/50 text-xs gap-2">
                  <p className="text-muted-foreground">{format(new Date(a.assessment_date || a.created_date), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                  <div className="text-right shrink-0">
                    <p className="font-bold">{a.total_score}/12</p>
                    <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${assistanceColors[a.assistance_level] || "bg-muted text-muted-foreground"}`}>
                      {assistanceLabels[a.assistance_level] || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}