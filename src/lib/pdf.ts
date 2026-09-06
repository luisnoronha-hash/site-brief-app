import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

const NAVY = rgb(0x1b / 255, 0x2a / 255, 0x41 / 255);
const GRAY = rgb(0x5b / 255, 0x5f / 255, 0x66 / 255);
const LIGHT_GRAY = rgb(0x8a / 255, 0x8e / 255, 0x94 / 255);

export type ReportBrandingInput = {
  address: string;
  agentName: string;
  licenseNumber: string;
  brokerage: string;
  brokeragePhone: string;
  brokerageEmail: string;
  brokerageWebsite?: string | null;
  headshotBytes?: Buffer | null;
  logoBytes?: Buffer | null;
  analysisPdfBytes: Buffer;
};

const DISCLAIMER_TEXT = (brokerage: string) =>
  `This analysis presents by-right and overlay development potential based on published zoning ` +
  `regulations and publicly available market data. It is not an appraisal, a survey, an engineering ` +
  `opinion, or a guarantee of any permitting outcome. Figures are estimates prepared for marketing ` +
  `purposes and should be independently verified. Prepared by LANA Development as marketing support ` +
  `for ${brokerage}.`;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function embedImageSmart(doc: PDFDocument, bytes: Buffer) {
  try {
    return await doc.embedPng(bytes);
  } catch {
    return doc.embedJpg(bytes);
  }
}

