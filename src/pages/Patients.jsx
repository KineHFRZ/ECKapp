const db = globalThis.__B44_DB__;

import { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Search, ChevronDown, ChevronUp } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import PatientDetailPanel from "@/components/patients/PatientDetailPanel";
import { toast } from "sonner";

const emptyPatient = {
  full_name: "", rut: "", age: "", gender: "", diagnosis: "",
  bed_number: "", service: "", admission_date: "", attending_physician: "",
};

export default function Patients() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyPatient);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: () => db.entities.Patient.list("-created_date"),
  });

  const createMut = useMutation({
    mutationFn: (data) => db.entities.Patient.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setOpen(false);
      setForm(emptyPatient);
      toast.success("Paciente creado");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => db.entities.Patient.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente eliminado");
    },
  });

  const filtered = patients.filter((p) =>
    p.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    createMut.mutate({ ...form, age: form.age ? Number(form.age) : undefined });
  };

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div>
      <PageHeader
        title="Pacientes"
        subtitle="Gestión de pacientes hospitalizados"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Nuevo Paciente</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Paciente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <Label>Nombre completo *</Label>
                    <Input value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>RUT</Label>
                    <Input value={form.rut} onChange={(e) => updateField("rut", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Edad</Label>
                    <Input type="number" value={form.age} onChange={(e) => updateField("age", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sexo</Label>
                    <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cama</Label>
                    <Input value={form.bed_number} onChange={(e) => updateField("bed_number", e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Diagnóstico</Label>
                    <Input value={form.diagnosis} onChange={(e) => updateField("diagnosis", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Servicio</Label>
                    <Input value={form.service} onChange={(e) => updateField("service", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Médico Tratante</Label>
                    <Input value={form.attending_physician} onChange={(e) => updateField("attending_physician", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fecha Ingreso</Label>
                    <Input type="date" value={form.admission_date} onChange={(e) => updateField("admission_date", e.target.value)} />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createMut.isPending}>
                  {createMut.isPending ? "Guardando..." : "Guardar Paciente"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 bg-card"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No se encontraron pacientes</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Card key={p.id} className="border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <button
                    className="flex-1 text-left"
                    onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  >
                    <h3 className="font-semibold text-foreground">{p.full_name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{p.diagnosis || "Sin diagnóstico"}</p>
                  </button>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost" size="icon"
                      className="text-muted-foreground hover:text-primary"
                      onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    >
                      {expandedId === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteMut.mutate(p.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
                  {p.rut && <div><span className="text-muted-foreground">RUT:</span> {p.rut}</div>}
                  {p.age && <div><span className="text-muted-foreground">Edad:</span> {p.age}</div>}
                  {p.bed_number && <div><span className="text-muted-foreground">Cama:</span> {p.bed_number}</div>}
                  {p.service && <div><span className="text-muted-foreground">Servicio:</span> {p.service}</div>}
                </div>
                {expandedId === p.id && (
                  <div className="border-t border-border/40 mt-4">
                    <PatientDetailPanel patient={p} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}