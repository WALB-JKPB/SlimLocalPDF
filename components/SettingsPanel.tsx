import { useState } from 'react';
import { AlertCircle, CheckCircle2, Download, Settings, Upload, Info, Play, Loader2, X } from 'lucide-react';
import { formatText, type AppCopy } from '@/lib/i18n';
import { ZONES } from '@/lib/zones';

export type ProcessingStage =
  | 'idle'
  | 'validating'
  | 'analyzing'
  | 'layout'
  | 'compressing'
  | 'finalizing'
  | 'done'
  | 'error';

export interface SettingsPanelProps {
  maxSizeMB: number | null;
  maxPages: number | null;
  onMaxSizeChange: (size: number | null) => void;
  onMaxPagesChange: (pages: number | null) => void;
  currentPages: number | null;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  isProcessing: boolean;
  onStart: () => void;
  canStart?: boolean;
  startDisabledReason?: string | null;
  progress: number;
  stage?: ProcessingStage;
  stageDetail?: string | null;
  fileError?: string | null;
  copy: AppCopy;
}

function useSettingsState(props: SettingsPanelProps) {
  const pages = props.currentPages ?? 0;
  const maxPages = props.maxPages ?? 0;
  const pagesPerSheet =
    maxPages > 0 && pages > maxPages ? Math.ceil(pages / maxPages) : 1;
  const resultPages = maxPages > 0 && pages > maxPages ? maxPages : pages;
  const safeMaxSizeMB = props.maxSizeMB != null && Number.isFinite(props.maxSizeMB) ? props.maxSizeMB : 0.1;
  const safeMaxPages = props.maxPages != null && Number.isFinite(props.maxPages) ? props.maxPages : 1;
  const hasPageLimit = props.maxPages != null;

  return { pagesPerSheet, resultPages, safeMaxSizeMB, safeMaxPages, hasPageLimit };
}

