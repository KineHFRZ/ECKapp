import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import ScalesSection from "@/components/records/ScalesSection";
import VitalSignsSection from "@/components/records/VitalSignsSection";

const initialScores = { consciousness_dimension: null, ventilatory_dimension: null, devices_dimension: null, mobility_dimension: null };

export default function Records() {
  const [patientId] = useState("");
  const [eckScores, setEckScores] = useState(initialScores);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader title="Registros Clínicos" subtitle="Escala ECK y signos vitales del paciente" />

      <VitalSignsSection patientId={patientId} eckScores={eckScores} onEckScoresChange={setEckScores} />
    </div>
  );
}