import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getResult } from "@/components/scales/ScaleResult";

const oxygenOptions = [
  { value: "ambiente", label: "Aire ambiente" },
  { value: "naricera", label: "Naricera" },
  { value: "mascarilla_simple", label: "Mascarilla simple" },
  { value: "mascarilla_reservorio", label: "Mascarilla con reservorio" },
  { value: "venturi", label: "Mascarilla Multivent" },
  { value: "cnaf", label: "CNAF" },
  { value: "vmni", label: "VMNI" },
  { value: "vmi", label: "VMI" }, { value: "tqt_hme", label: "TQT/HME" },
];

const oxygenLabel = (val) => oxygenOptions.find((o) => o.value === val)?.label || val;

export function generateClinicalRecord({ patient, form, techniques, eckScores, latestScale, now }) {
  const date = format(now, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });

  const lines = [];
  lines.push("KNT");
  lines.push(`Fecha: ${date}`);
  lines.push("");

  lines.push("Paciente cumple con requisitos previos para la atención kinésica.");

  if (form.apreciacion_inicial) {
    const aprecParts = [`Se encuentra ${form.apreciacion_inicial}`];
    if (form.estado_general) aprecParts.push(form.estado_general);
    if (form.gcs) aprecParts.push(`GCS ${form.gcs}/15`);
    if (form.sas) aprecParts.push(`SAS ${form.sas}/7`);
    if (form.s5q) aprecParts.push(`S5Q ${form.s5q}/5`);
    lines.push(`${aprecParts.join(", ")}.`);
  } else {
    const neuroParts = [];
    if (form.gcs) neuroParts.push(`GCS ${form.gcs}/15`);
    if (form.sas) neuroParts.push(`SAS ${form.sas}/7`);
    if (form.s5q) neuroParts.push(`S5Q ${form.s5q}/5`);
    if (neuroParts.length > 0) lines.push(`${neuroParts.join(", ")}.`);
  }

  if (form.observacion_inicial && form.observacion_inicial.trim()) {
    lines.push(`${form.observacion_inicial.trim()}`);
  }

  const vitalParts = [];
  if (form.heart_rate) vitalParts.push(`FC ${form.heart_rate} lpm`);
  if (form.systolic_bp && form.diastolic_bp)
    vitalParts.push(`PA ${form.systolic_bp}/${form.diastolic_bp} mmHg`);
  else if (form.systolic_bp) vitalParts.push(`PA sistólica ${form.systolic_bp} mmHg`);
  if (form.pam) vitalParts.push(`PAM ${form.pam} mmHg`);
  if (form.respiratory_rate) vitalParts.push(`FR ${form.respiratory_rate} rpm`);
  if (form.spo2) vitalParts.push(`SpO₂ ${form.spo2}%`);
  if (form.fio2) vitalParts.push(`FiO₂ ${form.fio2}%`);
  if (form.temperature) vitalParts.push(`T° ${form.temperature}°C`);
  if (form.oxygen_support) vitalParts.push(`oxigenoterapia: ${oxygenLabel(form.oxygen_support)}`);
  if (form.cnaf_flow) vitalParts.push(`flujo CNAF ${form.cnaf_flow} lpm`);
  if (form.flujo_naricera) vitalParts.push(`flujo O2 ${form.flujo_naricera} lpm`);
  if (form.irox) vitalParts.push(`iROX ${form.irox}`);

  if (vitalParts.length > 0) {
    lines.push(`${vitalParts.join(", ")}.`);
  }

  if (form.apremio_ventilatorio) lines.push(`${form.apremio_ventilatorio}.`);
  if (form.pain_scale) lines.push(`${form.pain_scale}/10.`);

  if (form.mecanismo_tos || form.caracteristicas_tos || form.secreciones) {
    let tosLine = "Evaluación de la tos:";
    if (form.mecanismo_tos) tosLine += ` ${form.mecanismo_tos}`;
    if (form.caracteristicas_tos) tosLine += `, ${form.caracteristicas_tos}`;
    if (form.secreciones) tosLine += `, secreciones ${form.secreciones}`;
    lines.push(`${tosLine}.`);
  }

  const ruidoPulmonarStr = form.ruido_pulmonar;
  const ruidoZonaStr = form.ruido_pulmonar_zona;
  const ruidosAgregadosStr = form.ruidos_agregados;
  if (ruidoPulmonarStr || ruidosAgregadosStr) {
    let auscLine = "Auscultación: Ruido Pulmonar";
    if (ruidoPulmonarStr) {
      auscLine += ` ${ruidoPulmonarStr.toLowerCase()}`;
      if (ruidoZonaStr) auscLine += ` en ${ruidoZonaStr.toLowerCase()}`;
    }
    if (ruidosAgregadosStr) {
      auscLine += `, ${ruidosAgregadosStr.toLowerCase()}`;
    }
    lines.push(`${auscLine}.`);
  }

  if (form.fuerza_muscular || form.rom || form.pto || form.asistencia_transiciones) {
    const motParts = [];
    if (form.fuerza_muscular) motParts.push(`Fuerza muscular: ${form.fuerza_muscular}`);
    if (form.rom) motParts.push(`ROM: ${form.rom}`);
    if (form.pto) motParts.push(`PTO: ${form.pto}`);
    if (form.asistencia_transiciones) motParts.push(`Transiciones: ${form.asistencia_transiciones}`);
    lines.push(`${motParts.join(", ")}.`);
  }

  const neuroParts = [];
  if (form.tono_muscular) neuroParts.push(`Tono muscular: ${form.tono_muscular}`);
  if (form.sensibilidad) neuroParts.push(`Sensibilidad: ${form.sensibilidad}`);
  if (form.observaciones_neurologicas) neuroParts.push(`Obs. neurológicas: ${form.observaciones_neurologicas}`);
  if (neuroParts.length > 0) lines.push(`${neuroParts.join(", ")}.`);

  const techs = techniques && techniques.length > 0 ? techniques : [];
  if (techs.length > 0) {
    const last = techs[techs.length - 1];
    const rest = techs.slice(0, -1);
    const techStr = rest.length > 0 ? `${rest.join(", ")} y ${last}` : last;
    lines.push(`Se realiza: ${techStr}.`);
  }

  const scaleParts = [];
  if (form.ikctv) scaleParts.push(`IKCTV ${form.ikctv}`);
  if (form.fss_icu) scaleParts.push(`FSS-ICU ${form.fss_icu}`);
  if (scaleParts.length > 0) lines.push(`${scaleParts.join(", ")}.`);

  const quedaParts = [];
  if (form.evaluacion_estado_general) quedaParts.push(form.evaluacion_estado_general);
  if (form.posicion_cama) quedaParts.push(form.posicion_cama);
  if (quedaParts.length > 0) lines.push(`Queda: ${quedaParts.join(", ")}.`);

  const evalParts = [];
  if (form.tolerancia) evalParts.push(`Tolerancia: ${form.tolerancia}`);
  if (form.porcentaje_fc_rut) evalParts.push(`%FCRut: ${form.porcentaje_fc_rut}%`);
  if (form.disnea) evalParts.push(`Disnea: ${form.disnea}/10`);
  if (form.ssf) evalParts.push(`SSF: ${form.ssf}/10`);
  if (evalParts.length > 0) lines.push(`${evalParts.join(", ")}.`);

  if (form.observacion_final && form.observacion_final.trim()) {
    lines.push(`${form.observacion_final.trim()}`);
  }

  const eck = eckScores || latestScale;
  if (eck) {
    const isForm = !!eckScores;
    const c = eck.consciousness_dimension;
    const v = eck.ventilatory_dimension;
    const d = eck.devices_dimension;
    const m = eck.mobility_dimension;
    const total = isForm
      ? [c, v, d, m].reduce((s, x) => s + (x ?? 0), 0)
      : (eck.total_score ?? 0);
    const result = getResult(total);
    lines.push("Escala de Categorización Kinésica (ECK):");
    lines.push(`  - Estado de Conciencia: ${c != null ? c : "—"}/3`);
    lines.push(`  - Carga Ventilatoria: ${v != null ? v : "—"}/3`);
    lines.push(`  - Permeabilización Vía Aérea: ${d != null ? d : "—"}/3`);
    lines.push(`  - Movilidad Funcional: ${m != null ? m : "—"}/3`);
    lines.push(`  - Puntaje Total: ${total}/12 → ${result.label}`);
    lines.push(`  - Atenciones requeridas: ${result.frequency}${result.level === "severa" ? " o más" : ""} en 24 hrs`);
  }

  lines.push("Atención finalizada sin incidentes.");
  lines.push("Aviso a EU de sala.");
  return lines.join("\n");
}
