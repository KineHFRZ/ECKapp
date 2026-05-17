import { cn } from "@/lib/utils";

const levelColors = {
  0: "bg-green-500",
  1: "bg-yellow-500",
  2: "bg-orange-500",
  3: "bg-red-600",
};

export default function ScaleDimension({ label, description, value, onChange, criteria }) {
  return (
    <div className="p-5 rounded-xl bg-card border border-border/50 space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-semibold text-sm text-foreground">{label}</h4>
          <span className={cn(
            "text-xs font-bold px-2.5 py-0.5 rounded-full text-white",
            levelColors[value ?? 0]
          )}>
            {value ?? 0} / 3
          </span>
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>

      {/* Score buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={cn(
              "h-10 rounded-lg text-sm font-bold transition-all duration-200 border-2",
              value === level
                ? `${levelColors[level]} text-white border-transparent shadow-md`
                : "bg-muted text-muted-foreground border-transparent hover:border-primary/40"
            )}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Criteria table */}
      {criteria && (
        <div className="space-y-1.5">
          {criteria.map((text, idx) => (
            <div
              key={idx}
              onClick={() => onChange(idx)}
              className={cn(
                "flex gap-3 p-2.5 rounded-lg text-xs cursor-pointer transition-all border",
                value === idx
                  ? "border-primary/50 bg-primary/5 text-foreground"
                  : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-[10px]",
                levelColors[idx]
              )}>
                {idx}
              </span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}