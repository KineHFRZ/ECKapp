import { db } from "@/api/base44Client";

import { useState, useMemo, useEffect } from "react";

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Heart, Wind, Droplets, Brain, Activity, Stethoscope, Copy, Check, ClipboardList, FileText } from "lucide-react";
import { getResult } from "@/components/scales/ScaleResult";
import ScaleDimension from "@/components/scales/ScaleDimension";
import { generateClinicalRecord } from "@/lib/clinicalRecord";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const oxygenOptions = [
  { value: "ambiente", label: "Aire ambiente" },
  { value: "cnaf", label: "CNAF" },
  { value: "mascarilla_reservorio", label: "Mascarilla con reservorio" },
  { value: "venturi", label: "Mascarilla Multivent" },
  { value: "mascarilla_simple", label: "Mascarilla simple" },
  { value: "naricera", label: "Naricera" },
  { value: "tqt_hme", label: "TQT/HME" },
  { value: "vmni", label: "VMNI" },
  { value: "vmi", label: "VMI" },
];

const ruidoPulmonarOptions = ["Presente", "Disminuido", "Abolido"];
const locationsList = ["biapical", "bibasal", "ápice derecho", "ápice izquierdo", "base derecha", "base izquierda", "hemicampo derecho", "hemicampo izquierdo", "bilateral", "posterobasal derecho", "posterobasal izquierdo"];
const ruidosAgregadosOptions = ["Crepitos", "Estertor", "Roncus", "Sibilancias", "Ruido Respiratorio Bronquial", "Sin Ruidos Agregados"];

const movilidadOptions = [
  "Evaluación Kinésica",
  "Movilidad Pasiva",
  "Flexibilización",
  "Movilidad Activa asistida",
  "Movilidad Activa",
  "Fortalecimiento Muscular",
  "Ejercicios de equilibrio estático",
  "Ejercicios de equilibrio dinámico",
  "Sedente Borde Cama",
  "Bipedo",
  "Marcha",
];

const respiratoriaOptions = [
  "Técnicas Kinésicas de Reexpansión Pulmonar",
  "Técnicas Kinésicas de Drenaje Bronquial",
  "Asistencia técnica con dispositivos para expansión pulmonar",
  "Asistencia técnica con dispositivos para permeabilizar vía aérea",
  "Tos provocada",
  "Tos asistida",
  "Tos dirigida",
  "Aspiración de secreciones",
  "Succión subglótica",
  "Inflado de Cuff",
];

const quickObservations = [
  "Paciente colaborador, buena tolerancia a la sesión",
  "Paciente con dolor controlado durante la sesión",
  "Paciente con fatiga, se realizan pausas durante la sesión",
  "Paciente requirió mayor apoyo ventilatorio durante la sesión",
  "Se evidencia mejoría en tolerancia al ejercicio",
  "Se realiza educación al paciente y/o familia",
  "Se requirió aspiración de secreciones durante la sesión",
  "Sin cambios significativos respecto a sesión anterior",
];

const initialForm = {
  heart_rate: "", systolic_bp: "", diastolic_bp: "", spo2: "",
  respiratory_rate: "", temperature: "", fio2: "", oxygen_support: "",
  pain_scale: "", notes: "", cnaf_flow: "", ventilatory_mode: "",
  apreciacion_inicial: "", sopor_level: "", colaboracion: "", apremio_ventilatorio: "",
  mecanismo_tos: "", caracteristicas_tos: "",
  evaluacion_estado_general: "", posicion_cama: "",
  ruido_pulmonar: "", ruido_pulmonar_zona: "", ruidos_agregados: "",
  ruido_pulmonar_loc: "", ruidos_agregados_loc: "{}",
  irox: "", pam: "", ikctv: "", flujo_naricera: "",   observaciones_vent: "", observaciones_ausc: "",
  fuerza_muscular: "", fuerza_muscular_loc: "", rom: "", rom_loc: "", pto: "", asistencia_transiciones: "", secreciones: "",
  sedente_comentario: "", bipedo_comentario: "", marcha_comentario: "",
  tos_provocada_comentario: "", tos_asistida_comentario: "", tos_dirigida_comentario: "",
  fss_icu: "", fss_icu_no_valorable: false,
  fss_giro: "", fss_supino_sedente: "", fss_sedente_borde_cama: "", fss_bipedo: "", fss_marcha: "",
  tolerancia: "", porcentaje_fc_rut: "", disnea: "", ssf: "",
  tono_muscular: "", sensibilidad: "", observaciones_neurologicas: "",
  distancia_recorrido: "", tipo_aspiracion: "", cantidad_aspiracion: "", aspiracion_comentario: "",   observacion_inicial: "", observacion_final: "",
  fc_final: "", fr_final: "", spo2_final: "", fio2_final: "", flujo_o2_final: "",
  oxygen_support_final: "", cnaf_flow_final: "", irox_final: "",
};

function VitalField({ icon: Icon, label, children, color }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        {label}
      </Label>
      {children}
    </div>
  );
}

