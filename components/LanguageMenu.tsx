import Link from 'next/link';
import { Languages } from 'lucide-react';
import { localeOptions, type Locale } from '@/lib/i18n';

interface LanguageMenuProps {
  currentLocale: Locale;
}

export function LanguageMenu({ currentLocale }: LanguageMenuProps) {
  return (
    <details className="relative">
      <summary
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-[4px] border border-[#d8e0ea] bg-white text-[#64748B] transition-colors hover:border-[#0052CC] hover:text-[#0052CC] [&::-webkit-details-marker]:hidden"
        aria-label="Change language"
      >
        <Languages className="h-4 w-4" strokeWidth={2.2} />
      </summary>
      <div className="absolute right-0 top-10 z-40 w-48 overflow-hidden rounded-[4px] border border-[#d8e0ea] bg-white shadow-lg">
        {localeOptions.map((locale) => {
          const href = locale.id === 'ko' ? '/ko' : `/${locale.id}`;
          const isCurrent = locale.id === currentLocale;

          return (
            <Link
              key={locale.id}
              href={href}
              className={`flex items-center justify-between px-3 py-2 text-[12px] font-[700] transition-colors ${
                isCurrent
                  ? 'bg-[#EAF2FF] text-[#0052CC]'
                  : 'text-[#334155] hover:bg-[#f8fafc] hover:text-[#0052CC]'
              }`}
            >
              <span>{locale.label}</span>
              <span className="text-[10px] text-[#94A3B8]">{locale.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </details>
  );
}