/** Zone 3: upload-file */
export function UploadFileZone({
  selectedFile,
  onFileSelect,
  fileError,
  currentPages,
  currentSize,
  copy,
}: Pick<SettingsPanelProps, 'selectedFile' | 'onFileSelect' | 'fileError' | 'currentPages'> & {
  currentSize: number | null;
  copy: AppCopy;
}) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validatePdfFile = async (file: File) => {
    const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf');
    const hasPdfType =
      file.type === '' ||
      file.type === 'application/pdf' ||
      file.type === 'application/x-pdf';

    if (!hasPdfExtension || !hasPdfType) {
      return false;
    }

    const headerBytes = await file.slice(0, 5).arrayBuffer();
    const header = new TextDecoder().decode(headerBytes);
    return header === '%PDF-';
  };

  const selectPdfFile = async (file: File | null) => {
    if (!file) return;

    const isPdf = await validatePdfFile(file);

    if (!isPdf) {
      setUploadError(copy.pdfOnlyError);
      onFileSelect(null);
      return;
    }

    setUploadError(null);
    onFileSelect(file);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    await selectPdfFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    await selectPdfFile(e.dataTransfer.files?.[0] ?? null);
  };

  if (selectedFile) {
    return (
      <section
        data-zone={ZONES.UPLOAD_FILE}
        aria-label="Selected file"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex min-h-[124px] items-center overflow-hidden bg-white rounded-[4px] border-2 border-solid p-4 transition-[min-height,padding,border-color,background-color] duration-300 ease-out lg:min-h-[132px] lg:p-5 ${
          isDragging ? 'border-[#0052CC] bg-[#F5F9FF]' : 'border-[#cbd5e1]'
        }`}
      >
        <div className="flex w-full min-w-0 flex-col gap-3">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="w-full min-w-0">
              <div className="mb-1 text-[12px] lg:text-[13px] font-[700] text-[#64748B]">
                {copy.uploadSelectedTitle}
              </div>
              <div className="truncate text-[14px] lg:text-[15px] font-[700] leading-tight text-[#101D2D]">
                {selectedFile.name}
              </div>
              <div className="mt-1 text-[11px] font-[600] text-[#64748B]">
                {copy.uploadReplaceHint}
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-[4px] bg-[#F5F9FF] px-2 py-1 text-[10px] font-[800] text-[#0052CC]">
                <Info className="h-3 w-3" strokeWidth={2.2} />
                {copy.localOpenHint}
              </div>
            </div>

            <label className="cursor-pointer">
              <span
                className={`inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-2 text-[12px] lg:text-[13px] font-[700] transition-colors ${
                  isDragging
                    ? 'border-[#0052CC] bg-[#EAF2FF] text-[#0052CC]'
                    : 'border-[#cbd5e1] bg-[#f8fafc] text-[#64748B] hover:border-[#0052CC] hover:text-[#0052CC]'
                }`}
              >
                <Upload className="h-3.5 w-3.5" strokeWidth={2.2} />
                {copy.chooseAnotherPdf}
              </span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
          <div className="grid w-full grid-cols-2 gap-2">
            <div className="rounded-[4px] border border-[#d8e0ea] bg-[#f8fafc] px-3 py-2">
              <div className="mb-0.5 text-[10px] lg:text-[11px] font-[700] text-[#64748B]">
                {copy.pageCount}
              </div>
              <div className="text-[13px] lg:text-[14px] font-[700] text-[#101D2D]">
                {currentPages != null ? `${currentPages}${copy.pagesSuffix}` : `-${copy.pagesSuffix}`}
              </div>
            </div>
            <div className="rounded-[4px] border border-[#d8e0ea] bg-[#f8fafc] px-3 py-2">
              <div className="mb-0.5 text-[10px] lg:text-[11px] font-[700] text-[#64748B]">
                {copy.fileSize}
              </div>
              <div className="text-[13px] lg:text-[14px] font-[700] text-[#101D2D]">
                {currentSize != null ? currentSize.toFixed(2) : (selectedFile.size / 1024 / 1024).toFixed(2)}MB
              </div>
            </div>
          </div>
          {(uploadError || fileError) && (
            <div className="flex items-center gap-1.5 text-[11px] font-[600] text-[#B42318]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span>{uploadError || fileError}</span>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      data-zone={ZONES.UPLOAD_FILE}
      aria-label="Upload file"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`min-h-[192px] overflow-hidden rounded-[4px] border-2 border-dashed bg-white p-6 transition-[min-height,padding,border-color,background-color] duration-300 ease-out lg:min-h-[229px] lg:p-8 ${
        isDragging ? 'border-[#0052CC] bg-[#F5F9FF]' : 'border-[#cbd5e1]'
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-[#f1f5f9] rounded-[4px] flex items-center justify-center">
          <Upload className="w-6 h-6 lg:w-8 lg:h-8 text-[#64748B]" strokeWidth={2} />
        </div>
        <div className="text-center">
          <p className="text-[15px] lg:text-[16px] font-[600] text-[#101D2D] mb-1">
            {copy.uploadTitle}
          </p>
          <p className="text-[12px] lg:text-[13px] text-[#64748B] mb-3">
            {copy.uploadDescription}
          </p>
          <label className="cursor-pointer">
            <span className="inline-block px-5 py-2 lg:px-6 lg:py-2.5 bg-[#101D2D] text-white rounded-[4px] font-[600] text-[13px] lg:text-[14px] hover:bg-[#1e3a5f] transition-colors">
              {copy.chooseFile}
            </span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
          <p className="mx-auto mt-3 flex w-fit items-center justify-center gap-1.5 rounded-[4px] bg-[#F5F9FF] px-2.5 py-1.5 text-[10px] font-[800] text-[#0052CC]">
            <Info className="h-3 w-3" strokeWidth={2.2} />
            {copy.noUploadHint}
          </p>
          {(uploadError || fileError) && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-[600] text-[#B42318]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span>{uploadError || fileError}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Zone 6: submit */
export function SubmitZone({
  selectedFile,
  isProcessing,
  onStart,
  canStart,
  startDisabledReason,
  progress,
  stage,
  stageDetail,
  copy,
}: Pick<SettingsPanelProps, 'selectedFile' | 'isProcessing' | 'onStart' | 'canStart' | 'startDisabledReason' | 'progress' | 'stage' | 'stageDetail' | 'copy'>) {
  const stageLabel: Record<ProcessingStage, string> = {
    idle: copy.stageIdle,
    validating: copy.stageValidating,
    analyzing: copy.stageAnalyzing,
    layout: copy.stageLayout,
    compressing: copy.stageCompressing,
    finalizing: copy.stageFinalizing,
    done: copy.stageDone,
    error: copy.stageError,
  };
  const isDone = stage === 'done';
  const isStartDisabled = !selectedFile || canStart === false || isProcessing || isDone;

  return (
    <section data-zone={ZONES.SUBMIT} aria-label="Submit" className="space-y-2">
      {(isProcessing || isDone) && (
        <div className="space-y-2">
          <div className="w-full h-2.5 bg-[#e2e8f0] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${isDone ? 'bg-[#16A34A]' : 'bg-[#0052CC]'}`}
              style={{ width: `${isDone ? 100 : progress}%` }}
            />
          </div>
          <p className="text-[12px] text-center text-[#64748B] font-[600]">
            {stageLabel[stage || 'idle']}{isDone ? '' : '...'} {isDone ? '100%' : `${progress}%`}
          </p>
          {stageDetail && (
            <p className="text-center text-[11px] font-[600] leading-relaxed text-[#64748B]">
              {stageDetail}
            </p>
          )}
        </div>
      )}

      <div className="rounded-[4px] border border-[#B7D4FF] bg-[#F5F9FF] px-3 py-2.5 text-[11px] font-[700] leading-relaxed text-[#334155]">
        <p>
          {copy.trustNoteBefore}{' '}
          <a
            href="https://github.com/WALB-JKPB/SlimLocalPDF"
            target="_blank"
            rel="noreferrer"
            className="text-[#0052CC] underline-offset-2 hover:underline"
          >
            {copy.trustNoteLink}
          </a>
          {copy.trustNoteAfter}
        </p>
      </div>

      <button
        onClick={onStart}
        disabled={isStartDisabled}
        className={`
            w-full flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-[4px] transition-all shadow-lg
            ${isStartDisabled
              ? isDone
                ? 'bg-[#16A34A] text-white cursor-default shadow-none'
                : 'bg-[#cbd5e1] text-[#94a3b8] cursor-not-allowed shadow-none'
              : 'bg-[#0052CC] text-white hover:bg-[#0043a8] hover:shadow-xl active:scale-[0.98]'
            }
          `}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
            {copy.processing}
          </>
        ) : isDone ? (
          <>
            <CheckCircle2 className="w-5 h-5 shrink-0" strokeWidth={2.5} />
            <span className="text-[15px] lg:text-[16px] font-[700] leading-tight">
              {copy.done}
            </span>
          </>
        ) : (
          <>
            <Play className="w-5 h-5 shrink-0" strokeWidth={2.5} fill="currentColor" />
            <span className="flex flex-col items-center gap-0.5">
              <span className="text-[15px] lg:text-[16px] font-[700] leading-tight">
                {copy.start}
              </span>
              <span className="text-[11px] lg:text-[12px] font-[500] leading-tight text-white/80">
                {copy.startHint}
              </span>
            </span>
          </>
        )}
      </button>

      {!selectedFile && (
        <p className="text-[11px] text-center text-[#64748B]">
          {copy.uploadToStart}
        </p>
      )}
      {selectedFile && !isDone && !isProcessing && canStart === false && startDisabledReason && (
        <p className="text-[11px] text-center font-[600] text-[#B42318]">
          {startDisabledReason}
        </p>
      )}
      {isDone && (
        <p className="text-[11px] text-center font-[600] text-[#64748B]">
          {copy.resetAfterDone}
        </p>
      )}
    </section>
  );
}

interface ProcessingResultProps {
  downloadUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  error: string | null;
  notice: string | null;
  onDownload?: () => void;
  onSaveGuideOpen?: (browser: SaveGuideId) => void;
  copy: AppCopy;
}

type SaveGuideId = 'chrome' | 'edge' | 'safari' | 'firefox';

const SAVE_GUIDES: Array<{
  id: SaveGuideId;
  label: string;
  image: string;
  officialUrl: string;
}> = [
  {
    id: 'chrome',
    label: 'Chrome',
    image: '/save-guides/chrome.svg',
    officialUrl: 'https://support.google.com/chrome/answer/16215622',
  },
  {
    id: 'edge',
    label: 'Edge',
    image: '/save-guides/edge.svg',
    officialUrl: 'https://learn.microsoft.com/en-us/deployedge/microsoft-edge-pdf',
  },
  {
    id: 'safari',
    label: 'Safari',
    image: '/save-guides/safari.svg',
    officialUrl: 'https://support.apple.com/guide/iphone/ipha9ed5131c/ios',
  },
  {
    id: 'firefox',
    label: 'Firefox',
    image: '/save-guides/firefox.svg',
    officialUrl: 'https://support.mozilla.org/kb/view-pdf-files-firefox-or-choose-another-viewer',
  },
];

function detectSaveGuideId(): SaveGuideId {
  if (typeof navigator === 'undefined') return 'chrome';

  const userAgent = navigator.userAgent;

  if (userAgent.includes('Edg/')) return 'edge';
  if (userAgent.includes('Firefox/')) return 'firefox';
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) return 'safari';
  return 'chrome';
}

function SaveGuideDialog({
  open,
  activeGuideId,
  onActiveGuideChange,
  onClose,
  copy,
}: {
  open: boolean;
  activeGuideId: SaveGuideId;
  onActiveGuideChange: (id: SaveGuideId) => void;
  onClose: () => void;
  copy: AppCopy;
}) {
  if (!open) return null;

  const activeGuide = SAVE_GUIDES.find((guide) => guide.id === activeGuideId) || SAVE_GUIDES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101D2D]/40 px-4">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-[4px] border border-[#e2e8f0] bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#e2e8f0] px-4 py-3">
          <div>
            <div className="text-[14px] font-[800] text-[#101D2D]">{copy.saveGuideTitle}</div>
            <p className="mt-1 text-[11px] font-[600] leading-relaxed text-[#64748B]">
              {copy.saveGuideSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] text-[#64748B] hover:bg-[#f1f5f9]"
            aria-label={copy.closeSaveGuide}
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="max-h-[calc(88vh-64px)] overflow-y-auto p-4">
          <div className="mb-3 flex gap-1.5 overflow-x-auto">
            {SAVE_GUIDES.map((guide) => (
              <button
                key={guide.id}
                type="button"
                onClick={() => onActiveGuideChange(guide.id)}
                className={`h-8 shrink-0 rounded-[4px] border px-3 text-[12px] font-[800] transition-colors ${
                  activeGuide.id === guide.id
                    ? 'border-[#0052CC] bg-[#EAF2FF] text-[#0052CC]'
                    : 'border-[#d8e0ea] bg-white text-[#64748B] hover:border-[#0052CC] hover:text-[#0052CC]'
                }`}
              >
                {guide.label}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-[4px] border border-[#d8e0ea] bg-[#f8fafc]">
            <img
              src={activeGuide.image}
              alt={`${activeGuide.label} PDF preview save button`}
              className="block h-auto w-full"
            />
          </div>

          <div className="mt-3 rounded-[4px] border border-[#FEDF89] bg-[#FFFAEB] px-3 py-2.5 text-[11px] font-[700] leading-relaxed text-[#93370D]">
            {copy.saveGuideWarning}
          </div>

          <a
            href={activeGuide.officialUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex h-8 items-center rounded-[4px] border border-[#cbd5e1] px-3 text-[11px] font-[800] text-[#64748B] hover:border-[#0052CC] hover:text-[#0052CC]"
          >
            {activeGuide.label} {copy.officialGuide}
          </a>
        </div>
      </div>
    </div>
  );
}

export function ProcessingResult({
  downloadUrl,
  fileName,
  fileSize,
  error,
  notice,
  onDownload,
  onSaveGuideOpen,
  copy,
}: ProcessingResultProps) {
  const [saveGuideOpen, setSaveGuideOpen] = useState(false);
  const [activeSaveGuide, setActiveSaveGuide] = useState<SaveGuideId>(() => detectSaveGuideId());

  if (!downloadUrl && !error) return null;

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-[4px] border border-[#FDA29B] bg-[#FFFBFA] px-4 py-3 text-[12px] font-[600] text-[#B42318]">
        <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="rounded-[4px] border border-[#B7D4FF] bg-[#F5F9FF] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-[700] text-[#101D2D]">
            {fileName || copy.optimizedPdf}
          </p>
          <p className="text-[11px] font-[600] text-[#64748B]">
            {fileSize != null ? `${fileSize.toFixed(2)} MB` : copy.compressionDone}
          </p>
          {notice && (
            <p className="mt-1 text-[10px] font-[600] text-[#93370D]">
              {notice}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDownload}
          disabled={!onDownload}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-[4px] bg-[#0052CC] px-3 text-[12px] font-[700] text-white transition-colors hover:bg-[#0043a8]"
        >
          <Download className="h-4 w-4" strokeWidth={2.5} />
          {copy.download}
        </button>
      </div>
      <div className="mt-3 rounded-[4px] border border-[#FEDF89] bg-[#FFFAEB] px-3 py-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-[700] leading-relaxed text-[#93370D]">
            {copy.previewDownloadHint}
          </p>
          <button
            type="button"
            onClick={() => {
              setSaveGuideOpen(true);
              onSaveGuideOpen?.(activeSaveGuide);
            }}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-[4px] border border-[#F79009] bg-white px-3 text-[11px] font-[800] text-[#93370D] hover:bg-[#FFF7ED]"
          >
            {copy.showSaveLocation}
          </button>
        </div>
      </div>
      <SaveGuideDialog
        open={saveGuideOpen}
        activeGuideId={activeSaveGuide}
        copy={copy}
        onActiveGuideChange={(guideId) => {
          setActiveSaveGuide(guideId);
          onSaveGuideOpen?.(guideId);
        }}
        onClose={() => setSaveGuideOpen(false)}
      />
    </div>
  );
}

/** Zone 4: presize-control */
export function PresizeControlZone(props: SettingsPanelProps) {
  const { maxSizeMB, maxPages, onMaxSizeChange, onMaxPagesChange } = props;
  const { copy } = props;
  const { safeMaxSizeMB, safeMaxPages, hasPageLimit } = useSettingsState(props);

  const handleSizeStep = (delta: number) => {
    const next = Math.max(0.1, Math.round((safeMaxSizeMB + delta) * 10) / 10);
    onMaxSizeChange(next);
  };

  const handlePagesStep = (delta: number) => {
    const next = Math.max(1, safeMaxPages + delta);
    onMaxPagesChange(next);
  };

  return (
    <section
      data-zone={ZONES.PRESIZE_CONTROL}
      aria-label="Presize control"
      className="bg-white rounded-[4px] border border-[#e2e8f0] overflow-hidden"
    >
      <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-4 py-2.5 flex items-center gap-2">
        <Settings className="w-4 h-4 text-[#101D2D]" strokeWidth={2} />
        <h3 className="text-[14px] lg:text-[15px] font-[700] text-[#101D2D]">
          {copy.settingsTitle}
        </h3>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="min-w-0 rounded-[4px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
            <label className="block text-[12px] font-[700] text-[#101D2D] mb-2">
              {copy.targetSize}
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSizeStep(-0.1)}
                className="w-8 h-8 shrink-0 rounded-[4px] bg-[#0052CC] text-white text-[16px] font-[700] leading-none hover:bg-[#0043a8] active:scale-[0.98] transition-all"
              >
                -
              </button>
              <input
                type="number"
                step="0.1"
                value={maxSizeMB ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  onMaxSizeChange(value === '' ? null : Number(value));
                }}
                className="w-full min-w-0 px-2 py-1.5 border-2 border-[#e2e8f0] rounded-[4px] text-center text-[14px] font-[700] text-[#101D2D] [appearance:textfield] focus:outline-none focus:border-[#101D2D] focus:ring-2 focus:ring-[#101D2D]/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => handleSizeStep(0.1)}
                className="w-8 h-8 shrink-0 rounded-[4px] bg-[#0052CC] text-white text-[16px] font-[700] leading-none hover:bg-[#0043a8] active:scale-[0.98] transition-all"
              >
                +
              </button>
              <span className="text-[12px] font-[600] text-[#64748B] shrink-0">MB</span>
            </div>
          </div>

          <div className="min-w-0 rounded-[4px] border border-[#e2e8f0] bg-[#f8fafc] p-3 flex flex-col gap-2">
            <label className="block text-[12px] font-[700] text-[#101D2D] mb-2">
              {copy.targetPages}
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePagesStep(-1)}
                disabled={!hasPageLimit}
                className="w-8 h-8 shrink-0 rounded-[4px] bg-[#0052CC] text-white text-[16px] font-[700] leading-none transition-all hover:bg-[#0043a8] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#cbd5e1] disabled:text-[#94a3b8]"
              >
                -
              </button>
              <input
                type="number"
                value={maxPages ?? ''}
                placeholder={copy.none}
                onChange={(e) => {
                  const value = e.target.value;
                  onMaxPagesChange(value === '' ? null : Number(value));
                }}
                className="w-full min-w-0 px-2 py-1.5 border-2 border-[#e2e8f0] rounded-[4px] text-center text-[14px] font-[700] text-[#101D2D] [appearance:textfield] focus:outline-none focus:border-[#101D2D] focus:ring-2 focus:ring-[#101D2D]/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => handlePagesStep(1)}
                className="w-8 h-8 shrink-0 rounded-[4px] bg-[#0052CC] text-white text-[16px] font-[700] leading-none hover:bg-[#0043a8] active:scale-[0.98] transition-all"
              >
                +
              </button>
              <span className="text-[12px] font-[600] text-[#64748B] shrink-0">{copy.sheetsUnit}</span>
            </div>
            <button
              type="button"
              onClick={() => onMaxPagesChange(maxPages == null ? 5 : null)}
              className={`h-8 rounded-[4px] border px-3 text-[11px] font-[800] transition-colors ${
                maxPages == null
                  ? 'border-[#0052CC] bg-[#EAF2FF] text-[#0052CC]'
                  : 'border-[#cbd5e1] bg-white text-[#64748B] hover:border-[#0052CC] hover:text-[#0052CC]'
              }`}
            >
              {copy.noPageLimit}
            </button>

            <div className="flex items-start gap-1.5 rounded-[4px] border border-[#e2e8f0] bg-white px-2.5 py-2">
              <Info className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-[10px] text-[#64748B] leading-relaxed">
                {copy.targetHint}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AutoCalcResult(props: SettingsPanelProps) {
  const { selectedFile, currentPages, maxPages } = props;
  const { copy } = props;
  const { pagesPerSheet, resultPages } = useSettingsState(props);

  if (!selectedFile || currentPages == null || currentPages <= 0) return null;

  if (maxPages == null) {
    return (
      <div className="rounded-[4px] border border-[#cbd5e1] bg-[#f8fafc] p-4 text-[#101D2D]">
        <div className="text-[11px] lg:text-[12px] font-[600] text-[#64748B] mb-1.5">
          {copy.autoCalcTitle}
        </div>
        <p className="text-[14px] lg:text-[15px] font-[600] leading-relaxed">
          {formatText(copy.noPageLimitCalc, { pages: currentPages })}
        </p>
        <div className="mt-3 pt-3 border-t border-[#e2e8f0] flex items-center justify-between text-[12px] lg:text-[13px]">
          <span className="text-[#64748B]">{copy.expectedOutputPages}</span>
          <span className="text-[15px] lg:text-[16px] font-[700]">{currentPages}{copy.sheetsSuffix}</span>
        </div>
      </div>
    );
  }

  if (maxPages < 1) return null;

  return (
    <div className="rounded-[4px] border border-[#cbd5e1] bg-[#f8fafc] p-4 text-[#101D2D]">
      <div className="text-[11px] lg:text-[12px] font-[600] text-[#64748B] mb-1.5">
        {copy.autoCalcTitle}
      </div>
      <p className="text-[14px] lg:text-[15px] font-[600] leading-relaxed">
        {formatText(copy.nupCalc, { pages: currentPages, maxPages, pagesPerSheet })}
      </p>
      <div className="mt-3 pt-3 border-t border-[#e2e8f0] flex items-center justify-between text-[12px] lg:text-[13px]">
        <span className="text-[#64748B]">{copy.finalOutputPages}</span>
        <span className="text-[15px] lg:text-[16px] font-[700]">{resultPages}{copy.sheetsSuffix}</span>
      </div>
    </div>
  );
}

export function getPagesPerSheet(currentPages: number, maxPages: number) {
  return currentPages > maxPages ? Math.ceil(currentPages / maxPages) : 1;
}
