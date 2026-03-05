export type FieldType = 'number' | 'select' | 'scale';

export interface CalculatorField {
    key: string;
    label: string;
    type: FieldType;
    unit?: string;
    placeholder?: string;
    defaultValue?: number | string;
    min?: number;
    max?: number;
    step?: number;
    options?: { value: string | number; label: string }[];
    hint?: string;
}

export interface ScaleOption {
    value: number;
    label: string;
    description?: string;
}

export interface ScaleGroup {
    name: string;
    key: string;
    options: ScaleOption[];
}

export interface CalculatorResult {
    value: number | string;
    unit?: string;
    interpretation?: string;
    level?: 'normal' | 'mild' | 'moderate' | 'severe' | 'critical';
    extra?: Record<string, string | number>;
}

export type CalculatorCategory =
    | 'oxigenacao'
    | 'ventilacao'
    | 'mecanica'
    | 'gasometria'
    | 'escalas'
    | 'desmame';

export interface Calculator {
    id: string;
    name: string;
    shortName: string;
    category: CalculatorCategory;
    description: string;
    icon: string;
    formula: string;
    formulaLatex?: string;
    fields: CalculatorField[];
    scaleGroups?: ScaleGroup[];
    calculate: (inputs: Record<string, number>) => CalculatorResult;
    references?: string[];
}
