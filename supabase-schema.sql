-- ============================================================
-- Esquema para ECKapp en Supabase
-- Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Extensión para UUID auto-generados
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Tabla: Patient
-- ============================================================
CREATE TABLE public."Patient" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  rut TEXT,
  age INTEGER,
  gender TEXT,
  diagnosis TEXT,
  bed_number TEXT,
  service TEXT,
  admission_date TEXT,
  attending_physician TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Tabla: VitalSigns
-- ============================================================
CREATE TABLE public."VitalSigns" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  record_date TIMESTAMPTZ DEFAULT NOW(),
  heart_rate NUMERIC,
  systolic_bp NUMERIC,
  diastolic_bp NUMERIC,
  spo2 NUMERIC,
  respiratory_rate NUMERIC,
  temperature NUMERIC,
  fio2 NUMERIC,
  oxygen_support TEXT,
  cnaf_flow NUMERIC,
  irox NUMERIC,
  pain_scale NUMERIC,
  pam NUMERIC,
  ikctv NUMERIC,
  fss_icu NUMERIC,
  gcs NUMERIC,
  sas NUMERIC,
  s5q NUMERIC,
  fuerza_muscular TEXT,
  rom TEXT,
  pto TEXT,
  asistencia_transiciones TEXT,
  flujo_naricera NUMERIC,
  observacion_inicial TEXT,
  observacion_final TEXT,
  tolerancia TEXT,
  porcentaje_fc_rut NUMERIC,
  disnea NUMERIC,
  ssf NUMERIC,
  tono_muscular TEXT,
  sensibilidad TEXT,
   observaciones_neurologicas TEXT,
   apreciacion_inicial TEXT,
    estado_general TEXT,
    colaboracion TEXT,
    sopor_level TEXT,
   ventilatory_mode TEXT,
   apremio_ventilatorio TEXT,
   ruido_pulmonar TEXT,
   ruido_pulmonar_zona TEXT,
   ruidos_agregados TEXT,
   mecanismo_tos TEXT,
   caracteristicas_tos TEXT,
   secreciones TEXT,
   evaluacion_estado_general TEXT,
   posicion_cama TEXT,
   fc_final NUMERIC,
   fr_final NUMERIC,
   spo2_final NUMERIC,
   fio2_final NUMERIC,
   flujo_o2_final NUMERIC,
   oxygen_support_final TEXT,
   cnaf_flow_final NUMERIC,
   irox_final NUMERIC,
   observaciones_vent TEXT,
   observaciones_ausc TEXT,
   ruido_pulmonar_loc TEXT,
   ruidos_agregados_loc TEXT,
   fuerza_muscular_loc TEXT,
   rom_loc TEXT,
   sedente_comentario TEXT,
   bipedo_comentario TEXT,
   marcha_comentario TEXT,
   tos_provocada_comentario TEXT,
   tos_asistida_comentario TEXT,
   tos_dirigida_comentario TEXT,
   distancia_recorrido TEXT,
   tipo_aspiracion TEXT,
   cantidad_aspiracion TEXT,
   techniques JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Tabla: ScaleAssessment
-- ============================================================
CREATE TABLE public."ScaleAssessment" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  assessment_date TIMESTAMPTZ DEFAULT NOW(),
  consciousness_dimension NUMERIC,
  ventilatory_dimension NUMERIC,
  devices_dimension NUMERIC,
  mobility_dimension NUMERIC,
  total_score NUMERIC,
  care_frequency NUMERIC,
  assistance_level TEXT,
  notes TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Tabla: Intervention
-- ============================================================
CREATE TABLE public."Intervention" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  intervention_date TIMESTAMPTZ DEFAULT NOW(),
  intervention_type TEXT NOT NULL,
  techniques JSONB DEFAULT '[]'::jsonb,
  duration_minutes NUMERIC,
  patient_tolerance TEXT,
  pre_intervention_notes TEXT,
  post_intervention_notes TEXT,
  objectives TEXT,
  plan TEXT,
  notes TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Migraciones para columnas faltantes (ejecutar en orden)
-- ============================================================

ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS fc_final NUMERIC;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS fr_final NUMERIC;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS spo2_final NUMERIC;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS fio2_final NUMERIC;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS flujo_o2_final NUMERIC;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS distancia_recorrido TEXT;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS tipo_aspiracion TEXT;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS cantidad_aspiracion TEXT;

-- ============================================================
-- Índices para búsquedas rápidas
-- ============================================================
CREATE INDEX idx_vitalsigns_patient ON public."VitalSigns" (patient_id);
CREATE INDEX idx_vitalsigns_date ON public."VitalSigns" (created_date DESC);
CREATE INDEX idx_scaleassessment_patient ON public."ScaleAssessment" (patient_id);
CREATE INDEX idx_intervention_patient ON public."Intervention" (patient_id);

-- ============================================================
-- Row Level Security (RLS) — acceso público sin autenticación
-- ============================================================
ALTER TABLE public."Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VitalSigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ScaleAssessment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Intervention" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso público Patient" ON public."Patient"
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Acceso público VitalSigns" ON public."VitalSigns"
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Acceso público ScaleAssessment" ON public."ScaleAssessment"
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Acceso público Intervention" ON public."Intervention"
  FOR ALL USING (true) WITH CHECK (true);

-- Migración: nuevas columnas para Inspección General y Observación Final
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS colaboracion TEXT;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS sopor_level TEXT;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS oxygen_support_final TEXT;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS cnaf_flow_final NUMERIC;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS irox_final NUMERIC;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS observaciones_vent TEXT;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS observaciones_ausc TEXT;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS ruido_pulmonar_loc TEXT;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS ruidos_agregados_loc TEXT;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS fuerza_muscular_loc TEXT;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS rom_loc TEXT;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS sedente_comentario TEXT;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS bipedo_comentario TEXT;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS marcha_comentario TEXT;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS tos_provocada_comentario TEXT;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS tos_asistida_comentario TEXT;
ALTER TABLE public."VitalSigns" ADD COLUMN IF NOT EXISTS tos_dirigida_comentario TEXT;
