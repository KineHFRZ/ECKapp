import { db } from "@/api/base44Client";

import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

export default function PatientSelector({ value, onChange, label = "Paciente" }) {
  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => db.entities.Patient.list("-created_date"),
  });

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground/80">{label}</Label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger className="h-11 bg-card border-border">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <SelectValue placeholder="Seleccionar paciente..." />
          </div>
        </SelectTrigger>
        <SelectContent>
          {patients.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.full_name} {p.bed_number ? `— Cama ${p.bed_number}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}