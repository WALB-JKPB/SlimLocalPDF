export type AnalyticsResult = 'success' | 'over_target' | 'failed' | 'original_kept';
export type AnalyticsNUpMode = '1in1' | '2in1' | '4in1';

type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;

const GA_MEASUREMENT_ID = 'G-7ZC6GBRBKV';
const SESSION_PROCESS_COUNT_KEY = 'slimlocalpdf.process_count_session';

export const analyticsConfig = {
  measurementId: GA_MEASUREMENT_ID,
  enabled: process.env.NODE_ENV === 'production',
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function sendEvent(name: string, params: AnalyticsParams = {}) {
  if (!analyticsConfig.enabled || typeof window === 'undefined' || !window.gtag) return;

  const sanitizedParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value != null),
  );

  window.gtag('event', name, sanitizedParams);
}

export function bucketFileSizeMB(sizeMB: number | null | undefined) {
  if (sizeMB == null || !Number.isFinite(sizeMB)) return 'unknown';
  if (sizeMB < 1) return 'under_1mb';
  if (sizeMB < 3) return '1_3mb';
  if (sizeMB < 5) return '3_5mb';
  if (sizeMB < 10) return '5_10mb';
  if (sizeMB < 15) return '10_15mb';
  if (sizeMB < 20) return '15_20mb';
  if (sizeMB < 30) return '20_30mb';
  if (sizeMB < 50) return '30_50mb';
  if (sizeMB < 100) return '50_100mb';
  if (sizeMB < 300) return '100_300mb';
  return 'over_300mb';
}

export function bucketPageCount(pages: number | null | undefined) {
  if (pages == null || !Number.isFinite(pages) || pages < 1) return 'unknown';
  if (pages === 1) return '1';
  if (pages <= 5) return '2_5';
  if (pages <= 10) return '6_10';
  if (pages <= 20) return '11_20';
  if (pages <= 50) return '21_50';
  if (pages <= 100) return '51_100';
  return 'over_100';
}

export function bucketCompressionRatio(originalSizeMB: number | null, outputSizeMB: number | null) {
  if (
    originalSizeMB == null ||
    outputSizeMB == null ||
    !Number.isFinite(originalSizeMB) ||
    !Number.isFinite(outputSizeMB) ||
    originalSizeMB <= 0
  ) {
    return 'unknown';
  }

  if (outputSizeMB >= originalSizeMB) return 'increased';

  const reductionPercent = ((originalSizeMB - outputSizeMB) / originalSizeMB) * 100;
  if (reductionPercent < 10) return 'under_10_percent';
  if (reductionPercent < 30) return '10_30_percent';
  if (reductionPercent < 50) return '30_50_percent';
  if (reductionPercent < 70) return '50_70_percent';
  if (reductionPercent < 90) return '70_90_percent';
  return 'over_90_percent';
}

export function bucketTargetMissRatio(outputSizeMB: number | null, targetSizeMB: number | null) {
  if (
    outputSizeMB == null ||
    targetSizeMB == null ||
    !Number.isFinite(outputSizeMB) ||
    !Number.isFinite(targetSizeMB) ||
    targetSizeMB <= 0
  ) {
    return 'unknown';
  }

  if (outputSizeMB <= targetSizeMB) return 'met_target';

  const missPercent = ((outputSizeMB - targetSizeMB) / targetSizeMB) * 100;
  if (missPercent <= 5) return 'within_5_percent';
  if (missPercent <= 10) return '5_10_percent';
  if (missPercent <= 25) return '10_25_percent';
  if (missPercent <= 50) return '25_50_percent';
  if (missPercent <= 100) return '50_100_percent';
  return 'over_100_percent';
}

