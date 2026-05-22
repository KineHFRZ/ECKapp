import { db } from "@/api/base44Client";

import { useState, useMemo, useEffect } from "react";

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Heart, Wind, Droplets, Brain, Activity, Stethoscope, Copy, Check, TrendingUp, TrendingDown, Minus, ClipboardList } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import PatientSelector from "@/components/shared/PatientSelector";
import ScaleDimension from "@/components/scales/ScaleDimension";
import ScaleEvolutionChart from "@/components/scales/ScaleEvolutionChart";
import { getResult } from "@/components/scales/ScaleResult";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const oxygenOptions = [
{ value: "ambiente", label: "Aire ambiente" },
{ value: "cnaf", label: "CNAF" },
{ value: "mascarilla_reservorio", label: "Mascarilla con reservorio" },
{ value: "venturi", label: "Mascarilla Multivent" },
{ value: "mascarilla_simple", label: "Mascarilla simple" },
{ value: "naricera", label: "Naricera" },
{ value: "tqt_hme", label: "TQT/HME" },
{ value: "vmni", label: "VMNI" },
{ value: "vmi", label: "VMI" }];

const ruidoPulmonarOptions = ["Presente", "Disminuido", "Abolido"];
const locationsList = ["biapical", "bibasal", "ápice derecho", "ápice izquierdo", "base derecha", "base izquierda", "hemicampo derecho", "hemicampo izquierdo", "bilateral", "posterobasal derecho", "posterobasal izquierdo"];
const ruidosAgregadosOptions = ["Crepitos", "Estertor", "Roncus", "Sibilancias", "Ruido Respiratorio Bronquial", "Sin Ruidos Agregados"];

const movilidadOptions = [
  "Evaluación Kinésica",
  "Movilidad Pasiva",
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
"Aspiración de secreciones",
"Asistencia técnica con dispositivos para expansión pulmonar",
"Asistencia técnica con dispositivos para permeabilizar vía aérea",
"Ejercicios de reexpansión pulmonar",
"Manejo integral de vía aérea artificial",
"Tos asistida",
"Tos dirigida",
"Tos provocada"];

const eckDimensions = [
  { key: "consciousness_dimension", label: "Estado de Conciencia", description: "Vigilia voluntaria y cumplimiento de órdenes", criteria: ["Vigilia voluntaria, lúcido o vigil al llamado", "Sopor superficial, responde de manera confusa", "Sopor medio o agitado o no sigue órdenes", "Sopor profundo o sin conexión al medio"] },
  { key: "ventilatory_dimension", label: "Carga Ventilatoria", description: "Índice Kinésico de la Carga del Trabajo Ventilatorio (IKCTV)", criteria: ["IKCTV Leve (0–4)", "IKCTV Leve (5–8)", "IKCTV Moderado (9–16)", "IKCTV Severo (17–24)"] },
  { key: "devices_dimension", label: "Permeabilización de la Vía Aérea", description: "Evaluación de la tos y necesidad de asistencia", criteria: ["Tos efectiva, no requiere asistencia de PVA", "Tos débil, requiere asistencia para PVA", "Tos débil, requiere aspiración de secreciones", "Ausencia de tos, requiere aspiración de secreciones"] },
  { key: "mobility_dimension", label: "Movilidad Funcional", description: "Funcionalidad global mediante escala FSS-ICU", criteria: ["FSS-ICU 30–35", "FSS-ICU 21–29", "FSS-ICU 11–20", "FSS-ICU ≤10 o NV"] },
];

const initialEckScores = { consciousness_dimension: null, ventilatory_dimension: null, devices_dimension: null, mobility_dimension: null };