const eckDimensions = [
  { key: "consciousness_dimension", label: "Estado de Conciencia", description: "Vigilia voluntaria y cumplimiento de órdenes", criteria: ["Vigilia voluntaria, lúcido o vigil al llamado", "Sopor superficial, responde de manera confusa", "Sopor medio o agitado o no sigue órdenes", "Sopor profundo o sin conexión al medio"] },
  { key: "ventilatory_dimension", label: "Carga Ventilatoria", description: "Índice Kinésico de la Carga del Trabajo Ventilatorio (IKCTV)", criteria: ["IKCTV Leve (0–4)", "IKCTV Leve (5–8)", "IKCTV Moderado (9–16)", "IKCTV Severo (17–24)"] },
  { key: "devices_dimension", label: "Permeabilización de la Vía Aérea", description: "Evaluación de la tos y necesidad de asistencia", criteria: ["Tos efectiva, no requiere asistencia de PVA", "Tos débil, requiere asistencia para PVA", "Tos débil, requiere aspiración de secreciones", "Ausencia de tos, requiere aspiración de secreciones"] },
  { key: "mobility_dimension", label: "Movilidad Funcional", description: "Funcionalidad global mediante escala FSS-ICU", criteria: ["FSS-ICU 30–35", "FSS-ICU 21–29", "FSS-ICU 11–20", "FSS-ICU ≤10 o NV"] },
];

