import { cn } from "@/lib/utils";

function getResult(totalScore) {
  if (totalScore <= 4) return {
    frequency: 1,
    level: "leve",
    label: "Asistencia Kinésica Leve, requiere 1 atención en 24 hrs",
    color: "text-green-700 bg-green-50 border-green-300",
    barColor: "bg-green-500",
  };
  if (totalScore <= 8) return {
    frequency: 2,
    level: "moderada",
    label: "Asistencia Kinésica Moderada, requiere 2 atenciones en 24 hrs",
    color: "text-yellow-700 bg-yellow-50 border-yellow-300",
    barColor: "bg-yellow-500",
  };
  return {
    frequency: 3,
    level: "severa",
    label: "Asistencia Kinésica Severa, requiere 3 o más atenciones en 24 hrs",
    color: "text-red-700 bg-red-50 border-red-300",
    barColor: "bg-red-500",
  };
}

export { getResult };

export default function ScaleResult({ totalScore }) {
  const result = getResult(totalScore);
  const pct = Math.round((totalScore / 12) * 100);

  return (
    <div className={cn("rounded-2xl border-2 p-6", result.color)}>
      {/* Score */}
      <div className="text-center mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Puntaje Total</p>
        <div className="flex items-end justify-center gap-1">
          <span className="text-6xl font-black">{totalScore}</span>
          <span className="text-2xl font-semibold opacity-60 mb-1">/12</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 rounded-full bg-black/10 overflow-hidden mb-5">
        <div
          className={cn("h-full rounded-full transition-all duration-500", result.barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Level */}
      <div className="text-center mb-5 pb-5 border-b border-current/10">
        <p className="text-xs opacity-70 mb-1">Nivel de Asistencia</p>
        <p className="text-base font-bold leading-tight">{result.label}</p>
      </div>

      {/* Frequency */}
      <div className="text-center">
        <p className="text-xs opacity-70 mb-1">Atenciones en 24 hrs</p>
        <p className="text-5xl font-black">{result.frequency}</p>
        {result.level === "severa" && (
          <p className="text-xs font-semibold mt-1 opacity-80">o más</p>
        )}
      </div>
    </div>
  );
}