import {
  compressPdfForTarget,
  type CompressionResult,
  type ProgressUpdate,
} from './pdfCompression';
import type { AppCopy } from './i18n';

type WorkerRequest = {
  file: File;
  targetSizeMB: number;
  maxPages: number | null;
  messages: AppCopy;
};

type WorkerResponse =
  | { type: 'progress'; update: ProgressUpdate }
  | { type: 'success'; result: CompressionResult }
  | { type: 'error'; message: string };

function postResponse(response: WorkerResponse) {
  self.postMessage(response);
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { file, targetSizeMB, maxPages, messages } = event.data;

  try {
    const result = await compressPdfForTarget(file, {
      targetSizeMB,
      maxPages,
      messages,
      onProgress: (update) => postResponse({ type: 'progress', update }),
    });

    postResponse({ type: 'success', result });
  } catch (error) {
    postResponse({
      type: 'error',
      message: error instanceof Error ? error.message : 'PDF processing failed.',
    });
  }
};
