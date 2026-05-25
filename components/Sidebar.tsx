import { BriefcaseBusiness, Building2, FileText, Landmark, MessageSquareText, Scale, Search, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { AGENCY_PRESETS, formatPresetLimit, type AgencyPreset } from '@/lib/presets';
import { ZONES } from '@/lib/zones';

interface SidebarProps {
  selectedAgency: string;
  onSelectAgency: (agency: string) => void;
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

export function Sidebar({ selectedAgency, onSelectAgency }: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAgencies = AGENCY_PRESETS.filter(agency =>
    agency.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside
      data-zone={ZONES.PRESET}
      aria-label="Preset"
      className="w-72 bg-[#101D2D] h-full flex flex-col border-r border-[#1e3a5f]"
    >
      <div className="p-4 lg:p-5 border-b border-[#1e3a5f]">
        <h1 className="text-[16px] lg:text-[18px] font-[700] text-white mb-1">
          행정PDF 규격기
        </h1>
        <p className="text-[11px] lg:text-[12px] text-[#94a3b8]">
          Government PDF Formatter
        </p>
      </div>

      <div className="p-3 lg:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" strokeWidth={2} />
          <input
            type="text"
            placeholder="기관 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1e3a5f] border border-[#334155] rounded-[4px] text-[13px] lg:text-[14px] text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {filteredAgencies.map(agency => {
          const Icon = getPresetIcon(agency);
          const isSelected = selectedAgency === agency.id;

          return (
            <button
              key={agency.id}
              onClick={() => onSelectAgency(agency.id)}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-[4px] transition-all text-left
                ${isSelected
                  ? 'bg-[#3b82f6] text-white shadow-lg'
                  : 'text-[#cbd5e1] hover:bg-[#1e3a5f] hover:text-white'
                }
              `}
            >
              <div className={`
                w-8 h-8 rounded-[4px] flex items-center justify-center flex-shrink-0
                ${isSelected ? 'bg-white/20' : 'bg-[#1e3a5f]'}
              `}>
                <Icon className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] lg:text-[14px] font-[600]">
                  {agency.name}
                </div>
                <div className={`text-[10px] lg:text-[11px] ${isSelected ? 'text-white/80' : 'text-[#64748B]'}`}>
                  {formatPresetLimit(agency)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3 lg:p-4 border-t border-[#1e3a5f]">
        <div className="flex items-center gap-2 text-[#64748B] text-[10px] lg:text-[11px]">
          <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
          <span>로컬 처리 모드</span>
        </div>
      </div>
    </aside>
  );
}

export { AGENCY_PRESETS as AGENCIES };
