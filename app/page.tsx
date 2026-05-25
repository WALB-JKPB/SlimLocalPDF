"use client";

import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { AGENCIES } from "@/components/AgencyChips";
import { AdBanner, ProcessingAdModal } from "@/components/AdSlots";
import { LanguageMenu } from "@/components/LanguageMenu";
import {
  UploadFileZone,
  SubmitZone,
  PresizeControlZone,
  AutoCalcResult,
  ProcessingResult,
  type ProcessingStage,
  type SettingsPanelProps,
} from "@/components/SettingsPanel";
import { AgencyChips } from "@/components/AgencyChips";
import {
  getNUpMode,
  incrementSessionProcessCount,
  trackCompressionCompleted,
  trackCompressionStarted,
  trackDownloadClicked,
  trackPdfUploadSelected,
  trackPresetSelected,
  trackSaveGuideOpened,
  type AnalyticsResult,
} from "@/lib/analytics";
import { getCopy, type AppCopy, type Locale } from "@/lib/i18n";
import {
  compressPdfForTarget,
  createDownloadUrl,
  createProcessedFileName,
  triggerFileDownload,
  warmCompressionEngines,
  type CompressionResult,
  type ProgressUpdate,
} from "@/lib/pdfCompression";

type WorkerResponse =
  | { type: "progress"; update: ProgressUpdate }
  | { type: "success"; result: CompressionResult }
  | { type: "error"; message: string };

function getExpectedNUpMode(pageCount: number | null, maxPages: number | null) {
  if (pageCount == null || pageCount <= 0 || maxPages == null || maxPages <= 0 || pageCount <= maxPages) {
    return "1in1" as const;
  }

  return getNUpMode(Math.ceil(pageCount / maxPages));
}

