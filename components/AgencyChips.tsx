import { BriefcaseBusiness, Building2, FileText, Landmark, MessageSquareText, Scale, Search, ShieldCheck } from 'lucide-react';
import type { AppCopy } from '@/lib/i18n';
import { AGENCY_PRESETS, formatPresetLimit, type AgencyPreset } from '@/lib/presets';
import { ZONES } from '@/lib/zones';

interface AgencyChipsProps {
  selectedAgency: string | null;
  onSelectAgency: (agency: string) => void;
  copy: AppCopy;
}

const presetIcons = {
  ecourt: Scale,
  sotong24: MessageSquareText,
  wetax: Landmark,
  openInfo: Search,
  patentRoad: ShieldCheck,
  g2b: Building2,
  work24: BriefcaseBusiness,
  nps: FileText,
} as const;

function getPresetIcon(preset: AgencyPreset) {
  return presetIcons[preset.id as keyof typeof presetIcons] || FileText;
}

export function AgencyChips({ selectedAgency, onSelectAgency, copy }: AgencyChipsProps) {
  return (
    <section
      data-zone={ZONES.PRESET}
      aria-label="Preset"
      className="bg-white rounded-[4px] border border-[#e2e8f0] p-4"
    >
      <div className="mb-2 px-1">
        <h3 className="text-[13px] font-[700] text-[#101D2D]">
          {copy.presetTitle}
        </h3>
        <p className="mt-1 text-[10px] font-[600] leading-relaxed text-[#64748B]">
          {copy.presetDescription}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {AGENCY_PRESETS.map(agency => {
          const Icon = getPresetIcon(agency);
          const isSelected = selectedAgency === agency.id;

          return (
            <button
              key={agency.id}
              onClick={() => onSelectAgency(agency.id)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-[4px] border-2 transition-all flex-shrink-0
                ${isSelected
                  ? 'bg-[#0052CC] border-[#0052CC] text-white shadow-md'
                  : 'bg-white border-[#e2e8f0] text-[#101D2D] hover:border-[#0052CC]'
                }
              `}
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              <div className="text-left">
                <div className="text-[12px] font-[700] whitespace-nowrap">
                  {agency.name}
                </div>
                <div className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[#64748B]'}`}>
                  {formatPresetLimit(agency)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export { AGENCY_PRESETS as AGENCIES };
