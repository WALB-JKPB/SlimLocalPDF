import { PDFDocument } from 'pdf-lib';
import { formatText, type AppCopy } from '@/lib/i18n';

export type ProcessingStage =
  | 'validating'
  | 'analyzing'
  | 'layout'
  | 'compressing'
  | 'finalizing'
  | 'done'
  | 'error';

export interface ProgressUpdate {
  stage: ProcessingStage;
  progress: number;
  detail?: string;
}

export interface CompressionResult {
  file: File;
  engine: 'pdfcpu' | 'ghostscript' | 'pdf-lib';
  metTargetSize: boolean;
  nUp: 1 | 2 | 4;
  outputPages: number;
  warnings: string[];
}

interface CompressionOptions {
  targetSizeMB: number;
  maxPages: number | null;
  onProgress?: (update: ProgressUpdate) => void;
  messages?: AppCopy;
}

interface GhostscriptModule {
  callMain(args?: string[]): number;
  FS: {
    writeFile(path: string, data: Uint8Array): void;
    readFile(path: string, options: { encoding: 'binary' }): Uint8Array;
    unlink(path: string): void;
  };
}

type GhostscriptModuleFactory = (options?: {
  locateFile?: (path: string) => string;
}) => Promise<GhostscriptModule>;

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const PAGE_MARGIN = 20;

const ghostscriptStages = [
  { name: 'ebook', pdfSettings: '/ebook', imageResolution: 150 },
  { name: 'screen', pdfSettings: '/screen', imageResolution: 96 },
  { name: 'minimum', pdfSettings: '/screen', imageResolution: 72 },
];

let ghostscriptLoaderPromise: Promise<GhostscriptModuleFactory> | null = null;

function bytesForMB(sizeMB: number) {
  return sizeMB * 1024 * 1024;
}

function getRequiredNUp(pageCount: number, maxPages: number | null): 1 | 2 | 4 {
  if (maxPages == null || maxPages <= 0 || pageCount <= maxPages) return 1;
  const required = Math.ceil(pageCount / maxPages);
  if (required <= 2) return 2;
  return 4;
}

function getOutputPageCount(pageCount: number, nUp: 1 | 2 | 4) {
  return Math.ceil(pageCount / nUp);
}