export default function VitalSignsSection({ patientId, eckScores, onEckScoresChange }) {
  const [form, setForm] = useState(initialForm);
  const [techniques, setTechniques] = useState([]);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: () => db.entities.Patient.list() });
  const { data: allScales = [] } = useQuery({ queryKey: ["scales"], queryFn: () => db.entities.ScaleAssessment.list("-created_date", 50) });

  const patient = patients.find((p) => p.id === patientId) || null;
  const patientScales = patientId
    ? allScales.filter((s) => s.patient_id === patientId).sort((a, b) => new Date(b.assessment_date || b.created_date) - new Date(a.assessment_date || a.created_date))
    : [];
  const latestScale = patientScales[0] || null;

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const toggleTechnique = (tech) => setTechniques((prev) => prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]);

  const iroxValue = useMemo(() => {
    if (form.oxygen_support !== "cnaf") return "";
    const spo2 = parseFloat(form.spo2);
    const fio2 = parseFloat(form.fio2);
    const fr = parseFloat(form.respiratory_rate);
    if (!spo2 || !fio2 || !fr || fio2 <= 0 || fr <= 0) return "";
    return ((spo2 / (fio2 / 100)) / fr).toFixed(2);
  }, [form.spo2, form.fio2, form.respiratory_rate, form.oxygen_support]);

  useEffect(() => {
    if (form.oxygen_support === "cnaf" && iroxValue) {
      setForm((prev) => ({ ...prev, irox: iroxValue }));
    } else if (form.oxygen_support !== "cnaf") {
      setForm((prev) => ({ ...prev, irox: "" }));
    }
  }, [iroxValue, form.oxygen_support]);

  const iroxFinalValue = useMemo(() => {
    if (form.oxygen_support_final !== "cnaf") return "";
    const spo2 = parseFloat(form.spo2_final);
    const fio2 = parseFloat(form.fio2_final);
    const fr = parseFloat(form.fr_final);
    if (!spo2 || !fio2 || !fr || fio2 <= 0 || fr <= 0) return "";
    return ((spo2 / (fio2 / 100)) / fr).toFixed(2);
  }, [form.spo2_final, form.fio2_final, form.fr_final, form.oxygen_support_final]);

  useEffect(() => {
    if (form.oxygen_support_final === "cnaf" && iroxFinalValue) {
      setForm((prev) => ({ ...prev, irox_final: iroxFinalValue }));
    } else if (form.oxygen_support_final !== "cnaf") {
      setForm((prev) => ({ ...prev, irox_final: "" }));
    }
  }, [iroxFinalValue, form.oxygen_support_final]);

  const pamValue = useMemo(() => {
    const sys = parseFloat(form.systolic_bp);
    const dia = parseFloat(form.diastolic_bp);
    if (!sys || !dia) return "";
    return ((sys + 2 * dia) / 3).toFixed(0);
  }, [form.systolic_bp, form.diastolic_bp]);

  useEffect(() => {
    if (pamValue) {
      setForm((prev) => ({ ...prev, pam: pamValue }));
    } else {
      setForm((prev) => ({ ...prev, pam: "" }));
    }
  }, [pamValue]);

  const saveMut = useMutation({
    mutationFn: (data) => db.entities.VitalSigns.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vitals"] });
      setForm(initialForm);
      setTechniques([]);
      toast.success("Signos vitales registrados");
    },
    onError: (err) => {
      console.error("[VitalSignsSection] Error guardando:", err)
      toast.error("Error al guardar: " + (err?.message || JSON.stringify(err)))
    },
  });

  const handleSave = () => {
    if (!patientId) { toast.error("Selecciona un paciente"); return; }
    const numFields = ["heart_rate", "systolic_bp", "diastolic_bp", "spo2", "respiratory_rate", "temperature", "fio2", "pain_scale", "cnaf_flow", "irox", "pam", "ikctv", "fss_icu", "gcs", "sas", "s5q", "porcentaje_fc_rut", "disnea", "ssf", "fc_final", "fr_final", "spo2_final", "fio2_final", "flujo_o2_final", "fss_giro", "fss_supino_sedente", "fss_sedente_borde_cama", "fss_bipedo", "fss_marcha", "cnaf_flow_final", "irox_final"];
    const stringFields = ["apreciacion_inicial", "sopor_level", "colaboracion", "apremio_ventilatorio", "mecanismo_tos", "caracteristicas_tos", "secreciones", "evaluacion_estado_general", "posicion_cama", "ruido_pulmonar", "ruido_pulmonar_zona", "ruidos_agregados", "ruido_pulmonar_loc", "ruidos_agregados_loc", "fuerza_muscular", "fuerza_muscular_loc", "rom", "rom_loc", "pto", "asistencia_transiciones", "distancia_recorrido", "tipo_aspiracion", "cantidad_aspiracion", "aspiracion_comentario", "observacion_inicial", "observacion_final", "tolerancia", "tono_muscular", "sensibilidad", "observaciones_neurologicas", "observaciones_vent", "observaciones_ausc", "sedente_comentario", "bipedo_comentario", "marcha_comentario", "tos_provocada_comentario", "tos_asistida_comentario", "tos_dirigida_comentario"];
    const parsed = { patient_id: patientId, record_date: new Date().toISOString() };
    numFields.forEach((f) => { if (form[f]) parsed[f] = Number(form[f]); });
    stringFields.forEach((f) => { if (form[f]) parsed[f] = form[f]; });
    if (form.oxygen_support) parsed.oxygen_support = form.oxygen_support;
    if (form.notes) parsed.notes = form.notes;
    if (techniques.length > 0) parsed.techniques = techniques;
    saveMut.mutate(parsed);
  };

  const clinicalRecord = useMemo(() =>
    generateClinicalRecord({ patient, form, techniques, eckScores, latestScale, now: new Date() }),
    [patient, form, techniques, eckScores, latestScale]
  );

  const saveEckMut = useMutation({
    mutationFn: (data) => db.entities.ScaleAssessment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scales"] });
      toast.success("Evaluación ECK guardada");
    },
    onError: (err) => {
      console.error("[VitalSignsSection] Error guardando ECK:", err)
      toast.error("Error al guardar ECK: " + (err?.message || JSON.stringify(err)))
    },
  });

  const handleSaveEck = () => {
    if (!patientId) { toast.error("Selecciona un paciente"); return; }
    const allFilled = Object.values(eckScores).every((v) => v !== null);
    if (!allFilled) { toast.error("Completa todas las dimensiones ECK"); return; }
    const totalScore = Object.values(eckScores).reduce((s, v) => s + (v ?? 0), 0);
    const result = getResult(totalScore);
    saveEckMut.mutate({
      patient_id: patientId,
      assessment_date: new Date().toISOString(),
      ...eckScores,
      total_score: totalScore,
      care_frequency: result.frequency,
      assistance_level: result.level,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(clinicalRecord);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Registro copiado al portapapeles");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pt-2">
        <Heart className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Signos Vitales e Intervenciones</h2>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-5 text-foreground">Inspección General</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <VitalField icon={Brain} label="Apreciación Inicial" color="text-purple-500">
              <Select value={form.apreciacion_inicial} onValueChange={(v) => { updateField("apreciacion_inicial", v); if (v !== "Sopor") updateField("sopor_level", ""); }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vigil">Vigil</SelectItem>
                  <SelectItem value="Somnoliento(a)">Somnoliento(a)</SelectItem>
                  <SelectItem value="Sopor">Sopor</SelectItem>
                  <SelectItem value="Agitado(a)">Agitado(a)</SelectItem>
                  <SelectItem value="Comatoso(a)">Comatoso(a)</SelectItem>
                </SelectContent>
              </Select>
              {form.apreciacion_inicial === "Sopor" && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Nivel:</span>
                  {["superficial", "medio", "profundo"].map((n) => (
                    <button key={n} type="button"
                      onClick={() => updateField("sopor_level", n)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border ${form.sopor_level === n ? "bg-primary text-white border-primary" : "bg-muted text-muted-foreground border-transparent hover:border-primary/40"}`}
                    >{n}</button>
                  ))}
                </div>
              )}
            </VitalField>
            <VitalField icon={Brain} label="Colaboración" color="text-purple-500">
              <Select value={form.colaboracion} onValueChange={(v) => updateField("colaboracion", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tranquilo(a)">tranquilo(a)</SelectItem>
                  <SelectItem value="colaborador(a)">colaborador(a)</SelectItem>
                  <SelectItem value="colaborador(a) parcial">colaborador(a) parcial</SelectItem>
                  <SelectItem value="no colaborador(a)">no colaborador(a)</SelectItem>
                  <SelectItem value="contenido(a)">contenido(a)</SelectItem>
                  <SelectItem value="agitado(a)">agitado(a)</SelectItem>
                </SelectContent>
              </Select>
            </VitalField>
            <VitalField icon={Brain} label="Apremio Ventilatorio" color="text-purple-500">
              <Select value={form.apremio_ventilatorio} onValueChange={(v) => updateField("apremio_ventilatorio", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Con apremio ventilatorio">Con apremio ventilatorio</SelectItem>
                  <SelectItem value="Sin apremio ventilatorio">Sin apremio ventilatorio</SelectItem>
                </SelectContent>
              </Select>
            </VitalField>
            <VitalField icon={Activity} label="EVA Dolor (0-10)" color="text-amber-500">
              <Input type="number" min="0" max="10" value={form.pain_scale} onChange={(e) => updateField("pain_scale", e.target.value)} placeholder="0-10" />
            </VitalField>
            <VitalField icon={Brain} label="GCS (3-15)" color="text-purple-500">
              <Input type="number" min="3" max="15" value={form.gcs} onChange={(e) => updateField("gcs", e.target.value)} placeholder="15" />
            </VitalField>
            <VitalField icon={Brain} label="SAS (1-7)" color="text-purple-500">
              <Input type="number" min="1" max="7" value={form.sas} onChange={(e) => updateField("sas", e.target.value)} placeholder="4" />
            </VitalField>
            <VitalField icon={Brain} label="S5Q" color="text-purple-500">
              <div className="flex items-center gap-1">
                <Input type="number" min="0" max="5" value={form.s5q} onChange={(e) => updateField("s5q", e.target.value)} placeholder="0" className="w-20" />
                <span className="text-sm text-muted-foreground">/5</span>
              </div>
            </VitalField>
          </div>
          <div className="mt-4 pt-4 border-t border-border/50 space-y-1.5">
            <Label>Observación Inicial</Label>
            <Textarea value={form.observacion_inicial} onChange={(e) => updateField("observacion_inicial", e.target.value)} placeholder="Observación inicial..." className="min-h-[60px]" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-5 text-foreground">Hemodinámicos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <VitalField icon={Heart} label="FC (lpm)" color="text-red-500">
              <Input type="number" value={form.heart_rate} onChange={(e) => updateField("heart_rate", e.target.value)} placeholder="60-100" />
            </VitalField>
            <VitalField icon={Activity} label="PA Sistólica (mmHg)" color="text-blue-500">
              <Input type="number" value={form.systolic_bp} onChange={(e) => updateField("systolic_bp", e.target.value)} placeholder="120" />
            </VitalField>
            <VitalField icon={Activity} label="PA Diastólica (mmHg)" color="text-blue-500">
              <Input type="number" value={form.diastolic_bp} onChange={(e) => updateField("diastolic_bp", e.target.value)} placeholder="80" />
            </VitalField>
            {form.systolic_bp && form.diastolic_bp && (
              <VitalField icon={Activity} label="PAM (mmHg)" color="text-blue-500">
                <Input type="text" value={form.pam || ""} readOnly className="bg-muted" placeholder="Calculado" />
              </VitalField>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-5 text-foreground">Respiratorios</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <VitalField icon={Wind} label="FR (rpm)" color="text-teal-500">
              <Input type="number" value={form.respiratory_rate} onChange={(e) => updateField("respiratory_rate", e.target.value)} placeholder="12-20" />
            </VitalField>
            <VitalField icon={Droplets} label="SpO₂ (%)" color="text-sky-500">
              <Input type="number" value={form.spo2} onChange={(e) => updateField("spo2", e.target.value)} placeholder="95-100" />
            </VitalField>
            <VitalField icon={Wind} label="FiO₂ (%)" color="text-teal-500">
              <Input type="number" value={form.fio2} onChange={(e) => updateField("fio2", e.target.value)} placeholder="21" />
            </VitalField>
            <VitalField icon={Wind} label="Soporte O₂" color="text-teal-500">
              <Select value={form.oxygen_support} onValueChange={(v) => updateField("oxygen_support", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {oxygenOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </VitalField>
                <VitalField icon={Wind} label="Flujo O2 (lpm)" color="text-teal-500">
              <Input type="number" value={form.flujo_naricera} onChange={(e) => updateField("flujo_naricera", e.target.value)} placeholder="Ej: 3" />
            </VitalField>
            <VitalField icon={Wind} label="Flujo CNAF (lpm)" color="text-teal-500">
              <Input type="number" value={form.cnaf_flow} onChange={(e) => updateField("cnaf_flow", e.target.value)} placeholder="Ej: 40" />
            </VitalField>
            <VitalField icon={Wind} label="Modo Ventilatorio" color="text-teal-500">
              <Select value={form.ventilatory_mode} onValueChange={(v) => updateField("ventilatory_mode", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpap">CPAP</SelectItem>
                  <SelectItem value="binivelado">Binivelado</SelectItem>
                </SelectContent>
              </Select>
            </VitalField>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" /> Auscultación Pulmonar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <VitalField icon={Stethoscope} label="Ruido Pulmonar" color="text-primary">
              <Select value={form.ruido_pulmonar} onValueChange={(v) => { updateField("ruido_pulmonar", v); if (v !== "Disminuido") updateField("ruido_pulmonar_loc", ""); }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {ruidoPulmonarOptions.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
              {form.ruido_pulmonar === "Disminuido" && (
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] text-muted-foreground block">Locaciones:</span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    {locationsList.map((loc) => {
                      const arr = (form.ruido_pulmonar_loc || "").split(",").filter(Boolean);
                      const checked = arr.includes(loc);
                      return (
                        <label key={loc} className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                          <input type="checkbox" checked={checked} onChange={() => {
                            const next = checked ? arr.filter((x) => x !== loc) : [...arr, loc];
                            updateField("ruido_pulmonar_loc", next.join(","));
                          }} className="accent-primary" />
                          {loc}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </VitalField>
            <VitalField icon={Stethoscope} label="Ruidos Agregados" color="text-primary">
              {ruidosAgregadosOptions.map((opt) => {
                const raArr = (form.ruidos_agregados || "").split(",").filter(Boolean);
                const selected = raArr.includes(opt);
                const locMap = JSON.parse(form.ruidos_agregados_loc || "{}");
                return (
                  <div key={opt} className="mb-1.5">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input type="checkbox" checked={selected} onChange={() => {
                        const next = selected ? raArr.filter((x) => x !== opt) : [...raArr, opt];
                        if (opt === "Sin Ruidos Agregados" && !selected) {
                          updateField("ruidos_agregados", "Sin Ruidos Agregados");
                          updateField("ruidos_agregados_loc", "{}");
                        } else {
                          const filtered = next.filter((x) => x !== "Sin Ruidos Agregados");
                          updateField("ruidos_agregados", filtered.join(","));
                          if (!selected) {
                            const newLoc = { ...locMap, [opt]: "" };
                            updateField("ruidos_agregados_loc", JSON.stringify(newLoc));
                          } else {
                            const { [opt]: _, ...rest } = locMap;
                            updateField("ruidos_agregados_loc", JSON.stringify(rest));
                          }
                        }
                      }} className="accent-primary" />
                      {opt}
                    </label>
                    {selected && opt !== "Sin Ruidos Agregados" && opt !== "Estertor" && (
                      <div className="ml-4 mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
                        {locationsList.map((loc) => {
                          const locArr = (locMap[opt] || "").split(",").filter(Boolean);
                          const locChecked = locArr.includes(loc);
                          return (
                            <label key={loc} className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                              <input type="checkbox" checked={locChecked} onChange={() => {
                                const newLocArr = locChecked ? locArr.filter((x) => x !== loc) : [...locArr, loc];
                                const newLocMap = { ...locMap, [opt]: newLocArr.join(",") };
                                updateField("ruidos_agregados_loc", JSON.stringify(newLocMap));
                              }} className="accent-primary" />
                              {loc}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </VitalField>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-medium">
                <Stethoscope className="w-3.5 h-3.5 text-primary" /> Observaciones
              </Label>
              <Textarea value={form.observaciones_ausc} onChange={(e) => updateField("observaciones_ausc", e.target.value)} placeholder="Observaciones auscultación..." className="min-h-[80px]" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-border/50">
            <VitalField icon={Stethoscope} label="Mecanismo de Tos" color="text-primary">
              <Select value={form.mecanismo_tos} onValueChange={(v) => updateField("mecanismo_tos", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alterada en fase compresiva">Alterada en fase compresiva</SelectItem>
                  <SelectItem value="Alterada en fase expulsiva">Alterada en fase expulsiva</SelectItem>
                  <SelectItem value="Alterada en fase inspiratoria">Alterada en fase inspiratoria</SelectItem>
                  <SelectItem value="Efectiva">Efectiva</SelectItem>
                  <SelectItem value="No evaluable">No evaluable</SelectItem>
                </SelectContent>
              </Select>
            </VitalField>
            <VitalField icon={Stethoscope} label="Características de la Tos" color="text-primary">
              <Select value={form.caracteristicas_tos} onValueChange={(v) => updateField("caracteristicas_tos", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="No productiva">No productiva</SelectItem>
                  <SelectItem value="Productiva">Productiva</SelectItem>
                </SelectContent>
              </Select>
            </VitalField>
          </div>
          <div className="mt-4 pt-4 border-t border-border/50 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Observaciones</Label>
            <Textarea value={form.observaciones_vent} onChange={(e) => updateField("observaciones_vent", e.target.value)} placeholder="Observaciones respiratorias..." className="min-h-[60px]" />
          </div>
          <div className="mt-4 pt-4 border-t border-border/50">
            <VitalField icon={Wind} label="IKCTV" color="text-teal-500">
              <Input type="number" value={form.ikctv} onChange={(e) => updateField("ikctv", e.target.value)} placeholder="0-24" />
            </VitalField>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Evaluación Funcional
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <VitalField icon={Activity} label="Fuerza muscular" color="text-primary">
               <Select value={form.fuerza_muscular} onValueChange={(v) => { updateField("fuerza_muscular", v); if (v !== "Alterada") updateField("fuerza_muscular_loc", ""); }}>
                 <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="Conservada">Conservada</SelectItem>
                   <SelectItem value="Alterada">Alterada</SelectItem>
                   <SelectItem value="No Evaluable">No Evaluable</SelectItem>
                     </SelectContent>
                   </Select>
                   {form.fuerza_muscular === "Alterada" && (
                     <div className="mt-2 space-y-1">
                       <span className="text-[10px] text-muted-foreground block">Extremidades:</span>
                       <div className="grid grid-cols-1 gap-x-2 gap-y-0.5">
                         {["extremidad superior derecha", "extremidad superior izquierda", "extremidad inferior derecha", "extremidad inferior izquierda"].map((loc) => {
                           const arr = (form.fuerza_muscular_loc || "").split(",").filter(Boolean);
                           const checked = arr.includes(loc);
                           return (
                             <label key={loc} className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                               <input type="checkbox" checked={checked} onChange={() => {
                                 const next = checked ? arr.filter((x) => x !== loc) : [...arr, loc];
                                 updateField("fuerza_muscular_loc", next.join(","));
                               }} className="accent-primary" />
                               {loc}
                             </label>
                           );
                         })}
                       </div>
                     </div>
                   )}
                 </VitalField>
                 <VitalField icon={Activity} label="ROM" color="text-primary">
                   <Select value={form.rom} onValueChange={(v) => { updateField("rom", v); if (v !== "Alterado") updateField("rom_loc", ""); }}>
                     <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                     <SelectContent>
                   <SelectItem value="Conservado">Conservado</SelectItem>
                   <SelectItem value="Alterado">Alterado</SelectItem>
                   <SelectItem value="No Evaluable">No Evaluable</SelectItem>
                     </SelectContent>
                   </Select>
                   {form.rom === "Alterado" && (
                     <div className="mt-2 space-y-1">
                       <span className="text-[10px] text-muted-foreground block">Extremidades:</span>
                       <div className="grid grid-cols-1 gap-x-2 gap-y-0.5">
                         {["extremidad superior derecha", "extremidad superior izquierda", "extremidad inferior derecha", "extremidad inferior izquierda"].map((loc) => {
                           const arr = (form.rom_loc || "").split(",").filter(Boolean);
                           const checked = arr.includes(loc);
                           return (
                             <label key={loc} className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                               <input type="checkbox" checked={checked} onChange={() => {
                                 const next = checked ? arr.filter((x) => x !== loc) : [...arr, loc];
                                 updateField("rom_loc", next.join(","));
                               }} className="accent-primary" />
                               {loc}
                             </label>
                           );
                         })}
                       </div>
                     </div>
                   )}
                 </VitalField>
                 <VitalField icon={Brain} label="Tono muscular" color="text-purple-500">
               <Input type="text" value={form.tono_muscular} onChange={(e) => updateField("tono_muscular", e.target.value)} placeholder="Ej: Normal, Hipertónico, Hipotónico..." />
            </VitalField>
            <VitalField icon={Brain} label="Sensibilidad" color="text-purple-500">
              <Select value={form.sensibilidad} onValueChange={(v) => updateField("sensibilidad", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alterada">Alterada</SelectItem>
                  <SelectItem value="Ausente">Ausente</SelectItem>
                  <SelectItem value="Conservada">Conservada</SelectItem>
                  <SelectItem value="No evaluable">No evaluable</SelectItem>
                </SelectContent>
              </Select>
            </VitalField>
            <div className="md:col-span-2">
              <VitalField icon={FileText} label="Observaciones" color="text-purple-500">
                <Textarea value={form.observaciones_neurologicas} onChange={(e) => updateField("observaciones_neurologicas", e.target.value)} placeholder="Observaciones neurológicas..." className="min-h-[60px]" />
             </VitalField>
           </div>
            </div>
         </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-1 text-foreground flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" /> Intervenciones Kinésicas
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Selecciona todas las que apliquen</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-wide">Movilidad Funcional</p>
              <div className="space-y-2">
                {movilidadOptions.map((tech) => (
                  <div key={tech}>
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/40 cursor-pointer transition-colors">
                      <input type="checkbox" checked={techniques.includes(tech)} onChange={() => toggleTechnique(tech)} className="mt-0.5 accent-primary" />
                      <span className="text-sm leading-snug">{tech}</span>
                    </label>
                    {tech === "Sedente Borde Cama" && techniques.includes("Sedente Borde Cama") && (
                      <div className="ml-8 mb-3 space-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">PTO</Label>
                          <Select value={form.pto} onValueChange={(v) => updateField("pto", v)}>
                            <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Negativa">Negativa</SelectItem>
                              <SelectItem value="Positiva">Positiva</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Comentarios</Label>
                          <Input type="text" value={form.sedente_comentario} onChange={(e) => updateField("sedente_comentario", e.target.value)} placeholder="Alineación, control, nivel de asistencia..." className="w-full text-sm" />
                        </div>
                      </div>
                    )}
                    {tech === "Bipedo" && techniques.includes("Bipedo") && (
                      <div className="ml-8 mb-3 space-y-1">
                        <Label className="text-xs text-muted-foreground">Comentarios</Label>
                        <Input type="text" value={form.bipedo_comentario} onChange={(e) => updateField("bipedo_comentario", e.target.value)} placeholder="Comentarios..." className="w-full text-sm" />
                      </div>
                    )}
                    {tech === "Marcha" && techniques.includes("Marcha") && (
                      <div className="ml-8 mb-3 space-y-1">
                        <Label className="text-xs text-muted-foreground">Comentarios</Label>
                        <Input type="text" value={form.marcha_comentario} onChange={(e) => updateField("marcha_comentario", e.target.value)} placeholder="Distancia, asistencia..." className="w-full text-sm" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-teal-600 mb-3 uppercase tracking-wide">Terapia Respiratoria</p>
              <div className="space-y-2">
                {respiratoriaOptions.map((tech) => (
                  <div key={tech}>
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/40 cursor-pointer transition-colors">
                      <input type="checkbox" checked={techniques.includes(tech)} onChange={() => toggleTechnique(tech)} className="mt-0.5 accent-primary" />
                      <span className="text-sm leading-snug">{tech}</span>
                    </label>
                    {["Tos provocada", "Tos asistida", "Tos dirigida"].includes(tech) && techniques.includes(tech) && (
                      <div className="ml-8 mb-3 space-y-1">
                        <Label className="text-xs text-muted-foreground">Comentarios</Label>
                        <Input type="text" value={form[`${tech.toLowerCase().replace(/\s+/g, "_")}_comentario`]} onChange={(e) => updateField(`${tech.toLowerCase().replace(/\s+/g, "_")}_comentario`, e.target.value)} placeholder="Cantidad de secreciones, aspecto, si deglutió..." className="w-full text-sm" />
                      </div>
                    )}
                    {tech === "Aspiración de secreciones" && techniques.includes("Aspiración de secreciones") && (
                      <div className="ml-8 mb-3 space-y-1">
                        <Label className="text-xs text-muted-foreground">Comentarios</Label>
                        <Input type="text" value={form.aspiracion_comentario} onChange={(e) => updateField("aspiracion_comentario", e.target.value)} placeholder="tipo de aspiración, cantidad, características" className="w-full text-sm" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Apreciación Final
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <VitalField icon={Activity} label="Tolerancia a la Sesión" color="text-primary">
              <Select value={form.tolerancia} onValueChange={(v) => updateField("tolerancia", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Buena">Buena</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Mala">Mala</SelectItem>
                </SelectContent>
              </Select>
            </VitalField>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Observaciones</Label>
              <Textarea value={form.observacion_final} onChange={(e) => updateField("observacion_final", e.target.value)} placeholder="Observación final..." className="min-h-[60px]" />
            </div>
            <VitalField icon={Activity} label="%FCRut" color="text-primary">
              <div className="flex items-center gap-1">
                <Input type="number" min="0" max="100" value={form.porcentaje_fc_rut} onChange={(e) => updateField("porcentaje_fc_rut", e.target.value)} placeholder="0" className="w-20" />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </VitalField>
            <VitalField icon={Activity} label="Disnea" color="text-primary">
              <div className="flex items-center gap-1">
                <Input type="number" min="0" max="10" value={form.disnea} onChange={(e) => updateField("disnea", e.target.value)} placeholder="0" className="w-20" />
                <span className="text-sm text-muted-foreground">/10</span>
              </div>
            </VitalField>
            <VitalField icon={Activity} label="SSF" color="text-primary">
              <div className="flex items-center gap-1">
                <Input type="number" min="0" max="10" value={form.ssf} onChange={(e) => updateField("ssf", e.target.value)} placeholder="0" className="w-20" />
                <span className="text-sm text-muted-foreground">/10</span>
              </div>
            </VitalField>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            Observación Final
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <VitalField icon={Heart} label="FC final (lpm)" color="text-red-500">
              <Input type="number" value={form.fc_final} onChange={(e) => updateField("fc_final", e.target.value)} placeholder="60-100" />
            </VitalField>
            <VitalField icon={Wind} label="FR final (rpm)" color="text-teal-500">
              <Input type="number" value={form.fr_final} onChange={(e) => updateField("fr_final", e.target.value)} placeholder="12-20" />
            </VitalField>
            <VitalField icon={Droplets} label="SpO₂ final (%)" color="text-sky-500">
              <Input type="number" value={form.spo2_final} onChange={(e) => updateField("spo2_final", e.target.value)} placeholder="95-100" />
            </VitalField>
            <VitalField icon={Wind} label="FiO₂ final (%)" color="text-teal-500">
              <Input type="number" value={form.fio2_final} onChange={(e) => updateField("fio2_final", e.target.value)} placeholder="21" />
            </VitalField>
            <VitalField icon={Wind} label="Flujo O₂ final (lpm)" color="text-teal-500">
              <Input type="number" value={form.flujo_o2_final} onChange={(e) => updateField("flujo_o2_final", e.target.value)} placeholder="Ej: 3" />
            </VitalField>
            <VitalField icon={Wind} label="Soporte O₂ final" color="text-teal-500">
              <Select value={form.oxygen_support_final} onValueChange={(v) => updateField("oxygen_support_final", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {oxygenOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </VitalField>
            <VitalField icon={Wind} label="Flujo CNAF final (lpm)" color="text-teal-500">
              <Input type="number" value={form.cnaf_flow_final} onChange={(e) => updateField("cnaf_flow_final", e.target.value)} placeholder="Ej: 40" />
            </VitalField>
            {form.oxygen_support_final === "cnaf" && (
              <VitalField icon={Wind} label="iROX final" color="text-teal-500">
                <Input type="text" value={form.irox_final || ""} readOnly className="bg-muted" placeholder="Calculado" />
              </VitalField>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> FSS - ICU
            </h3>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={!!form.fss_icu_no_valorable} onChange={(e) => { updateField("fss_icu_no_valorable", e.target.checked); if (e.target.checked) { ["fss_giro","fss_supino_sedente","fss_sedente_borde_cama","fss_bipedo","fss_marcha"].forEach((k) => updateField(k, "")); } }} className="accent-primary" />
              No valorable
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "fss_giro", label: "Giro" },
              { key: "fss_supino_sedente", label: "Transición Supino a Sedente" },
              { key: "fss_sedente_borde_cama", label: "Sedente Borde Cama" },
              { key: "fss_bipedo", label: "Bipedo" },
              { key: "fss_marcha", label: "Marcha" },
            ].map((item) => {
              const val = form[item.key] != null && form[item.key] !== "" ? parseInt(form[item.key]) : null;
              return (
                <div key={item.key} className="p-4 rounded-xl bg-card border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-xs text-foreground">{item.label}</h4>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${val == null ? "bg-gray-400" : val <= 1 ? "bg-red-500" : val <= 3 ? "bg-orange-500" : val <= 5 ? "bg-yellow-500" : "bg-green-600"}`}>
                      {val ?? "—"}/7
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0,1,2,3,4,5,6,7].map((n) => (
                      <button key={n} type="button" disabled={form.fss_icu_no_valorable}
                        onClick={() => updateField(item.key, n.toString())}
                        className={`h-9 rounded-lg text-sm font-bold transition-all border-2 ${val === n ? "bg-primary text-white border-primary shadow-sm" : "bg-muted text-muted-foreground border-transparent hover:border-primary/40"}`}
                      >{n}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-right font-semibold">
            Total: {["fss_giro","fss_supino_sedente","fss_sedente_borde_cama","fss_bipedo","fss_marcha"].reduce((s, k) => s + (parseInt(form[k]) || 0), 0)}/35
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Escala ECK
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eckDimensions.map((dim) => (
              <ScaleDimension key={dim.key} label={dim.label} description={dim.description} criteria={dim.criteria}
                value={eckScores?.[dim.key] ?? null}
                onChange={(val) => onEckScoresChange?.((prev) => ({ ...prev, [dim.key]: val }))} />
            ))}
          </div>
          <div className="mt-6 space-y-2 text-xs">
            <h4 className="font-semibold text-sm mb-3">Tabla de Frecuencia</h4>
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

          <div className="pt-4 border-t border-border/50 space-y-3">
            <Button onClick={handleSaveEck} className="w-full gap-2" disabled={saveEckMut.isPending || !Object.values(eckScores).every((v) => v !== null)}>
              <Save className="w-4 h-4" />
              {saveEckMut.isPending ? "Guardando..." : "Guardar Evaluación ECK"}
            </Button>

            {patientScales.length >= 2 && (
              <div className="pt-4 border-t border-border/50">
                <h4 className="font-semibold text-sm mb-3">Evolución ECK</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[...patientScales].sort((a, b) => new Date(a.assessment_date || a.created_date) - new Date(b.assessment_date || b.created_date)).slice(-10).map((s) => ({
                      fecha: format(new Date(s.assessment_date || s.created_date), "dd/MM HH:mm", { locale: es }),
                      puntaje: s.total_score ?? 0,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 12]} ticks={[0, 4, 8, 12]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="puntaje" stroke="#0e7490" strokeWidth={2} dot={{ r: 4 }} name="Puntaje ECK" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {patientScales.length > 0 && (
              <div className="pt-4 border-t border-border/50">
                <h4 className="font-semibold text-sm mb-3">Historial Reciente</h4>
                <div className="space-y-1.5">
                  {patientScales.slice(0, 6).map((a) => {
                    const r = getResult(a.total_score);
                    return (
                      <div key={a.id} className="flex justify-between items-center p-2 rounded-lg bg-muted/40 text-xs">
                        <span className="text-muted-foreground">{format(new Date(a.assessment_date || a.created_date), "dd/MM HH:mm", { locale: es })}</span>
                        <span className="font-bold">{a.total_score}/12 <span className="font-normal text-muted-foreground">({r.label})</span></span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={handleSave} className="w-full max-w-md gap-2" disabled={saveMut.isPending}>
          <Save className="w-4 h-4" />
          {saveMut.isPending ? "Guardando..." : "Registrar Signos Vitales"}
        </Button>
      </div>

      {/* Registro clínico automático */}
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Registro Clínico Automático</h3>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={handleCopy}>
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <pre className="bg-muted/50 text-foreground px-4 py-4 font-mono text-xs leading-relaxed rounded-lg whitespace-pre-wrap border border-border/50 min-h-[200px]">
            {clinicalRecord}
          </pre>
          <p className="text-[11px] text-muted-foreground mt-3 text-center">El registro se actualiza automáticamente al completar los campos</p>
        </CardContent>
      </Card>
    </div>
  );
}