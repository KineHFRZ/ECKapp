import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const dimensionConfig = [
  { key: "consciousness_dimension", label: "Conciencia", color: "#0ea5e9" },
  { key: "ventilatory_dimension", label: "Ventilatoria", color: "#10b981" },
  { key: "devices_dimension", label: "Dispositivos", color: "#f59e0b" },
  { key: "mobility_dimension", label: "Movilidad", color: "#8b5cf6" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">{p.value}/3</span>
        </div>
      ))}
    </div>
  );
};

const TotalTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="font-bold text-primary">{payload[0]?.value}/12 pts</p>
    </div>
  );
};

export default function ScaleEvolutionChart({ assessments, patientId }) {
  const filtered = assessments
    .filter((a) => a.patient_id === patientId)
    .slice(0, 10)
    .reverse();

  if (filtered.length < 2) {
    return (
      <div className="text-center py-8 text-xs text-muted-foreground">
        Se necesitan al menos 2 evaluaciones para mostrar evolución
      </div>
    );
  }

  const data = filtered.map((a) => ({
    fecha: format(new Date(a.assessment_date || a.created_date), "dd/MM HH:mm", { locale: es }),
    Conciencia: a.consciousness_dimension ?? 0,
    Ventilatoria: a.ventilatory_dimension ?? 0,
    Dispositivos: a.devices_dimension ?? 0,
    Movilidad: a.mobility_dimension ?? 0,
    Total: a.total_score ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Dimensions chart */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Evolución por Dimensión</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "11px" }} />
            {dimensionConfig.map((d) => (
              <Line
                key={d.key}
                type="monotone"
                dataKey={d.label}
                stroke={d.color}
                strokeWidth={2}
                dot={{ r: 3, fill: d.color }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Total score chart */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Evolución Puntaje Total ECK</p>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 12]} ticks={[0, 3, 8, 12]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<TotalTooltip />} />
            <ReferenceLine y={3} stroke="#22c55e" strokeDasharray="4 2" strokeWidth={1} />
            <ReferenceLine y={8} stroke="#eab308" strokeDasharray="4 2" strokeWidth={1} />
            <Line
              type="monotone"
              dataKey="Total"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#0ea5e9" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 text-[10px] text-muted-foreground mt-1 justify-end">
          <span className="flex items-center gap-1"><span className="w-4 h-px bg-green-500 inline-block" /> Leve ≤3</span>
          <span className="flex items-center gap-1"><span className="w-4 h-px bg-yellow-500 inline-block" /> Moderada ≤8</span>
        </div>
      </div>
    </div>
  );
}