export function bucketPageTargetMiss(outputPages: number | null, targetPages: number | null) {
  if (targetPages == null) return 'no_page_limit';
  if (
    outputPages == null ||
    !Number.isFinite(outputPages) ||
    !Number.isFinite(targetPages) ||
    targetPages < 1
  ) {
    return 'unknown';
  }

  const missPages = outputPages - targetPages;
  if (missPages <= 0) return 'met_target';
  if (missPages === 1) return 'over_by_1';
  if (missPages <= 5) return 'over_by_2_5';
  if (missPages <= 10) return 'over_by_6_10';
  if (missPages <= 50) return 'over_by_11_50';
  return 'over_by_50_plus';
}

export function getNUpMode(nUp: number): AnalyticsNUpMode {
  if (nUp >= 4) return '4in1';
  if (nUp >= 2) return '2in1';
  return '1in1';
}

export function getCurrentSessionProcessCount() {
  if (typeof window === 'undefined') return 0;
  const value = Number(window.sessionStorage.getItem(SESSION_PROCESS_COUNT_KEY) || '0');
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function incrementSessionProcessCount() {
  if (typeof window === 'undefined') return 0;
  const next = getCurrentSessionProcessCount() + 1;
  window.sessionStorage.setItem(SESSION_PROCESS_COUNT_KEY, String(next));
  return next;
}

export function trackPdfUploadSelected(params: {
  originalSizeMB: number | null;
  originalPages: number | null;
}) {
  sendEvent('pdf_upload_selected', {
    original_size_bucket: bucketFileSizeMB(params.originalSizeMB),
    original_page_bucket: bucketPageCount(params.originalPages),
    process_count_session: getCurrentSessionProcessCount(),
  });
}

export function trackPresetSelected(params: {
  presetId: string;
  targetSizeMB: number | null;
  targetPages: number | null;
}) {
  sendEvent('preset_selected', {
    preset_id: params.presetId,
    target_mb: params.targetSizeMB,
    target_pages: params.targetPages,
    has_page_limit: params.targetPages != null,
    process_count_session: getCurrentSessionProcessCount(),
  });
}

export function trackCompressionStarted(params: {
  nUpMode: AnalyticsNUpMode;
  targetSizeMB: number | null;
  targetPages: number | null;
  processCountSession: number;
}) {
  sendEvent('compression_started', {
    nup_mode: params.nUpMode,
    target_mb: params.targetSizeMB,
    target_pages: params.targetPages,
    has_page_limit: params.targetPages != null,
    process_count_session: params.processCountSession,
  });
}

export function trackCompressionCompleted(params: {
  result: AnalyticsResult;
  nUpMode: AnalyticsNUpMode;
  originalSizeMB: number | null;
  originalPages: number | null;
  targetSizeMB: number | null;
  targetPages: number | null;
  outputSizeMB: number | null;
  outputPages: number | null;
  processCountSession: number;
}) {
  sendEvent('compression_completed', {
    result: params.result,
    nup_mode: params.nUpMode,
    original_size_bucket: bucketFileSizeMB(params.originalSizeMB),
    original_page_bucket: bucketPageCount(params.originalPages),
    target_mb: params.targetSizeMB,
    target_pages: params.targetPages,
    output_size_bucket: bucketFileSizeMB(params.outputSizeMB),
    output_page_bucket: bucketPageCount(params.outputPages),
    compression_ratio_bucket: bucketCompressionRatio(params.originalSizeMB, params.outputSizeMB),
    target_miss_ratio_bucket: bucketTargetMissRatio(params.outputSizeMB, params.targetSizeMB),
    page_target_miss_bucket: bucketPageTargetMiss(params.outputPages, params.targetPages),
    process_count_session: params.processCountSession,
  });
}

export function trackDownloadClicked(params: {
  result: AnalyticsResult;
  outputSizeMB: number | null;
  outputPages: number | null;
  processCountSession: number;
}) {
  sendEvent('download_clicked', {
    result: params.result,
    output_size_bucket: bucketFileSizeMB(params.outputSizeMB),
    output_page_bucket: bucketPageCount(params.outputPages),
    process_count_session: params.processCountSession,
  });
}

export function trackSaveGuideOpened(browser: string) {
  sendEvent('save_guide_opened', {
    browser,
    process_count_session: getCurrentSessionProcessCount(),
  });
}