const initialForm = {
  heart_rate: "", systolic_bp: "", diastolic_bp: "", spo2: "",
  respiratory_rate: "", temperature: "", fio2: "", oxygen_support: "",
  pain_scale: "", notes: "", cnaf_flow: "", ventilatory_mode: "",
  apreciacion_inicial: "", sopor_level: "", colaboracion: "", apremio_ventilatorio: "",
  mecanismo_tos: "", caracteristicas_tos: "",
  evaluacion_estado_general: "", posicion_cama: "",
  ruido_pulmonar: "", ruido_pulmonar_zona: "", ruidos_agregados: "",
  ruido_pulmonar_loc: "", ruidos_agregados_loc: "{}",
  irox: "", pam: "", ikctv: "", flujo_naricera: "", observaciones_vent: "", observaciones_ausc: "",
  fuerza_muscular: "", fuerza_muscular_loc: "", rom: "", rom_loc: "", pto: "", asistencia_transiciones: "", secreciones: "",
  sedente_comentario: "", bipedo_comentario: "", marcha_comentario: "",
  tos_provocada_comentario: "", tos_asistida_comentario: "", tos_dirigida_comentario: "",
  observacion_inicial: "", observacion_final: "",
  fss_icu_no_valorable: false,
  fss_giro: "", fss_sedente_bipedo: "", fss_supino_sedente: "", fss_marcha: "", fss_sedente_apoyo: "",
};

function VitalField({ icon: Icon, label, children, color }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        {label}
      </Label>
      {children}
    </div>);

}

const dimensionLabels = {
  consciousness_dimension: "Estado de Conciencia",
  ventilatory_dimension: "Carga Ventilatoria",
  devices_dimension: "Dispositivos y Drenajes",
  mobility_dimension: "Movilidad Funcional"
};

const quickObservations = [
"Paciente colaborador, buena tolerancia a la sesión",
"Paciente con dolor controlado durante la sesión",
"Paciente con fatiga, se realizan pausas durante la sesión",
"Paciente requirió mayor apoyo ventilatorio durante la sesión",
"Se evidencia mejoría en tolerancia al ejercicio",
"Se realiza educación al paciente y/o familia",
"Se requirió aspiración de secreciones durante la sesión",
"Sin cambios significativos respecto a sesión anterior"];

import { generateClinicalRecord } from "@/lib/clinicalRecord";