function toFilePart(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export function createProcessedFileName(fileName: string, suffix: string) {
  return fileName.replace(/\.pdf$/i, '') + suffix + '.pdf';
}

export function createDownloadUrl(file: File) {
  const blob = new Blob([file], { type: 'application/octet-stream' });
  return URL.createObjectURL(blob);
}

export function triggerFileDownload(url: string, fileName: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.target = '_self';
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function warmCompressionEngines() {
  if (typeof window === 'undefined') return;

  const warm = () => {
    void import('pdfcpu-wasm');
    void loadGhostscriptFactory();
    void fetch('/vendor/ghostpdl/gs.wasm', { cache: 'force-cache' }).catch(() => {});
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(warm, { timeout: 5000 });
  } else {
    globalThis.setTimeout(warm, 1200);
  }
}

async function loadGhostscriptFactory() {
  if (!ghostscriptLoaderPromise) {
    const ghostscriptModuleUrl = '/vendor/ghostpdl/gs.js';
    ghostscriptLoaderPromise = import(/* webpackIgnore: true */ ghostscriptModuleUrl)
      .then((module) => module.default as GhostscriptModuleFactory);
  }
  return ghostscriptLoaderPromise;
}

export async function optimizePdfWithPdfcpu(file: File) {
  const { Pdfcpu } = await import('pdfcpu-wasm');
  const pdfcpu = new Pdfcpu();
  const inputName = 'input.pdf';
  const outputName = 'optimized.pdf';
  const inputFile = new File([file], inputName, { type: 'application/pdf' });

  const output = await pdfcpu.run(
    ['optimize', `/input/${inputName}`, `/output/${outputName}`],
    [inputFile],
  );
  const optimizedFile = await output.readFile(outputName, 'application/pdf');

  if (!optimizedFile) {
    throw new Error('pdfcpu did not create an optimized PDF.');
  }

  return optimizedFile;
}

async function applyNUpLayout(file: File, maxPages: number | null, messages?: AppCopy) {
  const source = await PDFDocument.load(await file.arrayBuffer());
  const sourcePageCount = source.getPageCount();
  const nUp = getRequiredNUp(sourcePageCount, maxPages);

  if (nUp === 1) {
    return {
      file,
      nUp,
      outputPages: sourcePageCount,
      warning: null as string | null,
    };
  }

  const output = await PDFDocument.create();
  const embeddedPages = await output.embedPages(source.getPages());
  const columns = nUp === 2 ? 1 : 2;
  const rows = nUp === 2 ? 2 : 2;
  const cellWidth = (A4_WIDTH - PAGE_MARGIN * 2) / columns;
  const cellHeight = (A4_HEIGHT - PAGE_MARGIN * 2) / rows;

  for (let start = 0; start < embeddedPages.length; start += nUp) {
    const page = output.addPage([A4_WIDTH, A4_HEIGHT]);
    const pageGroup = embeddedPages.slice(start, start + nUp);

    pageGroup.forEach((embeddedPage, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const scale = Math.min(
        cellWidth / embeddedPage.width,
        cellHeight / embeddedPage.height,
      );
      const drawWidth = embeddedPage.width * scale;
      const drawHeight = embeddedPage.height * scale;
      const x = PAGE_MARGIN + col * cellWidth + (cellWidth - drawWidth) / 2;
      const y = A4_HEIGHT - PAGE_MARGIN - (row + 1) * cellHeight + (cellHeight - drawHeight) / 2;

      page.drawPage(embeddedPage, { x, y, width: drawWidth, height: drawHeight });
    });
  }

  const nupBytes = await output.save({ useObjectStreams: true });
  const nupFile = new File([toFilePart(nupBytes)], createProcessedFileName(file.name, `-${nUp}up`), {
    type: 'application/pdf',
  });
  const outputPages = getOutputPageCount(sourcePageCount, nUp);
  const warning =
    nUp === 4
      ? messages?.pdfWarningFourUp || '4-in-1 layout can reduce page count, but readability may become worse.'
      : null;

  return { file: nupFile, nUp, outputPages, warning };
}

async function compressPdfWithGhostscript(
  file: File,
  targetBytes: number,
  onProgress?: (update: ProgressUpdate) => void,
  messages?: AppCopy,
) {
  const loadWasm = await loadGhostscriptFactory();
  const Module = await loadWasm({
    locateFile: (path) => `/vendor/ghostpdl/${path}`,
  });
  const inputBytes = new Uint8Array(await file.arrayBuffer());
  let bestFile: File | null = null;

  for (const [index, stage] of ghostscriptStages.entries()) {
    const inputName = `input-${stage.name}.pdf`;
    const outputName = `output-${stage.name}.pdf`;
    const progress = Math.min(82, 66 + index * 8);

    onProgress?.({
      stage: 'compressing',
      progress,
      detail: formatText(
        messages?.pdfGhostscriptDetail || 'Reducing size further by adjusting image quality. ({current}/{total})',
        { current: index + 1, total: ghostscriptStages.length },
      ),
    });

    Module.FS.writeFile(inputName, inputBytes);
    Module.callMain([
      '-sDEVICE=pdfwrite',
      `-dPDFSETTINGS=${stage.pdfSettings}`,
      '-dCompatibilityLevel=1.4',
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      '-dDetectDuplicateImages=true',
      '-dCompressFonts=true',
      '-dSubsetFonts=true',
      '-dDownsampleColorImages=true',
      `-dColorImageResolution=${stage.imageResolution}`,
      '-dDownsampleGrayImages=true',
      `-dGrayImageResolution=${stage.imageResolution}`,
      '-dDownsampleMonoImages=true',
      `-dMonoImageResolution=${stage.imageResolution}`,
      `-sOutputFile=${outputName}`,
      inputName,
    ]);

    const outputBytes = Module.FS.readFile(outputName, { encoding: 'binary' });
    const outputFile = new File([toFilePart(outputBytes)], outputName, { type: 'application/pdf' });

    try {
      Module.FS.unlink(inputName);
      Module.FS.unlink(outputName);
    } catch {
      // Best-effort cleanup for the in-memory Emscripten filesystem.
    }

    if (!bestFile || outputFile.size < bestFile.size) {
      bestFile = outputFile;
    }

    if (outputFile.size <= targetBytes) {
      return outputFile;
    }
  }

  if (!bestFile) {
    throw new Error('Ghostscript did not create a compressed PDF.');
  }

  return bestFile;
}

async function fallbackCompressWithPdfLib(file: File) {
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const bytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
  return new File([toFilePart(bytes)], createProcessedFileName(file.name, '-fallback'), {
    type: 'application/pdf',
  });
}

export async function compressPdfForTarget(file: File, options: CompressionOptions) {
  const warnings: string[] = [];
  const targetBytes = bytesForMB(options.targetSizeMB);
  const messages = options.messages;

  options.onProgress?.({
    stage: 'validating',
    progress: 8,
    detail: messages?.pdfValidatingDetail || 'Checking whether this file can be opened as a PDF.',
  });
  options.onProgress?.({
    stage: 'analyzing',
    progress: 18,
    detail:
      options.maxPages == null
        ? messages?.pdfAnalyzingNoLimitDetail || 'Reading the page count and applying size-only compression.'
        : messages?.pdfAnalyzingWithLimitDetail || 'Reading the page count and target settings.',
  });
  const laidOut = await applyNUpLayout(file, options.maxPages, messages);
  if (laidOut.warning) warnings.push(laidOut.warning);

  options.onProgress?.({
    stage: 'layout',
    progress: laidOut.nUp === 1 ? 28 : 38,
    detail:
      options.maxPages == null
        ? messages?.pdfLayoutNoLimitDetail || 'No page limit is set, so page combining is skipped.'
        : laidOut.nUp === 1
        ? messages?.pdfLayoutNoNupDetail || 'The document is already within the target page count.'
        : formatText(
            messages?.pdfLayoutNupDetail || 'Combined pages into an estimated {outputPages}-page output.',
            { outputPages: laidOut.outputPages },
          ),
  });
  let bestFile = laidOut.file;
  let engine: CompressionResult['engine'] = 'pdf-lib';

  try {
    options.onProgress?.({
      stage: 'compressing',
      progress: 48,
      detail: messages?.pdfOptimizeDetail || 'Removing unnecessary PDF data.',
    });
    const pdfcpuFile = await optimizePdfWithPdfcpu(bestFile);
    if (pdfcpuFile.size < bestFile.size) {
      bestFile = pdfcpuFile;
      engine = 'pdfcpu';
    }

    if (bestFile.size > targetBytes) {
      options.onProgress?.({
        stage: 'compressing',
        progress: 62,
        detail: messages?.pdfStrongerCompressionDetail || 'The file is still large, so stronger compression is being tried.',
      });
      const ghostscriptFile = await compressPdfWithGhostscript(
        bestFile,
        targetBytes,
        options.onProgress,
        messages,
      );
      if (ghostscriptFile.size < bestFile.size) {
        bestFile = ghostscriptFile;
        engine = 'ghostscript';
      }
    }
  } catch {
    options.onProgress?.({
      stage: 'compressing',
      progress: 62,
      detail: messages?.pdfFallbackDetail || 'Trying a fallback save method because standard compression is difficult.',
    });
    const fallbackFile = await fallbackCompressWithPdfLib(bestFile);
    if (fallbackFile.size < bestFile.size) {
      bestFile = fallbackFile;
      engine = 'pdf-lib';
    } else {
      warnings.push(messages?.pdfFallbackWarning || 'This file could not be reduced much, so only basic cleanup was applied.');
    }
  }

  options.onProgress?.({
    stage: 'finalizing',
    progress: 88,
    detail: messages?.pdfFinalizingDetail || 'Checking the final size and preparing the download.',
  });

  return {
    file: bestFile,
    engine,
    metTargetSize: bestFile.size <= targetBytes,
    nUp: laidOut.nUp,
    outputPages: laidOut.outputPages,
    warnings,
  } satisfies CompressionResult;
}
