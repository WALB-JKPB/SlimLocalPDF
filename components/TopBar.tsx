import { File, FileText, HardDrive } from 'lucide-react';
import { ZONES } from '@/lib/zones';

interface TopBarProps {
  fileName: string | null;
  currentPages: number | null;
  currentSize: number | null;
  onMenuClick: () => void;
}

export function TopBar({ fileName, currentPages, currentSize }: TopBarProps) {
  return (
    <section
      data-zone={ZONES.CURRENT_FILE_INFO}
      aria-label="Current file info"
      className="bg-white rounded-[4px] border border-[#e2e8f0] px-4 py-3"
    >
      <div className="flex w-full min-w-0 items-center gap-2 lg:gap-4">

        <div className="flex min-w-0 max-w-full items-center gap-1.5 lg:gap-2">
          <File className="w-3.5 h-3.5 lg:w-4 lg:h-4 flex-shrink-0 text-[#64748B]" strokeWidth={2} />
          <div className="min-w-0">
            <div className="text-[9px] lg:text-[10px] text-[#64748B] font-[500]">파일</div>
            <div className="max-w-full truncate text-[11px] lg:text-[13px] text-[#101D2D] font-[600]">
              {fileName || '선택 안 됨'}
            </div>
          </div>
        </div>

        <div className="w-px h-5 flex-shrink-0 bg-[#e2e8f0]" />

        <div className="flex items-center gap-1.5 lg:gap-2 flex-shrink-0">
          <FileText className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#64748B]" strokeWidth={2} />
          <div>
            <div className="text-[9px] lg:text-[10px] text-[#64748B] font-[500]">페이지</div>
            <div className="text-[11px] lg:text-[13px] text-[#101D2D] font-[600]">
              {currentPages != null ? `${currentPages} 쪽` : '- 쪽'}
            </div>
          </div>
        </div>

        <div className="w-px h-5 bg-[#e2e8f0]" />

        <div className="flex items-center gap-1.5 lg:gap-2 flex-shrink-0">
          <HardDrive className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#64748B]" strokeWidth={2} />
          <div>
            <div className="text-[9px] lg:text-[10px] text-[#64748B] font-[500]">용량</div>
            <div className="text-[11px] lg:text-[13px] text-[#101D2D] font-[600]">
              {currentSize != null ? `${currentSize.toFixed(1)} MB` : '- MB'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