export default function VitalSigns() {
  const [patientId, setPatientId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [techniques, setTechniques] = useState([]);
  const [eckScores, setEckScores] = useState(initialEckScores);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => db.entities.Patient.list()
  });

  const { data: allScales = [] } = useQuery({
    queryKey: ["scales"],
    queryFn: () => db.entities.ScaleAssessment.list("-created_date", 50)
  });

  const patient = patients.find((p) => p.id === patientId) || null;
  const patientScales = patientId ?
  allScales.filter((s) => s.patient_id === patientId).sort((a, b) =>
  new Date(b.assessment_date || b.created_date) - new Date(a.assessment_date || a.created_date)
  ) :
  [];
  const latestScale = patientScales[0] || null;

  const saveMut = useMutation({
    mutationFn: (data) => db.entities.VitalSigns.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vitals"] });
      setForm(initialForm);
      setTechniques([]);
      toast.success("Signos vitales registrados");
    }
  });

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

  const handleSave = () => {
    if (!patientId) {toast.error("Selecciona un paciente");return;}
    const numFields = ["heart_rate", "systolic_bp", "diastolic_bp", "spo2", "respiratory_rate", "temperature", "fio2", "pain_scale", "cnaf_flow", "irox", "pam", "fss_giro", "fss_sedente_bipedo", "fss_supino_sedente", "fss_marcha", "fss_sedente_apoyo"];
    const stringFields = ["apreciacion_inicial", "sopor_level", "colaboracion", "apremio_ventilatorio", "mecanismo_tos", "caracteristicas_tos", "secreciones", "evaluacion_estado_general", "posicion_cama", "ruido_pulmonar", "ruido_pulmonar_zona", "ruidos_agregados", "ruido_pulmonar_loc", "ruidos_agregados_loc", "fuerza_muscular", "fuerza_muscular_loc", "rom", "rom_loc", "pto", "asistencia_transiciones", "observacion_inicial", "observacion_final", "observaciones_vent", "observaciones_ausc", "sedente_comentario", "bipedo_comentario", "marcha_comentario", "tos_provocada_comentario", "tos_asistida_comentario", "tos_dirigida_comentario"];
    const parsed = { patient_id: patientId, record_date: new Date().toISOString() };
    numFields.forEach((f) => {if (form[f]) parsed[f] = Number(form[f]);});
    stringFields.forEach((f) => {if (form[f]) parsed[f] = form[f];});
    if (form.oxygen_support) parsed.oxygen_support = form.oxygen_support;
    if (form.notes) parsed.notes = form.notes;
    if (techniques.length > 0) parsed.techniques = techniques;
    saveMut.mutate(parsed);
  };

  const clinicalRecord = useMemo(() =>
  generateClinicalRecord({ patient, form, techniques, eckScores, latestScale, now: new Date() }),
  [patient, form, techniques, eckScores, latestScale]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(clinicalRecord);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Registro copiado al portapapeles");
  };

  return (
    <div>
      <PageHeader title="Signos Vitales" subtitle="Registro de parámetros fisiológicos del paciente" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: form */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <PatientSelector value={patientId} onChange={setPatientId} />
            </CardContent>
          </Card>

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
                      <SelectItem value="Apremio ventilatorio">Apremio ventilatorio</SelectItem>
                      <SelectItem value="Apremio ventilatorio leve">Apremio ventilatorio leve</SelectItem>
                      <SelectItem value="Sin apremio ventilatorio">Sin apremio ventilatorio</SelectItem>
                    </SelectContent>
                  </Select>
                </VitalField>
                <VitalField icon={Activity} label="EVA Dolor (0-10)" color="text-amber-500">
                  <Input type="number" min="0" max="10" value={form.pain_scale} onChange={(e) => updateField("pain_scale", e.target.value)} placeholder="0-10" />
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
                <VitalField icon={Wind} label="IKCTV" color="text-teal-500">
                  <Input type="number" value={form.ikctv} onChange={(e) => updateField("ikctv", e.target.value)} placeholder="0-24" />
                </VitalField>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-primary flex items-center gap-1.5">
                    <Activity className="w-4 h-4" /> FSS - ICU
                  </h4>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={!!form.fss_icu_no_valorable} onChange={(e) => { updateField("fss_icu_no_valorable", e.target.checked); if (e.target.checked) { ["fss_giro","fss_sedente_bipedo","fss_supino_sedente","fss_marcha","fss_sedente_apoyo"].forEach((k) => updateField(k, "")); } }} className="accent-primary" />
                    No valorable
                  </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { key: "fss_giro", label: "Giro" },
                    { key: "fss_sedente_bipedo", label: "Transición Sedente a Bípedo" },
                    { key: "fss_supino_sedente", label: "Transición Supino a Sedente" },
                    { key: "fss_marcha", label: "Marcha" },
                    { key: "fss_sedente_apoyo", label: "Sedente Sin Apoyo" },
                  ].map((item) => (
                    <div key={item.key} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{item.label}</Label>
                      <Input type="number" min="0" max="7" value={form[item.key]} onChange={(e) => updateField(item.key, e.target.value)} placeholder="0-7" disabled={form.fss_icu_no_valorable} className="text-sm" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  Total: {["fss_giro","fss_sedente_bipedo","fss_supino_sedente","fss_marcha","fss_sedente_apoyo"].reduce((s, k) => s + (parseInt(form[k]) || 0), 0)}/35
                </p>
              </div>
                <VitalField icon={Wind} label="Soporte O₂" color="text-teal-500">
                  <Select value={form.oxygen_support} onValueChange={(v) => updateField("oxygen_support", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {oxygenOptions.map((o) =>
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      )}
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
              <div className="mt-4 pt-4 border-t border-border/50 space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Observaciones</Label>
                <Textarea value={form.observaciones_vent} onChange={(e) => updateField("observaciones_vent", e.target.value)} placeholder="Observaciones respiratorias..." className="min-h-[60px]" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                Auscultación Pulmonar
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
                        {selected && opt !== "Sin Ruidos Agregados" && (
                          <div className="ml-4 mt-1 grid grid-cols-1 gap-x-2 gap-y-0.5">
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
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Evaluación Motora
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
                <VitalField icon={Activity} label="PTO" color="text-primary">
                  <Select value={form.pto} onValueChange={(v) => updateField("pto", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Negativa">Negativa</SelectItem>
                      <SelectItem value="Positiva">Positiva</SelectItem>
                    </SelectContent>
                  </Select>
                </VitalField>
                <VitalField icon={Activity} label="Asistencia en Transiciones" color="text-primary">
                  <Select value={form.asistencia_transiciones} onValueChange={(v) => updateField("asistencia_transiciones", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asistencia leve">Asistencia leve</SelectItem>
                      <SelectItem value="Asistencia máxima">Asistencia máxima</SelectItem>
                      <SelectItem value="Asistencia moderada">Asistencia moderada</SelectItem>
                      <SelectItem value="Asistencia técnica">Asistencia técnica</SelectItem>
                      <SelectItem value="Sin asistencia">Sin asistencia</SelectItem>
                    </SelectContent>
                  </Select>
                </VitalField>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-1 text-foreground flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                Intervenciones Kinésicas
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Selecciona todas las que apliquen</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-wide">Movilidad Funcional</p>
                  <div className="space-y-2">
                    {movilidadOptions.map((tech) => (
                      <label key={tech} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/40 cursor-pointer transition-colors">
                        <input type="checkbox" checked={techniques.includes(tech)} onChange={() => toggleTechnique(tech)} className="mt-0.5 accent-primary" />
                        <span className="text-sm leading-snug">{tech}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-teal-600 mb-3 uppercase tracking-wide">Terapia Respiratoria</p>
                  <div className="space-y-2">
                    {respiratoriaOptions.map((tech) => (
                      <label key={tech} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/40 cursor-pointer transition-colors">
                        <input type="checkbox" checked={techniques.includes(tech)} onChange={() => toggleTechnique(tech)} className="mt-0.5 accent-primary" />
                        <span className="text-sm leading-snug">{tech}</span>
                      </label>
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
                Evaluación Final
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <VitalField icon={Brain} label="Estado general" color="text-purple-500">
                  <Select value={form.evaluacion_estado_general} onValueChange={(v) => updateField("evaluacion_estado_general", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Agitado(a)">Agitado(a)</SelectItem>
                      <SelectItem value="Contenido(a)">Contenido(a)</SelectItem>
                      <SelectItem value="Tranquilo(a)">Tranquilo(a)</SelectItem>
                    </SelectContent>
                  </Select>
                </VitalField>
                <VitalField icon={Activity} label="Posición en cama" color="text-primary">
                  <Select value={form.posicion_cama} onValueChange={(v) => updateField("posicion_cama", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Acostado(a) en cama 30°">Acostado(a) en cama 30°</SelectItem>
                      <SelectItem value="Sedente en silla/sillón">Sedente en silla/sillón</SelectItem>
                      <SelectItem value="Sedente borde cama">Sedente borde cama</SelectItem>
                    </SelectContent>
                  </Select>
                </VitalField>
              </div>
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
                    value={eckScores[dim.key]} onChange={(val) => setEckScores((prev) => ({ ...prev, [dim.key]: val }))} />
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
            </CardContent>
          </Card>
        </div>

        {/* Right: clinical record + ECK + observations */}
        <div className="xl:col-span-1 space-y-5">
          {/* Registro Clínico */}
          <div className="sticky top-6 space-y-5">
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm text-foreground">Registro Clínico Automático</h3>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={handleCopy}>
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
                <pre className="bg-muted/50 text-foreground px-4 py-4 font-mono text-xs leading-relaxed opacity-100 rounded-lg whitespace-pre-wrap border border-border/50 min-h-[300px]">
                  {clinicalRecord}
                </pre>
                <p className="text-[11px] text-muted-foreground mt-3 text-center">
                  El registro se actualiza automáticamente al completar los campos
                </p>
              </CardContent>
            </Card>

            {/* Plantilla de observaciones rápidas */}
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm text-foreground">Observaciones Rápidas</h3>
                </div>
                <div className="space-y-1.5">
                  {quickObservations.map((obs) =>
                  <button
                    key={obs}
                    type="button"
                    onClick={() => updateField("observacion_inicial", form.observacion_inicial ? form.observacion_inicial + " " + obs : obs)}
                    className="w-full text-left text-xs p-2.5 rounded-lg border border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground">
                    
                      {obs}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ECK: última escala del paciente */}
            {latestScale &&
            <Card className="border-border/50">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm text-foreground mb-1">Última ECK del Paciente</h3>
                  <p className="text-[11px] text-muted-foreground mb-3">
                    {format(new Date(latestScale.assessment_date || latestScale.created_date), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                  <div className="space-y-1.5 mb-3">
                    {[
                  { key: "consciousness_dimension", label: "Estado de Conciencia" },
                  { key: "ventilatory_dimension", label: "Carga Ventilatoria" },
                  { key: "devices_dimension", label: "Dispositivos y Drenajes" },
                  { key: "mobility_dimension", label: "Movilidad Funcional" }].
                  map(({ key, label }) => {
                    const val = latestScale[key];
                    const color = val === 0 ? "bg-green-500" : val === 1 ? "bg-yellow-500" : val === 2 ? "bg-orange-500" : "bg-red-600";
                    return (
                      <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate pr-2">{label}</span>
                          <span className={`font-bold px-2 py-0.5 rounded-full text-white text-[10px] ${color}`}>{val ?? "—"}/3</span>
                        </div>);

                  })}
                  </div>
                  <div className="border-t border-border/50 pt-2.5 flex items-center justify-between">
                    <span className="text-xs font-semibold">Puntaje Total</span>
                    <div className="text-right">
                      <span className="text-sm font-black">{latestScale.total_score}/12</span>
                      <p className="text-[10px] text-muted-foreground">{getResult(latestScale.total_score).label}</p>
                      <p className="text-[10px] font-semibold text-primary">{getResult(latestScale.total_score).frequency}{latestScale.total_score >= 9 ? "+" : ""} atenciones/24hrs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }

            {/* Historial y tendencia ECK */}
            {patientScales.length >= 2 &&
            <Card className="border-border/50">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm text-foreground mb-4">Tendencia ECK</h3>
                  <ScaleEvolutionChart assessments={allScales} patientId={patientId} />
                </CardContent>
              </Card>
            }

            {patientScales.length > 0 &&
            <Card className="border-border/50">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm text-foreground mb-3">Historial de Escalas</h3>
                  <div className="space-y-2">
                    {patientScales.slice(0, 6).map((s, idx) => {
                    const prev = patientScales[idx + 1];
                    const diff = prev ? s.total_score - prev.total_score : null;
                    const result = getResult(s.total_score);
                    return (
                      <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 text-xs gap-2">
                          <div className="min-w-0">
                            <p className="text-muted-foreground">
                              {format(new Date(s.assessment_date || s.created_date), "dd/MM HH:mm", { locale: es })}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{result.label}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {diff !== null &&
                          <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${diff > 0 ? "text-red-500" : diff < 0 ? "text-green-600" : "text-muted-foreground"}`}>
                                {diff > 0 ? <TrendingUp className="w-3 h-3" /> : diff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                          }
                            <span className="font-black text-sm">{s.total_score}/12</span>
                          </div>
                        </div>);

                  })}
                  </div>
                </CardContent>
              </Card>
            }
          </div>
        </div>
      </div>
    </div>);

}