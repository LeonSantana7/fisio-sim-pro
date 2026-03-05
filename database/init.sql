-- FisioSim Pro - Database Init Script
-- PostgreSQL 16+
-- UTF-8 encoding

SET client_encoding = 'UTF8';

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===================================================================
-- 1. USERS / DEVICES
-- ===================================================================
CREATE TABLE IF NOT EXISTS devices (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_key  TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent  TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email        TEXT UNIQUE,
    name         TEXT,
    role         TEXT NOT NULL DEFAULT 'fisioterapeuta'
                     CHECK (role IN ('fisioterapeuta','residente','estudante','admin')),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================================
-- 2. CALCULADORAS E ESCALAS
-- ===================================================================
CREATE TABLE IF NOT EXISTS calculator_categories (
    id          TEXT PRIMARY KEY,
    label       TEXT NOT NULL,
    color       TEXT NOT NULL DEFAULT '#38bdf8',
    icon        TEXT,
    sort_order  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS calculators (
    id          TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES calculator_categories(id),
    short_name  TEXT NOT NULL,
    full_name   TEXT NOT NULL,
    description TEXT NOT NULL,
    formula     TEXT NOT NULL,
    icon        TEXT NOT NULL DEFAULT 'calc',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    references  JSONB DEFAULT '[]',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_scales (
    id           TEXT PRIMARY KEY,
    short_name   TEXT NOT NULL,
    full_name    TEXT NOT NULL,
    description  TEXT NOT NULL,
    icon         TEXT NOT NULL DEFAULT 'chart',
    scoring_note TEXT,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    groups       JSONB NOT NULL DEFAULT '[]',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================================
-- 3. FAVORITOS
-- ===================================================================
CREATE TABLE IF NOT EXISTS favorites (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id   UUID REFERENCES devices(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id)   ON DELETE CASCADE,
    tool_id     TEXT NOT NULL,
    tool_type   TEXT NOT NULL CHECK (tool_type IN ('calculator','scale')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT favorites_unique_device UNIQUE (device_id, tool_id, tool_type),
    CONSTRAINT favorites_unique_user   UNIQUE (user_id,   tool_id, tool_type),
    CONSTRAINT favorites_owner CHECK (device_id IS NOT NULL OR user_id IS NOT NULL)
);

-- ===================================================================
-- 4. HISTORICO DE CALCULOS
-- ===================================================================
CREATE TABLE IF NOT EXISTS calculation_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id       UUID REFERENCES devices(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id)   ON DELETE CASCADE,
    tool_id         TEXT NOT NULL,
    tool_type       TEXT NOT NULL CHECK (tool_type IN ('calculator','scale')),
    input_values    JSONB NOT NULL,
    result_value    TEXT NOT NULL,
    result_unit     TEXT,
    result_level    TEXT,
    interpretation  TEXT,
    calculated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT history_owner CHECK (device_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_calc_history_device ON calculation_history(device_id);
CREATE INDEX IF NOT EXISTS idx_calc_history_user   ON calculation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_calc_history_tool   ON calculation_history(tool_id);
CREATE INDEX IF NOT EXISTS idx_calc_history_date   ON calculation_history(calculated_at DESC);

-- ===================================================================
-- 5. PROTOCOLOS CLINICOS
-- ===================================================================
CREATE TABLE IF NOT EXISTS protocols (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    full_name       TEXT NOT NULL,
    icd10           TEXT NOT NULL,
    icf             TEXT,
    category        TEXT NOT NULL,
    definition      TEXT NOT NULL,
    evidence_level  TEXT NOT NULL DEFAULT '1A',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS protocol_criteria (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id  TEXT NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
    type         TEXT NOT NULL CHECK (type IN ('required','optional','exclusion')),
    domain       TEXT NOT NULL,
    description  TEXT NOT NULL,
    operator     TEXT,
    threshold    NUMERIC,
    unit         TEXT,
    sort_order   INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS protocol_targets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id     TEXT NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL,
    formula         TEXT,
    threshold_min   NUMERIC,
    threshold_max   NUMERIC,
    unit            TEXT NOT NULL,
    alert_level     TEXT NOT NULL CHECK (alert_level IN ('green','yellow','red')),
    sort_order      INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS protocol_sources (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id  TEXT NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
    type         TEXT NOT NULL CHECK (type IN ('guideline','rct','meta-analysis','consensus','review')),
    title        TEXT NOT NULL,
    authors      TEXT NOT NULL,
    journal      TEXT NOT NULL,
    year         INTEGER NOT NULL,
    doi          TEXT,
    sort_order   INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS protocol_decision_flow (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id  TEXT NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
    step_number  INTEGER NOT NULL,
    step_text    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_criteria_protocol ON protocol_criteria(protocol_id);
CREATE INDEX IF NOT EXISTS idx_targets_protocol  ON protocol_targets(protocol_id);
CREATE INDEX IF NOT EXISTS idx_sources_protocol  ON protocol_sources(protocol_id);
CREATE INDEX IF NOT EXISTS idx_flow_protocol     ON protocol_decision_flow(protocol_id, step_number);

-- ===================================================================
-- 6. SIMULADOR DE VENTILACAO MECANICA
-- ===================================================================
CREATE TABLE IF NOT EXISTS vent_scenarios (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    description  TEXT NOT NULL,
    compliance   NUMERIC NOT NULL,
    resistance   NUMERIC NOT NULL,
    rr           INTEGER NOT NULL,
    tidal_volume NUMERIC NOT NULL,
    fio2         NUMERIC NOT NULL,
    peep         NUMERIC NOT NULL,
    ie_ratio     NUMERIC NOT NULL DEFAULT 0.5,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS vent_simulation_sessions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id    UUID REFERENCES devices(id) ON DELETE CASCADE,
    user_id      UUID REFERENCES users(id)   ON DELETE CASCADE,
    scenario_id  TEXT REFERENCES vent_scenarios(id),
    mode         TEXT NOT NULL CHECK (mode IN ('VCV','PCV')),
    parameters   JSONB NOT NULL,
    metrics      JSONB NOT NULL,
    duration_sec INTEGER,
    started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at     TIMESTAMPTZ,
    CONSTRAINT sim_owner CHECK (device_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_sim_sessions_device ON vent_simulation_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_sim_sessions_user   ON vent_simulation_sessions(user_id);

-- ===================================================================
-- 7. SEEDS - CATEGORIAS
-- ===================================================================
INSERT INTO calculator_categories (id, label, color, sort_order) VALUES
('oxigenacao',   'Oxigenacao',  '#38bdf8', 1),
('ventilatoria', 'Ventilatoria','#34d399', 2),
('mecanica',     'Mecanica',    '#a78bfa', 3),
('gasometria',   'Gasometria',  '#fb923c', 4),
('desmame',      'Desmame',     '#fbbf24', 5),
('escalas',      'Escalas',     '#f472b6', 6)
ON CONFLICT (id) DO NOTHING;

-- ===================================================================
-- 8. SEEDS - CALCULADORAS
-- ===================================================================
INSERT INTO calculators (id, category_id, short_name, full_name, description, formula, icon) VALUES
('pf_ratio',      'oxigenacao',   'P/F Ratio',     'Relacao PaO2/FiO2',                       'Indice de oxigenacao arterial.', 'P/F = PaO2 / FiO2', 'lung'),
('pao2_ideal',    'oxigenacao',   'PaO2 Ideal',    'PaO2 Ideal por FiO2',                     'Estima a PaO2 esperada.', 'PaO2 ideal = FiO2 x 500', 'air'),
('pbw',           'ventilatoria', 'Peso Predito',  'Peso Corporal Predito (PBW)',              'Base do VT protetor.', 'M: 50 + 0.91*(H-152.4)', 'weight'),
('aa_gradient',   'oxigenacao',   'Grad. A-a O2',  'Gradiente Alveolo-arterial de O2',        'Diferenca PaO2 alveolar vs arterial.', 'P(A-a) = PAO2 - PaO2', 'micro'),
('tobin',         'desmame',      'Ind. de Tobin', 'IRRS - Indice de Tobin',                  'Relacao FR/VT.', 'IRRS = FR / VT', 'chart'),
('static_comp',   'mecanica',     'Compl. Estat.', 'Complacencia Estatica',                   'Capacidade de distensao.', 'Cst = VT / (Pplat - PEEP)', 'bubble'),
('driving',       'mecanica',     'Driving Press', 'Driving Pressure (DP)',                   'Estressor mecanico.', 'DP = Pplat - PEEP', 'bolt'),
('rox',           'desmame',      'Indice ROX',    'Indice ROX (HFNO)',                        'Prediz falha da OAF.', 'ROX = (SpO2/FiO2) / FR', 'wave')
ON CONFLICT (id) DO NOTHING;

-- ===================================================================
-- 9. SEEDS - CENARIOS
-- ===================================================================
INSERT INTO vent_scenarios (id, name, description, compliance, resistance, rr, tidal_volume, fio2, peep) VALUES
('normal',        'Pulmao Normal',   'Mecanica normal.', 60, 5,  14, 500, 0.21,  5),
('sdra_moderada', 'SDRA Moderada',   'P/F 100-200.',   25, 10, 20, 400, 0.60, 10)
ON CONFLICT (id) DO NOTHING;

-- ===================================================================
-- 10. SEEDS - PROTOCOLOS
-- ===================================================================
INSERT INTO protocols (id, name, full_name, icd10, icf, category, definition, evidence_level) VALUES
('sdra',    'SDRA',               'Sindrome do Desconforto Respiratorio Agudo',  'J80',   'b4401', 'Ventilacao Mecanica', 'Edema pulmonar inflamatorio.', '1A'),
('desmame', 'Desmame Ventilatorio','Protocolo de Desmame',                        'Z99.1','b440',  'Extubacao', 'Retirada do suporte.', '1A')
ON CONFLICT (id) DO NOTHING;

INSERT INTO protocol_criteria (protocol_id, type, domain, description, sort_order) VALUES
('sdra','required', 'Tempo',   'Inicio agudo dentro de 1 semana', 1),
('sdra','required', 'P/F',     'P/F Leve 200-300 mmHg', 4)
ON CONFLICT DO NOTHING;

-- ===================================================================
-- 11. TRIGGERS
-- ===================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_protocols_updated_at ON protocols;
CREATE TRIGGER trg_protocols_updated_at
    BEFORE UPDATE ON protocols
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
