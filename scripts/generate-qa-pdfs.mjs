import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(rootDir, 'qa-samples', 'generated');
const pageSize = [595.28, 841.89];

async function savePdf(fileName, createPdf) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(fileName);
  pdf.setCreator('SlimLocalPDF QA sample generator');
  pdf.setProducer('SlimLocalPDF QA sample generator');
  pdf.setCreationDate(new Date('2026-01-01T00:00:00Z'));
  pdf.setModificationDate(new Date('2026-01-01T00:00:00Z'));

  await createPdf(pdf);

  const bytes = await pdf.save({ useObjectStreams: true });
  await writeFile(join(outputDir, fileName), bytes);
}

async function createSmallTextPdf() {
  await savePdf('small-text.pdf', async (pdf) => {
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const page = pdf.addPage(pageSize);

    page.drawText('SlimLocalPDF QA Sample', {
      x: 72,
      y: 760,
      size: 22,
      font: bold,
      color: rgb(0.06, 0.11, 0.18),
    });
    page.drawText('Small text-only PDF for upload, page count, and basic download checks.', {
      x: 72,
      y: 724,
      size: 12,
      font,
      color: rgb(0.25, 0.32, 0.43),
    });
  });
}

async function createManyPagesPdf() {
  await savePdf('many-pages-20.pdf', async (pdf) => {
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    for (let index = 1; index <= 20; index += 1) {
      const page = pdf.addPage(pageSize);
      page.drawText(`Page ${index}`, {
        x: 72,
        y: 760,
        size: 24,
        font: bold,
        color: rgb(0.06, 0.11, 0.18),
      });
      page.drawText('Use this sample to verify actual page counting and N-up calculation.', {
        x: 72,
        y: 724,
        size: 12,
        font,
        color: rgb(0.25, 0.32, 0.43),
      });
      page.drawRectangle({
        x: 72,
        y: 120,
        width: 450,
        height: 540,
        borderColor: rgb(0.8, 0.86, 0.93),
        borderWidth: 1,
      });
    }
  });
}

async function createImageHeavyPdf() {
  await savePdf('image-heavy-scan-like.pdf', async (pdf) => {
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);

    for (let pageIndex = 0; pageIndex < 4; pageIndex += 1) {
      const page = pdf.addPage(pageSize);
      page.drawText(`Scan-like image page ${pageIndex + 1}`, {
        x: 72,
        y: 760,
        size: 18,
        font,
        color: rgb(0.06, 0.11, 0.18),
      });

      for (let row = 0; row < 22; row += 1) {
        for (let col = 0; col < 12; col += 1) {
          const tone = ((row * 13 + col * 7 + pageIndex * 19) % 100) / 100;
          page.drawRectangle({
            x: 72 + col * 37,
            y: 104 + row * 28,
            width: 30,
            height: 20,
            color: rgb(0.72 + tone * 0.14, 0.76 + tone * 0.12, 0.8 + tone * 0.1),
          });
        }
      }
    }
  });
}

async function createMixedOrientationPdf() {
  await savePdf('mixed-orientation.pdf', async (pdf) => {
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const portrait = pdf.addPage(pageSize);
    portrait.drawText('Portrait page', {
      x: 72,
      y: 760,
      size: 22,
      font,
      color: rgb(0.06, 0.11, 0.18),
    });
    portrait.drawRectangle({
      x: 72,
      y: 180,
      width: 420,
      height: 520,
      borderColor: rgb(0, 0.32, 0.8),
      borderWidth: 2,
    });

    const landscape = pdf.addPage([841.89, 595.28]);
    landscape.drawText('Landscape page', {
      x: 72,
      y: 500,
      size: 22,
      font,
      color: rgb(0.06, 0.11, 0.18),
    });
    landscape.drawRectangle({
      x: 72,
      y: 100,
      width: 650,
      height: 340,
      borderColor: rgb(0, 0.32, 0.8),
      borderWidth: 2,
    });
  });
}

async function createInvalidPdf() {
  const bytes = new TextEncoder().encode(
    '%PDF-this-file-is-intentionally-broken\nSlimLocalPDF QA invalid PDF sample\n',
  );
  await writeFile(join(outputDir, 'corrupted.pdf'), bytes);
}

await mkdir(outputDir, { recursive: true });
await createSmallTextPdf();
await createManyPagesPdf();
await createImageHeavyPdf();
await createMixedOrientationPdf();
await createInvalidPdf();

console.log(`Generated QA PDF samples in ${outputDir}`);
