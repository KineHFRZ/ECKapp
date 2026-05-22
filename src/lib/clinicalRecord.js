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
  const time = format(now, "HH:mm", { locale: es });

  const lines = [];
  lines.push("KNT");
  lines.push(time);
  lines.push("");

  lines.push("Paciente cumple con requisitos previos para la atención kinésica.");

  let line = "";

  if (form.apreciacion_inicial) {
    const aprecVal = form.apreciacion_inicial === "Sopor" && form.sopor_level ? `Sopor (${form.sopor_level})` : form.apreciacion_inicial;
    const aprecParts = [aprecVal];
    if (form.gcs) aprecParts.push(`GCS ${form.gcs}/15`);
    if (form.sas) aprecParts.push(`SAS ${form.sas}/7`);
    if (form.s5q) aprecParts.push(`S5Q ${form.s5q}/5`);
    line += `${aprecParts.join(", ")}.`;
  } else {
    const neuroParts = [];
    if (form.gcs) neuroParts.push(`GCS ${form.gcs}/15`);
    if (form.sas) neuroParts.push(`SAS ${form.sas}/7`);
    if (form.s5q) neuroParts.push(`S5Q ${form.s5q}/5`);
    if (neuroParts.length > 0) line += `${neuroParts.join(", ")}.`;
  }

  const apremioParts = [];
  if (form.apremio_ventilatorio) apremioParts.push(form.apremio_ventilatorio.toLowerCase());
  if (form.colaboracion) apremioParts.push(form.colaboracion.toLowerCase());
  if (apremioParts.length > 0) line += ` ${apremioParts.join(", ")}.`;

  if (form.observacion_inicial && form.observacion_inicial.trim()) {
    const obsInit = form.observacion_inicial.trim().toLowerCase();
    line += ` ${obsInit.charAt(0).toUpperCase() + obsInit.slice(1)}`;
  }

  if (line) lines.push(line);

  const hemoParts = [];
  if (form.heart_rate) hemoParts.push(`FC ${form.heart_rate} lpm`);
  if (form.systolic_bp && form.diastolic_bp)
    hemoParts.push(`PA ${form.systolic_bp}/${form.diastolic_bp} mmHg`);
  else if (form.systolic_bp) hemoParts.push(`PA sistólica ${form.systolic_bp} mmHg`);
  if (form.pam) hemoParts.push(`PAM ${form.pam} mmHg`);
  if (form.temperature) hemoParts.push(`T° ${form.temperature}°C`);
  if (hemoParts.length > 0) lines.push(`${hemoParts.join(", ")}.`);

  if (form.pain_scale) lines.push(`${form.pain_scale}/10.`);

  // Build continuous respiratory + auscultación + tos paragraph
  let respLine = "";

  const respParts = [];
  if (form.respiratory_rate) respParts.push(`FR ${form.respiratory_rate} rpm`);
  if (form.spo2) respParts.push(`SpO₂ ${form.spo2}%`);
  if (form.fio2) respParts.push(`FiO₂ ${form.fio2}%`);
  if (form.oxygen_support) respParts.push(`con ${oxygenLabel(form.oxygen_support).toLowerCase()}`);
  if (form.cnaf_flow) respParts.push(`flujo CNAF ${form.cnaf_flow} lpm`);
  if (form.flujo_naricera) respParts.push(`flujo O2 ${form.flujo_naricera} lpm`);
  if (form.irox) respParts.push(`iROX ${form.irox}`);

  if (respParts.length > 0) respLine += respParts.join(", ");

  // Auscultación
  const auscParts = [];
  if (form.ruido_pulmonar) {
    let rp = `ruido pulmonar ${form.ruido_pulmonar.toLowerCase()}`;
    if (form.ruido_pulmonar === "Disminuido" && form.ruido_pulmonar_loc) {
      const locs = form.ruido_pulmonar_loc.split(",").filter(Boolean);
      if (locs.length > 0) rp += ` ${locs.join(", ")}`;
    }
    auscParts.push(rp);
  }
  if (form.ruidos_agregados) {
    const raArr = form.ruidos_agregados.split(",").filter(Boolean).filter((x) => x !== "Sin Ruidos Agregados");
    if (raArr.length > 0) {
      const locMap = JSON.parse(form.ruidos_agregados_loc || "{}");
      const raFormatted = raArr.map((r) => {
        const locsStr = locMap[r] || "";
        const locs = locsStr.split(",").filter(Boolean);
        if (locs.length > 0) return `${r.toLowerCase()} ${locs.join(", ")}`;
        return r.toLowerCase();
      });
      auscParts.push(raFormatted.join(", "));
    } else if (form.ruidos_agregados === "Sin Ruidos Agregados") {
      auscParts.push("sin ruidos agregados");
    }
  }
  if (auscParts.length > 0) {
    if (respLine) respLine += ", ";
    respLine += `Auscultación: ${auscParts.join(", ")}`;
  }

  if (form.observaciones_ausc && form.observaciones_ausc.trim()) {
    respLine += `, ${form.observaciones_ausc.trim().toLowerCase()}`;
  }

  // Tos
  if (form.mecanismo_tos || form.caracteristicas_tos || form.secreciones) {
    const tosParts = [];
    if (form.mecanismo_tos) tosParts.push(form.mecanismo_tos.toLowerCase());
    if (form.caracteristicas_tos) tosParts.push(form.caracteristicas_tos.toLowerCase());
    if (form.secreciones) tosParts.push(`secreciones ${form.secreciones.toLowerCase()}`);
    if (respLine) respLine += ", ";
    respLine += `evaluación de la tos: ${tosParts.join(", ")}`;
  }

  if (form.observaciones_vent && form.observaciones_vent.trim()) {
    if (respLine) respLine += ", ";
    respLine += form.observaciones_vent.trim().toLowerCase();
  }

  if (respLine) lines.push(`${respLine}.`);

  if (form.ikctv) lines.push(`IKCTV ${form.ikctv} ptos.`);

  const funcParts = [];
  if (form.fuerza_muscular) {
    let fm = `Fuerza muscular: ${form.fuerza_muscular.toLowerCase()}`;
    if (form.fuerza_muscular === "Alterada" && form.fuerza_muscular_loc) {
      const locs = form.fuerza_muscular_loc.split(",").filter(Boolean);
      if (locs.length > 0) fm += ` en ${locs.join(", ")}`;
    }
    funcParts.push(fm);
  }
  if (form.rom) {
    let r = `ROM: ${form.rom.toLowerCase()}`;
    if (form.rom === "Alterado" && form.rom_loc) {
      const locs = form.rom_loc.split(",").filter(Boolean);
      if (locs.length > 0) r += ` en ${locs.join(", ")}`;
    }
    funcParts.push(r);
  }
  if (form.tono_muscular) funcParts.push(`Tono muscular: ${form.tono_muscular.toLowerCase()}`);
  if (form.sensibilidad) funcParts.push(`Sensibilidad: ${form.sensibilidad.toLowerCase()}`);
  if (form.observaciones_neurologicas) funcParts.push(`Observaciones: ${form.observaciones_neurologicas.toLowerCase()}`);
  if (funcParts.length > 0) lines.push(`${funcParts.join(", ")}.`);

  if (techniques && techniques.length > 0) {
    const techDisplay = techniques.map((t) => {
      const base = t.toLowerCase();
      if (base.includes("sedente borde cama")) {
        const parts = [base];
        if (form.pto) parts.push(`PTO: ${form.pto}`);
        if (form.sedente_comentario) parts.push(form.sedente_comentario.toLowerCase());
        return parts.join(", ");
      }
      if (base === "bipedo" && form.bipedo_comentario) return `${base} (${form.bipedo_comentario.toLowerCase()})`;
      if (base === "marcha" && form.marcha_comentario) return `${base} (${form.marcha_comentario.toLowerCase()})`;
      if ((base === "tos provocada" || base === "tos asistida" || base === "tos dirigida") && form[`${base.replace(/\s+/g, "_")}_comentario`]) return `${base} (${form[`${base.replace(/\s+/g, "_")}_comentario`].toLowerCase()})`;
      if (base === "aspiración de secreciones" || base === "aspiracion de secreciones") {
        if (form.aspiracion_comentario) return `${base} (${form.aspiracion_comentario.toLowerCase()})`;
        return base;
      }
      return base;
    });
    lines.push(`Se realiza: ${techDisplay.join(", ")}.`);
  }

  const evalParts = [];
  if (form.tolerancia) evalParts.push(`Tolerancia: ${form.tolerancia.toLowerCase()}`);
  if (form.porcentaje_fc_rut) evalParts.push(`%FCRut: ${form.porcentaje_fc_rut}%`);
  if (form.disnea) evalParts.push(`Disnea: ${form.disnea}/10`);
  if (form.ssf) evalParts.push(`SSF: ${form.ssf}/10`);
  if (evalParts.length > 0) lines.push(`${evalParts.join(", ")}.`);

  const fssItems = [
    { key: "fss_giro", label: "Giro" },
    { key: "fss_supino_sedente", label: "Transición Supino a Sedente" },
    { key: "fss_sedente_borde_cama", label: "Sedente Borde Cama" },
    { key: "fss_bipedo", label: "Bipedo" },
    { key: "fss_marcha", label: "Marcha" },
  ];
  const fssTotal = fssItems.reduce((sum, item) => sum + (parseInt(form[item.key]) || 0), 0);
  if (form.fss_icu_no_valorable) lines.push("FSS-ICU: No valorable.");
  else if (fssTotal > 0) lines.push(`FSS-ICU: ${fssTotal}/35 ptos.`);

  if (form.observacion_final && form.observacion_final.trim()) {
    const obsFinal = form.observacion_final.trim().toLowerCase();
    lines.push(`${obsFinal.charAt(0).toUpperCase() + obsFinal.slice(1)}`);
  }

  const finalVitalParts = [];
  if (form.fc_final) finalVitalParts.push(`FC final ${form.fc_final} lpm`);
  if (form.fr_final) finalVitalParts.push(`FR final ${form.fr_final} rpm`);
  if (form.spo2_final) finalVitalParts.push(`SpO₂ final ${form.spo2_final}%`);
  if (form.fio2_final) finalVitalParts.push(`FiO₂ final ${form.fio2_final}%`);
  if (form.flujo_o2_final) finalVitalParts.push(`flujo O₂ final ${form.flujo_o2_final} lpm`);
  if (form.oxygen_support_final) finalVitalParts.push(`con ${oxygenLabel(form.oxygen_support_final).toLowerCase()}`);
  if (form.cnaf_flow_final) finalVitalParts.push(`flujo CNAF final ${form.cnaf_flow_final} lpm`);
  if (form.irox_final && form.oxygen_support_final === "cnaf") finalVitalParts.push(`iROX final ${form.irox_final}`);
  if (finalVitalParts.length > 0) lines.push(`${finalVitalParts.join(", ")}.`);

  const quedaParts = [];
  if (form.evaluacion_estado_general) quedaParts.push(form.evaluacion_estado_general.toLowerCase());
  if (form.posicion_cama) quedaParts.push(form.posicion_cama.toLowerCase());
  if (quedaParts.length > 0) lines.push(`Queda: ${quedaParts.join(", ")}.`);

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
  }

  lines.push("Atención finalizada sin incidentes.");
  lines.push("Aviso a EU de sala.");
  return lines.join("\n");
}
