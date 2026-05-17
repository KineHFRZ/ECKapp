import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import PatientSelector from "@/components/shared/PatientSelector";
import ScalesSection from "@/components/records/ScalesSection";
import VitalSignsSection from "@/components/records/VitalSignsSection";
import { Card, CardContent } from "@/components/ui/card";

const initialScores = { consciousness_dimension: null, ventilatory_dimension: null, devices_dimension: null, mobility_dimension: null };

export default function Records() {
  const [patientId, setPatientId] = useState("");
  const [eckScores, setEckScores] = useState(initialScores);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader title="Registros Clínicos" subtitle="Escala ECK y signos vitales del paciente" />

      <Card className="border-border/50">
        <CardContent className="p-6">
          <PatientSelector value={patientId} onChange={setPatientId} />
        </CardContent>
      </Card>

      <VitalSignsSection patientId={patientId} eckScores={eckScores} onEckScoresChange={setEckScores} />
    </div>
  );
}