export async function generateBrandedReport(input: ReportBrandingInput): Promise<Buffer> {
  const outDoc = await PDFDocument.create();
  const helvetica = await outDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await outDoc.embedFont(StandardFonts.HelveticaBold);
  const timesBold = await outDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesRoman = await outDoc.embedFont(StandardFonts.TimesRoman);

  const PAGE_WIDTH = 612; // US Letter
  const PAGE_HEIGHT = 792;

  // ---- Cover page ----
  const cover = outDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  cover.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: rgb(1, 1, 1) });
  cover.drawRectangle({ x: 0, y: PAGE_HEIGHT - 12, width: PAGE_WIDTH, height: 12, color: NAVY });

  if (input.logoBytes) {
    try {
      const logo = await embedImageSmart(outDoc, input.logoBytes);
      const logoWidth = 140;
      const logoHeight = (logo.height / logo.width) * logoWidth;
      cover.drawImage(logo, {
        x: (PAGE_WIDTH - logoWidth) / 2,
        y: PAGE_HEIGHT - 120 - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
    } catch {
      // logo failed to embed; continue without it
    }
  }

  cover.drawText("DEVELOPMENT POTENTIAL ANALYSIS", {
    x: 60,
    y: PAGE_HEIGHT - 220,
    size: 12,
    font: helveticaBold,
    color: GRAY,
  });

  const addressLines = wrapText(input.address, timesBold, 26, PAGE_WIDTH - 120);
  let addrY = PAGE_HEIGHT - 260;
  for (const line of addressLines) {
    cover.drawText(line, { x: 60, y: addrY, size: 26, font: timesBold, color: NAVY });
    addrY -= 32;
  }

  cover.drawLine({
    start: { x: 60, y: addrY - 10 },
    end: { x: PAGE_WIDTH - 60, y: addrY - 10 },
    thickness: 1,
    color: rgb(0.9, 0.89, 0.87),
  });

  // Agent block near the bottom of the cover
  let agentY = 200;
  if (input.headshotBytes) {
    try {
      const headshot = await embedImageSmart(outDoc, input.headshotBytes);
      const size = 72;
      cover.drawImage(headshot, { x: 60, y: agentY - size + 40, width: size, height: size });
    } catch {
      // headshot failed to embed; continue without it
    }
  }

  const textX = input.headshotBytes ? 150 : 60;
  cover.drawText(input.agentName, { x: textX, y: agentY + 26, size: 15, font: helveticaBold, color: NAVY });
  cover.drawText(`FL License #${input.licenseNumber}`, {
    x: textX,
    y: agentY + 8,
    size: 10,
    font: helvetica,
    color: GRAY,
  });
  cover.drawText(input.brokerage, { x: textX, y: agentY - 8, size: 11, font: helvetica, color: GRAY });

  cover.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: 4, color: NAVY });

  // ---- Merge analysis pages with running header/footer ----
  const srcDoc = await PDFDocument.load(input.analysisPdfBytes);
  const copiedPages = await outDoc.copyPages(srcDoc, srcDoc.getPageIndices());

  copiedPages.forEach((page) => {
    outDoc.addPage(page);
    const { width, height } = page.getSize();

    page.drawRectangle({ x: 0, y: height - 28, width, height: 28, color: rgb(1, 1, 1), opacity: 0.001 });
    page.drawText(`${input.agentName} · ${input.brokerage}`, {
      x: 40,
      y: height - 20,
      size: 8,
      font: helvetica,
      color: GRAY,
    });
    const addressLabel = input.address;
    const addrWidth = helvetica.widthOfTextAtSize(addressLabel, 8);
    page.drawText(addressLabel, {
      x: width - 40 - addrWidth,
      y: height - 20,
      size: 8,
      font: helvetica,
      color: GRAY,
    });
    page.drawLine({
      start: { x: 40, y: height - 26 },
      end: { x: width - 40, y: height - 26 },
      thickness: 0.5,
      color: rgb(0.9, 0.89, 0.87),
    });

    const footerText = "Development analysis by LANA Development · lanadevelopment.com";
    const footerWidth = helvetica.widthOfTextAtSize(footerText, 8);
    page.drawText(footerText, {
      x: (width - footerWidth) / 2,
      y: 24,
      size: 8,
      font: helvetica,
      color: LIGHT_GRAY,
    });
  });

  // ---- Final page: contact block + disclaimer ----
  const finalPage = outDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  finalPage.drawRectangle({ x: 0, y: PAGE_HEIGHT - 12, width: PAGE_WIDTH, height: 12, color: NAVY });

  finalPage.drawText("PREPARED FOR", { x: 60, y: PAGE_HEIGHT - 100, size: 11, font: helveticaBold, color: GRAY });
  finalPage.drawText(input.agentName, { x: 60, y: PAGE_HEIGHT - 130, size: 20, font: timesBold, color: NAVY });
  finalPage.drawText(`FL License #${input.licenseNumber}`, {
    x: 60,
    y: PAGE_HEIGHT - 152,
    size: 11,
    font: helvetica,
    color: GRAY,
  });
  finalPage.drawText(input.brokerage, { x: 60, y: PAGE_HEIGHT - 170, size: 12, font: helvetica, color: GRAY });
  finalPage.drawText(input.brokeragePhone, { x: 60, y: PAGE_HEIGHT - 188, size: 11, font: helvetica, color: GRAY });
  finalPage.drawText(input.brokerageEmail, { x: 60, y: PAGE_HEIGHT - 204, size: 11, font: helvetica, color: GRAY });
  if (input.brokerageWebsite) {
    finalPage.drawText(input.brokerageWebsite, {
      x: 60,
      y: PAGE_HEIGHT - 220,
      size: 11,
      font: helvetica,
      color: GRAY,
    });
  }

  finalPage.drawLine({
    start: { x: 60, y: PAGE_HEIGHT - 250 },
    end: { x: PAGE_WIDTH - 60, y: PAGE_HEIGHT - 250 },
    thickness: 1,
    color: rgb(0.9, 0.89, 0.87),
  });

  finalPage.drawText("DISCLAIMER", {
    x: 60,
    y: PAGE_HEIGHT - 280,
    size: 10,
    font: helveticaBold,
    color: GRAY,
  });

  const disclaimerLines = wrapText(DISCLAIMER_TEXT(input.brokerage), timesRoman, 10, PAGE_WIDTH - 120);
  let discY = PAGE_HEIGHT - 300;
  for (const line of disclaimerLines) {
    finalPage.drawText(line, { x: 60, y: discY, size: 10, font: timesRoman, color: GRAY });
    discY -= 15;
  }

  const footerText = "Development analysis by LANA Development · lanadevelopment.com";
  const footerWidth = helvetica.widthOfTextAtSize(footerText, 8);
  finalPage.drawText(footerText, {
    x: (PAGE_WIDTH - footerWidth) / 2,
    y: 24,
    size: 8,
    font: helvetica,
    color: LIGHT_GRAY,
  });

  const bytes = await outDoc.save();
  return Buffer.from(bytes);
}
