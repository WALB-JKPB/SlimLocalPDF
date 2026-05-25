"use client";

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { adsConfig, hasAdSlot } from '@/lib/ads';
import type { AppCopy } from '@/lib/i18n';

interface AdBannerProps {
  position: 'top' | 'bottom' | 'side';
}

export function AdBanner({ position }: AdBannerProps) {
  const slotId =
    position === 'top' ? adsConfig.topSlotId : position === 'bottom' ? adsConfig.bottomSlotId : adsConfig.sideSlotId;
  const canRenderAd = hasAdSlot(slotId);

  useEffect(() => {
    if (!canRenderAd) return;
    try {
      ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ||= []).push({});
    } catch {
      // Ad blockers or script load timing can reject ad initialization.
    }
  }, [canRenderAd, slotId]);

  if (!canRenderAd) return null;

  if (position === 'side') {
    return (
      <aside className="pointer-events-none fixed bottom-6 left-6 top-6 z-10 hidden w-[160px] xl:block">
        <div className="pointer-events-auto sticky top-6 h-[600px] overflow-hidden">
          <ins
            className="adsbygoogle block h-full w-full"
            data-ad-client={adsConfig.clientId}
            data-ad-slot={slotId}
            data-ad-format="auto"
          />
        </div>
      </aside>
    );
  }

  return (
    <div className={`mx-auto w-full max-w-2xl px-4 lg:px-5 ${position === 'top' ? 'pt-3' : 'pb-3'}`}>
      <div className="h-[52px] overflow-hidden">
        <ins
          className="adsbygoogle block h-full w-full"
          data-ad-client={adsConfig.clientId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}

interface ProcessingAdModalProps {
  open: boolean;
  onClose: () => void;
  copy: AppCopy;
}

export function ProcessingAdModal({ open, onClose, copy }: ProcessingAdModalProps) {
  const canRenderAd = hasAdSlot(adsConfig.modalSlotId);

  useEffect(() => {
    if (!open || !canRenderAd) return;
    try {
      ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ||= []).push({});
    } catch {
      // Ad blockers or script load timing can reject ad initialization.
    }
  }, [canRenderAd, open]);

  if (!open || !canRenderAd) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101D2D]/35 px-4">
      <div className="w-full max-w-sm rounded-[4px] border border-[#e2e8f0] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
          <div>
            <div className="text-[13px] font-[700] text-[#101D2D]">{copy.processingModalTitle}</div>
            <div className="text-[11px] font-[600] text-[#64748B]">{copy.processingModalBody}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[#64748B] hover:bg-[#f1f5f9]"
            aria-label={copy.closeAdModal}
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <div className="p-4">
          <div className="h-[220px] overflow-hidden">
            <ins
              className="adsbygoogle block h-full w-full"
              data-ad-client={adsConfig.clientId}
              data-ad-slot={adsConfig.modalSlotId}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
