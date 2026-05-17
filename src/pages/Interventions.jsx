const db = globalThis.__B44_DB__;

import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Save } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import PatientSelector from "@/components/shared/PatientSelector";
import { toast } from "sonner";

const interventionTypes = [
  { value: "respiratoria", label: "Respiratoria" },
  { value: "motora", label: "Motora" },
  { value: "neurologica", label: "Neurológica" },
  { value: "cardiovascular", label: "Cardiovascular" },
  { value: "musculoesqueletica", label: "Musculoesquelética" },
];

const techniquesByType = {
  respiratoria: [
    "Aspiración de secreciones", "Kinesioterapia torácica", "Incentivo inspiratorio",
    "Reeducación respiratoria", "Drenaje postural", "Presión positiva espiratoria",
    "Manejo ventilatorio", "Aerosolterapia", "Ejercicios respiratorios",
  ],
  motora: [
    "Movilización pasiva", "Movilización activa asistida", "Movilización activa",
    "Sedestación borde cama", "Bipedestación", "Marcha asistida",
    "Transferencias", "Ejercicios isométricos", "Ejercicios isotónicos",
  ],
  neurologica: [
    "Estimulación sensorial", "Facilitación neuromuscular propioceptiva",
    "Ejercicios de equilibrio", "Reeducación de marcha", "Estimulación cognitiva",
    "Control postural", "Técnica de Bobath", "Ejercicios de coordinación",
  ],
  cardiovascular: [
    "Rehabilitación cardíaca", "Ejercicio aeróbico supervisado",
    "Monitorización durante ejercicio", "Protocolo de movilización precoz",
    "Ejercicios de baja intensidad", "Control de respuesta hemodinámica",
  ],
  musculoesqueletica: [
    "Electroterapia", "Crioterapia", "Termoterapia", "Ultrasonido terapéutico",
    "Masoterapia", "Stretching", "Fortalecimiento muscular", "Ejercicios de flexibilidad",
  ],
};

const toleranceOptions = [
  { value: "buena", label: "Buena" },
  { value: "regular", label: "Regular" },
  { value: "mala", label: "Mala" },
];

const initialForm = {
  intervention_type: "", techniques: [], duration_minutes: "",
  patient_tolerance: "", pre_intervention_notes: "",
  post_intervention_notes: "", objectives: "", plan: "", notes: "",
};

export default function Interventions() {
  const [patientId, setPatientId] = useState("");
  const [form, setForm] = useState(initialForm);
  const queryClient = useQueryClient();

  const saveMut = useMutation({
    mutationFn: (data) => db.entities.Intervention.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interventions"] });
      setForm(initialForm);
      toast.success("Intervención registrada");
    },
  });

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleTechnique = (tech) => {
    setForm((prev) => ({
      ...prev,
      techniques: prev.techniques.includes(tech)
        ? prev.techniques.filter((t) => t !== tech)
        : [...prev.techniques, tech],
    }));
  };

  const handleSave = () => {
    if (!patientId) { toast.error("Selecciona un paciente"); return; }
    if (!form.intervention_type) { toast.error("Selecciona tipo de intervención"); return; }
    saveMut.mutate({
      patient_id: patientId,
      intervention_date: new Date().toISOString(),
      ...form,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
    });
  };

  const availableTechniques = techniquesByType[form.intervention_type] || [];

  return (
    <div>
      <PageHeader title="Intervención Kinésica" subtitle="Registro de técnicas y procedimientos aplicados" />

      <div className="max-w-3xl space-y-6">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <PatientSelector value={patientId} onChange={setPatientId} />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <Label>Tipo de Intervención *</Label>
                <Select value={form.intervention_type} onValueChange={(v) => { updateField("intervention_type", v); updateField("techniques", []); }}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {interventionTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Duración (min)</Label>
                <Input type="number" value={form.duration_minutes} onChange={(e) => updateField("duration_minutes", e.target.value)} placeholder="30" />
              </div>
              <div className="space-y-1.5">
                <Label>Tolerancia</Label>
                <Select value={form.patient_tolerance} onValueChange={(v) => updateField("patient_tolerance", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {toleranceOptions.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {availableTechniques.length > 0 && (
              <div>
                <Label className="mb-3 block">Técnicas Aplicadas</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableTechniques.map((tech) => (
                    <label
                      key={tech}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors text-sm"
                    >
                      <Checkbox
                        checked={form.techniques.includes(tech)}
                        onCheckedChange={() => toggleTechnique(tech)}
                      />
                      {tech}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Evaluación</h3>
            <div className="space-y-1.5">
              <Label>Objetivos de la intervención</Label>
              <Textarea value={form.objectives} onChange={(e) => updateField("objectives", e.target.value)} placeholder="Objetivos kinésicos..." />
            </div>
            <div className="space-y-1.5">
              <Label>Estado previo</Label>
              <Textarea value={form.pre_intervention_notes} onChange={(e) => updateField("pre_intervention_notes", e.target.value)} placeholder="Estado del paciente antes de la intervención..." />
            </div>
            <div className="space-y-1.5">
              <Label>Estado posterior</Label>
              <Textarea value={form.post_intervention_notes} onChange={(e) => updateField("post_intervention_notes", e.target.value)} placeholder="Estado del paciente después de la intervención..." />
            </div>
            <div className="space-y-1.5">
              <Label>Plan kinésico</Label>
              <Textarea value={form.plan} onChange={(e) => updateField("plan", e.target.value)} placeholder="Plan de tratamiento a seguir..." />
            </div>
            <div className="space-y-1.5">
              <Label>Observaciones adicionales</Label>
              <Textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Notas..." />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full gap-2" disabled={saveMut.isPending}>
          <Save className="w-4 h-4" />
          {saveMut.isPending ? "Guardando..." : "Registrar Intervención"}
        </Button>
      </div>
    </div>
  );
}