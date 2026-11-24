import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { generateClinicalRecord } from "@/lib/clinicalRecord";
import { getResult } from "@/components/scales/ScaleResult";

const oxygenLabels = {
  ambiente: "Aire ambiente", naricera: "Naricera", mascarilla_simple: "Mascarilla simple",
  mascarilla_reservorio: "Mascarilla con reservorio", venturi: "Mascarilla Multivent",
  cnaf: "CNAF", vmni: "VMNI", vmi: "VMI", tqt_hme: "TQT/HME",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: es });
}

function formatDateShort(dateStr) {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: es });
}

const tdStyle = { padding: "5pt 8pt", border: "1px solid #ddd" };
const thStyle = { backgroundColor: "#f0f9ff", color: "#155e75", textAlign: "left", padding: "6pt 8pt", border: "1px solid #ddd" };
const tdBold = { ...tdStyle, fontWeight: "bold", backgroundColor: "#f0f9ff" };
const h2Style = { fontSize: "13pt", color: "#155e75", marginTop: "16pt", borderBottom: "1px solid #ddd", paddingBottom: "3px" };

export default function ReportPreview({ patient, vitals, scales, interventions }) {
  const latestVitals = vitals[0];
  const latestScale = scales[0];

  // ECK trend data for chart
  const eckChartData = [...scales]
    .sort((a, b) => new Date(a.assessment_date || a.created_date) - new Date(b.assessment_date || b.created_date))
    .slice(-10)
    .map((s) => ({
      fecha: format(new Date(s.assessment_date || s.created_date), "dd/MM HH:mm", { locale: es }),
      puntaje: s.total_score ?? 0,
    }));

  // Saved automatic records from vitals (those that have notes or techniques)
  const autoRecords = vitals.filter((v) => v.record_date).slice(0, 10);

  return (
    <div style={{ fontFamily: "'Calibri', sans-serif", color: "#1a1a1a", fontSize: "11pt" }}>
      <h1 style={{ fontSize: "16pt", color: "#0e7490", borderBottom: "2px solid #0e7490", paddingBottom: "4px" }}>
        REGISTRO CLÍNICO KINESIOLÓGICO
      </h1>
      <p style={{ color: "#666", fontSize: "9pt", marginTop: "4px" }}>
        Fecha de emisión: {format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
      </p>

      {/* 1. Patient Info */}
      <h2 style={h2Style}>1. Identificación del Paciente</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8pt", fontSize: "10pt" }}>
        <tbody>
          <tr>
            <td style={tdBold}>Nombre</td>
            <td style={tdStyle}>{patient.full_name}</td>
            <td style={tdBold}>RUT</td>
            <td style={tdStyle}>{patient.rut || "—"}</td>
          </tr>
          <tr>
            <td style={tdBold}>Edad</td>
            <td style={tdStyle}>{patient.age || "—"} años</td>
            <td style={tdBold}>Sexo</td>
            <td style={tdStyle}>{patient.gender || "—"}</td>
          </tr>
          <tr>
            <td style={tdBold}>Cama</td>
            <td style={tdStyle}>{patient.bed_number || "—"}</td>
            <td style={tdBold}>Servicio</td>
            <td style={tdStyle}>{patient.service || "—"}</td>
          </tr>
          <tr>
            <td style={tdBold}>Diagnóstico</td>
            <td colSpan="3" style={tdStyle}>{patient.diagnosis || "—"}</td>
          </tr>
          <tr>
            <td style={tdBold}>Médico Tratante</td>
            <td style={tdStyle}>{patient.attending_physician || "—"}</td>
            <td style={tdBold}>Ingreso</td>
            <td style={tdStyle}>{formatDateShort(patient.admission_date)}</td>
          </tr>
        </tbody>
      </table>

      {/* 2. Latest Vital Signs */}
      <h2 style={h2Style}>2. Signos Vitales {latestVitals ? `(${formatDate(latestVitals.record_date)})` : ""}</h2>
      {latestVitals ? (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8pt", fontSize: "10pt" }}>
          <thead>
            <tr>
              <th style={thStyle}>Parámetro</th><th style={thStyle}>Valor</th>
              <th style={thStyle}>Parámetro</th><th style={thStyle}>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...tdStyle, fontWeight: "bold" }}>FC</td>
              <td style={tdStyle}>{latestVitals.heart_rate || "—"} lpm</td>
              <td style={{ ...tdStyle, fontWeight: "bold" }}>PA</td>
              <td style={tdStyle}>{latestVitals.systolic_bp || "—"}/{latestVitals.diastolic_bp || "—"} mmHg</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: "bold" }}>SpO₂</td>
              <td style={tdStyle}>{latestVitals.spo2 || "—"}%</td>
              <td style={{ ...tdStyle, fontWeight: "bold" }}>FR</td>
              <td style={tdStyle}>{latestVitals.respiratory_rate || "—"} rpm</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: "bold" }}>T°</td>
              <td style={tdStyle}>{latestVitals.temperature || "—"} °C</td>
              <td style={{ ...tdStyle, fontWeight: "bold" }}>FiO₂</td>
              <td style={tdStyle}>{latestVitals.fio2 || "—"}%</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: "bold" }}>GCS</td>
              <td style={tdStyle}>{latestVitals.gcs || "—"}/15</td>
              <td style={{ ...tdStyle, fontWeight: "bold" }}>EVA</td>
              <td style={tdStyle}>{latestVitals.pain_scale || "—"}/10</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, fontWeight: "bold" }}>Soporte O₂</td>
              <td colSpan="3" style={tdStyle}>{oxygenLabels[latestVitals.oxygen_support] || "—"}
                {latestVitals.cnaf_flow ? ` — Flujo CNAF: ${latestVitals.cnaf_flow} lpm` : ""}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p style={{ color: "#999", fontStyle: "italic" }}>Sin registros de signos vitales</p>
      )}

      {/* 3. ECK Scale */}
      <h2 style={h2Style}>3. Evaluación ECK {latestScale ? `(${formatDate(latestScale.assessment_date || latestScale.created_date)})` : ""}</h2>
      {latestScale ? (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8pt", fontSize: "10pt" }}>
            <thead>
              <tr>
                <th style={thStyle}>Dimensión</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Puntaje</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Estado de Conciencia", latestScale.consciousness_dimension],
                ["Carga Ventilatoria", latestScale.ventilatory_dimension],
                ["Dispositivos y Drenajes", latestScale.devices_dimension],
                ["Movilidad Funcional", latestScale.mobility_dimension],
              ].map(([dim, score]) => {
                const val = score != null && score !== "" ? Number(score) : null;
                return (
                  <tr key={dim}>
                    <td style={tdStyle}>{dim}</td>
                    <td style={{ ...tdStyle, textAlign: "center", fontWeight: "bold" }}>{val != null ? val : "—"}/3</td>
                  </tr>
                );
              })}
              <tr style={{ backgroundColor: "#f0f9ff" }}>
                <td style={{ ...tdStyle, fontWeight: "bold" }}>TOTAL</td>
                <td style={{ ...tdStyle, textAlign: "center", fontWeight: "bold", fontSize: "12pt" }}>{latestScale.total_score}/12</td>
              </tr>
            </tbody>
          </table>
          {latestScale.notes && <p style={{ marginTop: "4pt", fontSize: "10pt" }}><strong>Observaciones:</strong> {latestScale.notes}</p>}
        </>
      ) : (
        <p style={{ color: "#999", fontStyle: "italic" }}>Sin evaluaciones de escalas</p>
      )}

      {/* ECK Trend Chart */}
      {eckChartData.length >= 2 && (
        <>
          <h2 style={h2Style}>4. Tendencia ECK</h2>
          <div style={{ marginTop: "8pt" }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={eckChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="fecha" tick={{ fontSize: 9 }} />
                <YAxis domain={[0, 12]} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Line type="monotone" dataKey="puntaje" stroke="#0e7490" strokeWidth={2} dot={{ r: 4 }} name="Puntaje ECK" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* 5. Saved Automatic Records */}
      {autoRecords.length > 0 && (
        <>
          <h2 style={{ ...h2Style, marginTop: "20pt" }}>{eckChartData.length >= 2 ? "5" : "4"}. Registros Clínicos Guardados</h2>
          <div style={{ marginTop: "8pt" }}>
            {autoRecords.map((v, idx) => {
              // Find the most recent scale before or at this record's date
              const recordDate = new Date(v.record_date);
              const scaleAtTime = [...scales]
                .filter((s) => new Date(s.assessment_date || s.created_date) <= recordDate)
                .sort((a, b) => new Date(b.assessment_date || b.created_date) - new Date(a.assessment_date || a.created_date))[0] || null;

              const form = {
                heart_rate: v.heart_rate || "", systolic_bp: v.systolic_bp || "",
                diastolic_bp: v.diastolic_bp || "", spo2: v.spo2 || "",
                respiratory_rate: v.respiratory_rate || "", temperature: v.temperature || "",
                fio2: v.fio2 || "", oxygen_support: v.oxygen_support || "",
                pain_scale: v.pain_scale || "",
                notes: v.notes || "", cnaf_flow: v.cnaf_flow || "",
                flujo_naricera: v.flujo_naricera || "",
                ventilatory_mode: v.ventilatory_mode || "",
                ruido_pulmonar: v.ruido_pulmonar || "",
                ruido_pulmonar_zona: v.ruido_pulmonar_zona || "",
                ruidos_agregados: v.ruidos_agregados || "",
                irox: v.irox || "", pam: v.pam || "", ikctv: v.ikctv || "",
                gcs: v.gcs || "", sas: v.sas || "", s5q: v.s5q || "",
                fss_icu: v.fss_icu || "",
                apreciacion_inicial: v.apreciacion_inicial || "",
                sopor_level: v.sopor_level || "",
                colaboracion: v.colaboracion || "",
                apremio_ventilatorio: v.apremio_ventilatorio || "",
                mecanismo_tos: v.mecanismo_tos || "",
                caracteristicas_tos: v.caracteristicas_tos || "",
                secreciones: v.secreciones || "",
                fuerza_muscular: v.fuerza_muscular || "",
                rom: v.rom || "", pto: v.pto || "",
                asistencia_transiciones: v.asistencia_transiciones || "",
                evaluacion_estado_general: v.evaluacion_estado_general || "",
                posicion_cama: v.posicion_cama || "",
                tolerancia: v.tolerancia || "",
                porcentaje_fc_rut: v.porcentaje_fc_rut || "",
                disnea: v.disnea || "", ssf: v.ssf || "",
                tono_muscular: v.tono_muscular || "",
                sensibilidad: v.sensibilidad || "",
                observaciones_neurologicas: v.observaciones_neurologicas || "",
                observacion_inicial: v.observacion_inicial || "",
                observacion_final: v.observacion_final || "",
                oxygen_support_final: v.oxygen_support_final || "",
                cnaf_flow_final: v.cnaf_flow_final || "",
                irox_final: v.irox_final || "",
                observaciones_vent: v.observaciones_vent || "",
                observaciones_ausc: v.observaciones_ausc || "",
                ruido_pulmonar_loc: v.ruido_pulmonar_loc || "",
                ruidos_agregados_loc: v.ruidos_agregados_loc || "{}",
                fuerza_muscular_loc: v.fuerza_muscular_loc || "",
                rom_loc: v.rom_loc || "",
                sedente_comentario: v.sedente_comentario || "",
                bipedo_comentario: v.bipedo_comentario || "",
                marcha_comentario: v.marcha_comentario || "",
                tos_provocada_comentario: v.tos_provocada_comentario || "",
                tos_asistida_comentario: v.tos_asistida_comentario || "",
                tos_dirigida_comentario: v.tos_dirigida_comentario || "",
              };

              const text = generateClinicalRecord({
                patient,
                form,
                techniques: v.techniques || [],
                latestScale: scaleAtTime,
                now: recordDate,
              });

              return (
                <div key={v.id} style={{ marginBottom: "12pt", padding: "10pt", border: "1px solid #e5e7eb", borderRadius: "4pt", backgroundColor: "#fafafa" }}>
                  <p style={{ fontSize: "9pt", color: "#0e7490", fontWeight: "bold", marginBottom: "6pt" }}>
                    Registro #{autoRecords.length - idx} — {formatDate(v.record_date)}
                  </p>
                  <pre style={{ fontSize: "9pt", fontFamily: "inherit", whiteSpace: "pre-wrap", margin: 0, lineHeight: "1.6" }}>
                    {text}
                  </pre>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ marginTop: "40pt", borderTop: "1px solid #ddd", paddingTop: "10pt", display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: "9pt", color: "#666" }}>
          <p>____________________________</p>
          <p>Firma Kinesiólogo(a)</p>
        </div>
        <div style={{ fontSize: "9pt", color: "#666", textAlign: "right" }}>
          <p>Generado por ECKapp</p>
          <p>{format(new Date(), "dd/MM/yyyy HH:mm")}</p>
        </div>
      </div>
    </div>
  );
}