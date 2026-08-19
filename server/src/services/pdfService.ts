import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';

interface PdfSubmissionData {
  referenceNumber: string;
  formType: string;
  status: string;
  submittedAt: Date | null;
  company: {
    cin: string;
    companyName: string;
    registeredOfficeAddress: string;
    email: string;
    state: string;
    city: string;
    pinCode: string;
  } | null;
  directors: Array<{
    din: string;
    name: string;
    designation: string;
    purposeOfFiling: string;
    appointmentDate: Date | null;
    nationality: string;
    dateOfBirth: Date;
    gender: string;
    category: string;
  }>;
  kmps: Array<{
    firstName: string;
    lastName: string | null;
    designation: string;
    pan: string | null;
  }>;
  attachments: Array<{ originalFilename: string; attachmentType: string }>;
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = rgb(0, 0, 0)
) {
  page.drawText(text, { x, y, font, size, color });
}

function drawLine(page: PDFPage, x1: number, y1: number, x2: number, y2: number) {
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });
}

export async function generateSubmissionPdf(data: PdfSubmissionData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;

  function addPage(): PDFPage {
    return pdfDoc.addPage([pageWidth, pageHeight]);
  }

  let page = addPage();
  let y = pageHeight - margin;

  const lineHeight = 16;
  const sectionGap = 20;

  // ── Header ──────────────────────────────────────────────────
  page.drawRectangle({
    x: 0,
    y: pageHeight - 80,
    width: pageWidth,
    height: 80,
    color: rgb(0.08, 0.18, 0.38),
  });

  drawText(page, 'CORPORATE COMPLIANCE PORTAL', margin, pageHeight - 35, helveticaBold, 16, rgb(1, 1, 1));
  drawText(page, 'DEMO / DEVELOPMENT DOCUMENT — NOT AN OFFICIAL GOVERNMENT DOCUMENT', margin, pageHeight - 55, helvetica, 8, rgb(0.8, 0.8, 0.8));
  drawText(page, data.formType + ' Submission', margin, pageHeight - 72, helvetica, 10, rgb(0.7, 0.85, 1));

  y = pageHeight - 100;

  // ── Reference block ─────────────────────────────────────────
  page.drawRectangle({
    x: margin,
    y: y - 40,
    width: pageWidth - 2 * margin,
    height: 42,
    color: rgb(0.95, 0.97, 1),
    borderColor: rgb(0.7, 0.78, 0.9),
    borderWidth: 1,
  });

  drawText(page, 'Demo Reference Number:', margin + 8, y - 14, helveticaBold, 10);
  drawText(page, data.referenceNumber, margin + 170, y - 14, helvetica, 10, rgb(0.1, 0.3, 0.7));
  drawText(page, 'Status:', margin + 8, y - 30, helveticaBold, 10);
  drawText(page, data.status, margin + 60, y - 30, helvetica, 10);
  if (data.submittedAt) {
    drawText(page, 'Submitted:', margin + 200, y - 30, helveticaBold, 10);
    drawText(page, new Date(data.submittedAt).toLocaleDateString('en-IN'), margin + 260, y - 30, helvetica, 10);
  }

  y -= 60;

  // ── Company Details ─────────────────────────────────────────
  if (data.company) {
    drawText(page, 'COMPANY DETAILS', margin, y, helveticaBold, 11, rgb(0.08, 0.18, 0.38));
    drawLine(page, margin, y - 4, pageWidth - margin, y - 4);
    y -= 18;

    const companyFields: [string, string][] = [
      ['CIN', data.company.cin],
      ['Company Name', data.company.companyName],
      ['Registered Address', data.company.registeredOfficeAddress],
      ['State', data.company.state],
      ['City', data.company.city],
      ['Pin Code', data.company.pinCode],
      ['Email', data.company.email],
    ];

    for (const [label, value] of companyFields) {
      drawText(page, label + ':', margin, y, helveticaBold, 9);
      drawText(page, value || '-', margin + 130, y, helvetica, 9);
      y -= lineHeight;
    }
    y -= sectionGap;
  }

  // ── Directors ────────────────────────────────────────────────
  if (data.directors.length > 0) {
    if (y < 150) { page = addPage(); y = pageHeight - margin; }

    drawText(page, 'DIRECTORS', margin, y, helveticaBold, 11, rgb(0.08, 0.18, 0.38));
    drawLine(page, margin, y - 4, pageWidth - margin, y - 4);
    y -= 18;

    data.directors.forEach((dir, i) => {
      if (y < 120) { page = addPage(); y = pageHeight - margin; }

      drawText(page, `Director ${i + 1}`, margin, y, helveticaBold, 10, rgb(0.1, 0.3, 0.7));
      y -= lineHeight;

      const dirFields: [string, string][] = [
        ['Purpose', dir.purposeOfFiling.replace(/_/g, ' ')],
        ['DIN', dir.din],
        ['Name', dir.name],
        ['Designation', dir.designation.replace(/_/g, ' ')],
        ['Category', dir.category],
        ['Nationality', dir.nationality],
        ['Date of Birth', dir.dateOfBirth ? new Date(dir.dateOfBirth).toLocaleDateString('en-IN') : '-'],
        ['Gender', dir.gender],
        ['Appointment Date', dir.appointmentDate ? new Date(dir.appointmentDate).toLocaleDateString('en-IN') : '-'],
      ];

      for (const [label, value] of dirFields) {
        if (y < 60) { page = addPage(); y = pageHeight - margin; }
        drawText(page, label + ':', margin + 10, y, helveticaBold, 9);
        drawText(page, value || '-', margin + 130, y, helvetica, 9);
        y -= lineHeight;
      }
      y -= 8;
    });
    y -= sectionGap;
  }

  // ── KMP ──────────────────────────────────────────────────────
  if (data.kmps.length > 0) {
    if (y < 100) { page = addPage(); y = pageHeight - margin; }

    drawText(page, 'KEY MANAGERIAL PERSONNEL', margin, y, helveticaBold, 11, rgb(0.08, 0.18, 0.38));
    drawLine(page, margin, y - 4, pageWidth - margin, y - 4);
    y -= 18;

    data.kmps.forEach((kmp, i) => {
      if (y < 80) { page = addPage(); y = pageHeight - margin; }
      drawText(page, `KMP ${i + 1}: ${kmp.firstName} ${kmp.lastName || ''} (${kmp.designation})`, margin + 10, y, helvetica, 9);
      if (kmp.pan) {
        drawText(page, `PAN: ${kmp.pan}`, margin + 280, y, helvetica, 9);
      }
      y -= lineHeight;
    });
    y -= sectionGap;
  }

  // ── Attachments ──────────────────────────────────────────────
  if (data.attachments.length > 0) {
    if (y < 80) { page = addPage(); y = pageHeight - margin; }

    drawText(page, 'ATTACHMENTS', margin, y, helveticaBold, 11, rgb(0.08, 0.18, 0.38));
    drawLine(page, margin, y - 4, pageWidth - margin, y - 4);
    y -= 18;

    data.attachments.forEach((att, i) => {
      drawText(page, `${i + 1}. ${att.originalFilename} (${att.attachmentType})`, margin + 10, y, helvetica, 9);
      y -= lineHeight;
    });
    y -= sectionGap;
  }

  // ── Declaration ──────────────────────────────────────────────
  if (y < 100) { page = addPage(); y = pageHeight - margin; }

  drawText(page, 'DECLARATION', margin, y, helveticaBold, 11, rgb(0.08, 0.18, 0.38));
  drawLine(page, margin, y - 4, pageWidth - margin, y - 4);
  y -= 18;
  drawText(
    page,
    'The information entered in this development/demo system has been confirmed as accurate',
    margin, y, helvetica, 9
  );
  y -= lineHeight;
  drawText(page, 'by the authorized representative of the company.', margin, y, helvetica, 9);
  y -= sectionGap;

  // ── Digital Signatures ───────────────────────────────────────
  if (y < 200) { page = addPage(); y = pageHeight - margin; }

  drawText(page, 'DIGITAL SIGNATURES (DSC)', margin, y, helveticaBold, 11, rgb(0.08, 0.18, 0.38));
  drawLine(page, margin, y - 4, pageWidth - margin, y - 4);
  y -= 20;

  const dscAttachments = data.attachments.filter(a => a.attachmentType.startsWith('DSC_CERT'));

  const signers: { label: string; type: string; name?: string; din?: string }[] = [
    ...data.directors.map((d, i) => ({
      label: `Director ${i + 1}`,
      type: `DSC_CERT_${d.din}`,
      name: d.name,
      din: d.din,
    })),
    { label: 'Authorized Signatory / Declarant', type: 'DSC_CERT_DECLARANT' },
    { label: 'Certifying Professional (CA/CS/CWA)', type: 'DSC_CERT_PROFESSIONAL' },
  ];

  const boxW = (pageWidth - 2 * margin - 10) / 2;
  const boxH = 70;
  let col = 0;

  for (const signer of signers) {
    if (y < boxH + 20) { page = addPage(); y = pageHeight - margin; col = 0; }
    const x = margin + col * (boxW + 10);
    const signed = dscAttachments.some(a => a.attachmentType === signer.type);

    // Box
    page.drawRectangle({
      x, y: y - boxH, width: boxW, height: boxH,
      borderColor: signed ? rgb(0.09, 0.64, 0.29) : rgb(0.7, 0.7, 0.7),
      borderWidth: signed ? 1.5 : 0.75,
      color: signed ? rgb(0.94, 1, 0.96) : rgb(0.98, 0.98, 0.98),
    });

    drawText(page, signer.label, x + 6, y - 14, helveticaBold, 8, rgb(0.2, 0.2, 0.4));
    if (signer.name) drawText(page, signer.name, x + 6, y - 26, helvetica, 8);
    if (signer.din) drawText(page, `DIN: ${signer.din}`, x + 6, y - 37, helvetica, 7, rgb(0.4, 0.4, 0.4));

    if (signed) {
      drawText(page, '✓ DSC ATTACHED', x + 6, y - 50, helveticaBold, 8, rgb(0.09, 0.64, 0.29));
      drawText(page, 'DEMO — Certificate on file', x + 6, y - 61, helvetica, 7, rgb(0.4, 0.4, 0.4));
    } else {
      drawText(page, 'Signature box — DSC not attached', x + 6, y - 50, helvetica, 7, rgb(0.6, 0.6, 0.6));
      drawText(page, 'To be digitally signed', x + 6, y - 61, helvetica, 7, rgb(0.6, 0.6, 0.6));
    }

    col++;
    if (col >= 2) { col = 0; y -= boxH + 10; }
  }
  if (col > 0) y -= boxH + 10;

  // ── Footer disclaimer ────────────────────────────────────────
  const lastPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
  lastPage.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: 35,
    color: rgb(0.96, 0.96, 0.96),
  });
  drawText(
    lastPage,
    'THIS IS A DEMO DOCUMENT GENERATED BY A DEVELOPMENT PORTAL. IT IS NOT AN OFFICIAL GOVERNMENT DOCUMENT.',
    margin,
    14,
    helveticaBold,
    7,
    rgb(0.6, 0.1, 0.1)
  );

  // Page numbers
  pdfDoc.getPages().forEach((pg, idx) => {
    drawText(pg, `Page ${idx + 1} of ${pdfDoc.getPageCount()}`, pageWidth - 100, 14, helvetica, 8, rgb(0.5, 0.5, 0.5));
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