function SeoSupportSection({ copy }: { copy: ReturnType<typeof getCopy> }) {
  const useCases = [
    { title: copy.useCaseGeneralTitle, body: copy.useCaseGeneralBody },
    { title: copy.useCaseTargetTitle, body: copy.useCaseTargetBody },
    { title: copy.useCasePagesTitle, body: copy.useCasePagesBody },
  ];
  const faqs = [
    { question: copy.faqUploadQuestion, answer: copy.faqUploadAnswer },
    { question: copy.faqGeneralQuestion, answer: copy.faqGeneralAnswer },
    { question: copy.faqTargetQuestion, answer: copy.faqTargetAnswer },
    { question: copy.faqPrintQuestion, answer: copy.faqPrintAnswer },
  ];

  return (
    <section className="space-y-5 pt-2 text-[#101D2D]" aria-labelledby="seo-support-title">
      <div className="border-t border-[#e2e8f0] pt-5">
        <h2 id="seo-support-title" className="text-[15px] font-[800] lg:text-[16px]">
          {copy.seoTitle}
        </h2>
        <p className="mt-2 text-[12px] font-[600] leading-relaxed text-[#64748B] lg:text-[13px]">
          {copy.seoBody}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {useCases.map((item) => (
          <article key={item.title} className="rounded-[4px] border border-[#e2e8f0] bg-white p-3">
            <h3 className="text-[12px] font-[800] text-[#101D2D]">{item.title}</h3>
            <p className="mt-1.5 text-[11px] font-[600] leading-relaxed text-[#64748B]">{item.body}</p>
          </article>
        ))}
      </div>

      <section className="space-y-2" aria-labelledby="faq-title">
        <h2 id="faq-title" className="text-[15px] font-[800] lg:text-[16px]">
          {copy.faqTitle}
        </h2>
        <div className="space-y-2">
          {faqs.map((faq) => (
            <details key={faq.question} className="rounded-[4px] border border-[#e2e8f0] bg-white px-3 py-2">
              <summary className="cursor-pointer text-[12px] font-[800] text-[#101D2D]">
                {faq.question}
              </summary>
              <p className="mt-2 text-[11px] font-[600] leading-relaxed text-[#64748B]">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </section>
  );
}

function compressPdfInWorker(
  file: File,
  targetSizeMB: number,
  maxPages: number | null,
  messages: AppCopy,
  onProgress: (update: ProgressUpdate) => void,
) {
  return new Promise<CompressionResult>((resolve, reject) => {
    if (typeof Worker === "undefined") {
      reject(new Error("Web Worker is not available."));
      return;
    }

    let worker: Worker;

    try {
      worker = new Worker(new URL("../lib/pdfProcessor.worker.ts", import.meta.url), {
        type: "module",
      });
    } catch (error) {
      reject(error);
      return;
    }

    const cleanup = () => worker.terminate();

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;

      if (message.type === "progress") {
        onProgress(message.update);
        return;
      }

      cleanup();

      if (message.type === "success") {
        resolve(message.result);
      } else {
        reject(new Error(message.message));
      }
    };

    worker.onerror = (event) => {
      cleanup();
      reject(new Error(event.message || "PDF worker failed."));
    };

    worker.postMessage({ file, targetSizeMB, maxPages, messages });
  });
}

interface PdfToolPageProps {
  locale: Locale;
  showKoreanPresets: boolean;
  defaultSelectedAgency: string | null;
  defaultMaxSizeMB: number;
  defaultMaxPages: number | null;
}

export function PdfToolPage({
  locale,
  showKoreanPresets,
  defaultSelectedAgency,
  defaultMaxSizeMB,
  defaultMaxPages,
}: PdfToolPageProps) {
  const copy = getCopy(locale);
  const [selectedAgency, setSelectedAgency] = useState<string | null>(defaultSelectedAgency);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentPages, setCurrentPages] = useState<number | null>(null);
  const [currentSize, setCurrentSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>("idle");
  const [processingDetail, setProcessingDetail] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);
  const [processNotice, setProcessNotice] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [processedName, setProcessedName] = useState<string | null>(null);
  const [processedSize, setProcessedSize] = useState<number | null>(null);
  const [processedPages, setProcessedPages] = useState<number | null>(null);
  const [lastAnalyticsResult, setLastAnalyticsResult] = useState<AnalyticsResult | null>(null);
  const [lastProcessCountSession, setLastProcessCountSession] = useState(0);
  const [showProcessingAd, setShowProcessingAd] = useState(false);

  const currentAgency = AGENCIES.find((a) => a.id === selectedAgency);
  const [maxSizeMB, setMaxSizeMB] = useState<number | null>(currentAgency?.limit ?? defaultMaxSizeMB);
  const [maxPages, setMaxPages] = useState<number | null>(currentAgency ? currentAgency.maxPages : defaultMaxPages);
  const hasValidMaxSize = maxSizeMB != null && Number.isFinite(maxSizeMB) && maxSizeMB > 0;
  const hasValidMaxPages = maxPages == null || (Number.isFinite(maxPages) && maxPages >= 1);
  const canStart = Boolean(selectedFile) && hasValidMaxSize && hasValidMaxPages;
  const startDisabledReason = !hasValidMaxSize
    ? copy.invalidSize
    : maxPages != null && !hasValidMaxPages
      ? copy.invalidPages
      : null;

  useEffect(() => {
    warmCompressionEngines();

    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const clearProcessedResult = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
    setDownloadUrl(null);
    setProcessedName(null);
    setProcessedSize(null);
    setProcessedPages(null);
    setLastAnalyticsResult(null);
    setProcessError(null);
    setProcessNotice(null);
    setProcessingStage("idle");
    setProcessingDetail(null);
  };

  const resetProcessingStateForSettingsChange = () => {
    setProcessError(null);
    setProcessingStage("idle");
    setProcessingDetail(null);
    setProgress(0);
  };

  const handleAgencySelect = (agencyId: string) => {
    const agency = AGENCIES.find((a) => a.id === agencyId);
    if (!agency) return;
    resetProcessingStateForSettingsChange();
    setSelectedAgency(agencyId);
    setMaxSizeMB(agency.limit);
    setMaxPages(agency.maxPages);
    trackPresetSelected({
      presetId: agencyId,
      targetSizeMB: agency.limit,
      targetPages: agency.maxPages,
    });
  };

  const handleMaxSizeChange = (size: number | null) => {
    resetProcessingStateForSettingsChange();
    setMaxSizeMB(size);
    setSelectedAgency(null);
  };

  const handleMaxPagesChange = (pages: number | null) => {
    resetProcessingStateForSettingsChange();
    setMaxPages(pages);
    setSelectedAgency(null);
  };

  const handleFileSelect = async (file: File | null) => {
    setSelectedFile(file);
    setFileError(null);
    clearProcessedResult();

    if (file) {
      try {
        const bytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(bytes);
        const pageCount = pdfDoc.getPageCount();
        const sizeMB = file.size / 1024 / 1024;

        setCurrentPages(pageCount);
        setCurrentSize(sizeMB);
        trackPdfUploadSelected({
          originalSizeMB: sizeMB,
          originalPages: pageCount,
        });
      } catch {
        setSelectedFile(null);
        setCurrentPages(null);
        setCurrentSize(null);
        setFileError(copy.fileReadError);
      }
    } else {
      setCurrentPages(null);
      setCurrentSize(null);
    }
  };

  const handleStartProcessing = async () => {
    if (!selectedFile || !hasValidMaxSize || !hasValidMaxPages) return;
    const targetSizeMB = maxSizeMB;
    const processCountSession = incrementSessionProcessCount();
    const originalSizeMB = currentSize ?? selectedFile.size / 1024 / 1024;
    const originalPages = currentPages;
    const expectedNUpMode = getExpectedNUpMode(currentPages, maxPages);

    clearProcessedResult();
    setLastProcessCountSession(processCountSession);
    setIsProcessing(true);
    setProgress(8);
    setProcessingStage("validating");
    setProcessingDetail(copy.initialDetail);
    setProcessError(null);
    setProcessNotice(null);
    setShowProcessingAd(true);
    trackCompressionStarted({
      nUpMode: expectedNUpMode,
      targetSizeMB,
      targetPages: maxPages,
      processCountSession,
    });

    try {
      const handleProgress = ({ stage, progress, detail }: ProgressUpdate) => {
        setProcessingStage(stage);
        setProgress(progress);
        setProcessingDetail(detail || null);
      };
      let result: CompressionResult;
      let usedMainThreadFallback = false;

      try {
        result = await compressPdfInWorker(selectedFile, targetSizeMB, maxPages, copy, handleProgress);
      } catch {
        usedMainThreadFallback = true;
        result = await compressPdfForTarget(selectedFile, {
          targetSizeMB,
          maxPages,
          onProgress: handleProgress,
          messages: copy,
        });
      }

      const notices = [...result.warnings];
      if (usedMainThreadFallback) {
        notices.push(copy.fallbackNotice);
      }

      if (result.file.size >= selectedFile.size) {
        trackCompressionCompleted({
          result: "original_kept",
          nUpMode: getNUpMode(result.nUp),
          originalSizeMB,
          originalPages,
          targetSizeMB,
          targetPages: maxPages,
          outputSizeMB: result.file.size / 1024 / 1024,
          outputPages: result.outputPages,
          processCountSession,
        });
        setLastAnalyticsResult("original_kept");
        setProcessError(copy.originalKeptError);
        setProcessingStage("error");
        setProcessingDetail(null);
        return;
      }

      const metTargetPages = maxPages == null || result.outputPages <= maxPages;
      const completedResult: AnalyticsResult =
        result.metTargetSize && metTargetPages ? "success" : "over_target";

      if (!result.metTargetSize) {
        notices.push(copy.overSizeNotice);
      }
      if (!metTargetPages) {
        notices.push(copy.overPageNotice);
      }

      const suffix = result.nUp > 1 ? `-${result.nUp}up-compressed` : '-compressed';
      const finalName = createProcessedFileName(selectedFile.name, suffix);
      const finalFile = new File([result.file], finalName, { type: 'application/pdf' });
      const nextDownloadUrl = createDownloadUrl(finalFile);
      const outputSizeMB = finalFile.size / 1024 / 1024;

      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }

      setDownloadUrl(nextDownloadUrl);
      setProcessedName(finalName);
      setProcessedSize(outputSizeMB);
      setProcessedPages(result.outputPages);
      setLastAnalyticsResult(completedResult);
      setProcessNotice(notices.length > 0 ? notices.join(" ") : null);
      setProgress(100);
      setProcessingStage("done");
      setProcessingDetail(null);
      trackCompressionCompleted({
        result: completedResult,
        nUpMode: getNUpMode(result.nUp),
        originalSizeMB,
        originalPages,
        targetSizeMB,
        targetPages: maxPages,
        outputSizeMB,
        outputPages: result.outputPages,
        processCountSession,
      });
    } catch {
      trackCompressionCompleted({
        result: "failed",
        nUpMode: expectedNUpMode,
        originalSizeMB,
        originalPages,
        targetSizeMB,
        targetPages: maxPages,
        outputSizeMB: null,
        outputPages: null,
        processCountSession,
      });
      setLastAnalyticsResult("failed");
      setProcessError(copy.processFailed);
      setProcessingStage("error");
      setProcessingDetail(null);
    } finally {
      setIsProcessing(false);
      setShowProcessingAd(false);
    }
  };

  const settingsProps: SettingsPanelProps = {
    maxSizeMB,
    maxPages,
    onMaxSizeChange: handleMaxSizeChange,
    onMaxPagesChange: handleMaxPagesChange,
    currentPages,
    selectedFile,
    onFileSelect: handleFileSelect,
    isProcessing,
    onStart: handleStartProcessing,
    canStart,
    startDisabledReason,
    progress,
    stageDetail: processingDetail,
    copy,
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#F8FAFC]">
      <AdBanner position="side" />
      <AdBanner position="top" />
      <main className="mx-auto w-full max-w-2xl space-y-4 p-4 pb-8 lg:p-5 lg:pb-10">
        <header className="flex items-start justify-between gap-3 px-1">
          <div className="space-y-1">
            <h1 className="text-[20px] font-[900] leading-tight text-[#101D2D] lg:text-[22px]">
              {copy.appTitle}
            </h1>
            <p className="text-[12px] font-[600] leading-relaxed text-[#64748B] lg:text-[13px]">
              {copy.appSubtitle}
            </p>
          </div>
          <LanguageMenu currentLocale={locale} />
        </header>

        {/* 3. upload-file */}
        <UploadFileZone
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          fileError={fileError}
          currentPages={currentPages}
          currentSize={currentSize}
          copy={copy}
        />

        {showKoreanPresets && (
          <AgencyChips
            selectedAgency={selectedAgency}
            onSelectAgency={handleAgencySelect}
            copy={copy}
          />
        )}

        {/* 4. presize-control */}
        <PresizeControlZone {...settingsProps} />

        <AutoCalcResult {...settingsProps} />

        {/* submit */}
        <SubmitZone
          selectedFile={selectedFile}
          isProcessing={isProcessing}
          onStart={handleStartProcessing}
          canStart={canStart}
          startDisabledReason={startDisabledReason}
          progress={progress}
          stage={processingStage}
          stageDetail={processingDetail}
          copy={copy}
        />

        <ProcessingResult
          downloadUrl={downloadUrl}
          fileName={processedName}
          fileSize={processedSize}
          error={processError}
          notice={processNotice}
          onDownload={
            downloadUrl && processedName
              ? () => {
                  trackDownloadClicked({
                    result: lastAnalyticsResult || "success",
                    outputSizeMB: processedSize,
                    outputPages: processedPages,
                    processCountSession: lastProcessCountSession,
                  });
                  triggerFileDownload(downloadUrl, processedName);
                }
              : undefined
          }
          onSaveGuideOpen={trackSaveGuideOpened}
          copy={copy}
        />

        <SeoSupportSection copy={copy} />

      </main>
      <AdBanner position="bottom" />
      <ProcessingAdModal
        open={showProcessingAd}
        onClose={() => setShowProcessingAd(false)}
        copy={copy}
      />
    </div>
  );
}

export default function Page() {
  return (
    <PdfToolPage
      locale="ko"
      showKoreanPresets
      defaultSelectedAgency="ecourt"
      defaultMaxSizeMB={20}
      defaultMaxPages={null}
    />
  );
}
