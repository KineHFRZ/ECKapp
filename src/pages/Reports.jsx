const db = globalThis.__B44_DB__;

import { useState, useRef } from "react";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Eye } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import PatientSelector from "@/components/shared/PatientSelector";
import ReportPreview from "@/components/reports/ReportPreview";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Reports() {
  const [patientId, setPatientId] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const reportRef = useRef(null);

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => db.entities.Patient.list(),
  });
  const { data: vitals = [] } = useQuery({
    queryKey: ["vitals"],
    queryFn: () => db.entities.VitalSigns.list("-created_date"),
  });
  const { data: scales = [] } = useQuery({
    queryKey: ["scales"],
    queryFn: () => db.entities.ScaleAssessment.list("-created_date"),
  });
  const { data: interventions = [] } = useQuery({
    queryKey: ["interventions"],
    queryFn: () => db.entities.Intervention.list("-created_date"),
  });

  const patient = patients.find((p) => p.id === patientId);
  const patientVitals = vitals.filter((v) => v.patient_id === patientId);
  const patientScales = scales.filter((s) => s.patient_id === patientId);
  const patientInterventions = interventions.filter((i) => i.patient_id === patientId);

  const handleExport = () => {
    if (!reportRef.current) return;

    const content = reportRef.current.innerHTML;
    const styles = `
      <style>
        body { font-family: 'Calibri', sans-serif; margin: 2cm; color: #1a1a1a; font-size: 11pt; }
        h1 { font-size: 16pt; color: #0e7490; border-bottom: 2px solid #0e7490; padding-bottom: 4px; }
        h2 { font-size: 13pt; color: #155e75; margin-top: 16pt; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
        h3 { font-size: 11pt; color: #333; margin-top: 10pt; }
        table { width: 100%; border-collapse: collapse; margin: 8pt 0; font-size: 10pt; }
        th { background-color: #f0f9ff; color: #155e75; text-align: left; padding: 6pt 8pt; border: 1px solid #ddd; }
        td { padding: 5pt 8pt; border: 1px solid #ddd; }
        .header-info { display: flex; justify-content: space-between; margin-bottom: 12pt; }
        .section { margin-bottom: 14pt; }
        .badge { display: inline-block; padding: 2pt 8pt; border-radius: 4pt; font-size: 9pt; font-weight: bold; }
      </style>
    `;

    const blob = new Blob(
      [`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8">${styles}</head><body>${content}</body></html>`],
      { type: "application/msword" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Registro_Clinico_${patient?.full_name?.replace(/\s/g, "_") || "paciente"}_${format(new Date(), "yyyy-MM-dd")}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Registro exportado");
  };

  const handleGenerate = () => {
    if (!patientId) { toast.error("Selecciona un paciente"); return; }
    setShowPreview(true);
  };

  return (
    <div>
      <PageHeader title="Registro Clínico" subtitle="Genera y exporta registros clínicos estandarizados" />

      <div className="max-w-4xl space-y-6">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <PatientSelector value={patientId} onChange={(v) => { setPatientId(v); setShowPreview(false); }} />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleGenerate} variant="outline" className="gap-2">
                  <Eye className="w-4 h-4" /> Vista Previa
                </Button>
                {showPreview && (
                  <Button onClick={handleExport} className="gap-2">
                    <FileDown className="w-4 h-4" /> Exportar Word
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {showPreview && patient && (
          <Card className="border-border/50">
            <CardContent className="p-8">
              <div ref={reportRef}>
                <ReportPreview
                  patient={patient}
                  vitals={patientVitals}
                  scales={patientScales}
                  interventions={patientInterventions}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}