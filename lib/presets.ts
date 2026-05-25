export interface AgencyPreset {
  id: string;
  name: string;
  limit: number;
  maxPages: number | null;
}

export const AGENCY_PRESETS = [
  { id: 'ecourt', name: '전자소송', limit: 20, maxPages: null },
  { id: 'sotong24', name: '소통24', limit: 10, maxPages: null },
  { id: 'wetax', name: '위택스', limit: 10, maxPages: null },
  { id: 'openInfo', name: '정보공개포털', limit: 10, maxPages: null },
  { id: 'patentRoad', name: '특허로', limit: 30, maxPages: null },
  { id: 'g2b', name: '나라장터', limit: 300, maxPages: null },
  { id: 'work24', name: '고용24', limit: 15, maxPages: null },
  { id: 'nps', name: '국민연금', limit: 10, maxPages: null },
] satisfies AgencyPreset[];

export function formatPresetLimit(preset: AgencyPreset) {
  return preset.maxPages == null ? `${preset.limit}MB` : `${preset.limit}MB · ${preset.maxPages}장`;
}
