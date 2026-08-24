// ============================================================
// FORESKILLS — REPORT PDF GENERATOR (client-side)
// Renders a generated report object into a formatted A4 PDF
// using jsPDF. No backend, no network calls. Every figure is
// taken verbatim from the report produced by the deterministic
// engines — nothing is invented here.
//
// Layout: A4 portrait, 18mm side margins, running header from
// page 2, footer with page numbers on every page, automatic
// page breaks with repeated table headers, wrapped text only
// (no cut-off or overlap).
// ============================================================

const A4 = { W: 210, H: 297 };
const MARGIN = { top: 22, bottom: 20, left: 18, right: 18 };
const CW = A4.W - MARGIN.left - MARGIN.right;
const CONTENT_BOTTOM = A4.H - MARGIN.bottom;

const C = {
  navy: [30, 58, 95],
  accent: [46, 94, 170],
  ink: [30, 41, 59],
  gray: [100, 116, 139],
  faint: [148, 163, 184],
  fill: [241, 245, 249],
  border: [203, 213, 225],
  white: [255, 255, 255],
  amberFill: [254, 243, 199],
  amberText: [146, 100, 8],
};

// jsPDF standard fonts use WinAnsi encoding — map unsupported glyphs.
function clean(value) {
  return String(value ?? '').replace(/\u20B9/g, 'Rs ').replace(/\s+/g, ' ').trim();
}

function humanize(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function fmtValue(v) {
  if (typeof v === 'number') {
    return Number.isInteger(v) && Math.abs(v) >= 1000 ? v.toLocaleString('en-IN') : String(v);
  }
  return String(v ?? '');
}

function slug(s) {
  return String(s).trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'Report';
}

/** Builds the full A4 document for a report. Exposed for testing. */
export async function buildReportDoc(report) {
  if (!report) throw new Error('No report to export');
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  let y = MARGIN.top;
  const lh = (pt) => pt * 0.3528 * 1.42;

  /** Ensures vertical space; starts a new page when needed. */
  function ensure(height) {
    if (y + height <= CONTENT_BOTTOM) return false;
    doc.addPage();
    y = MARGIN.top;
    return true;
  }

  function section(title) {
    y += 3;
    ensure(13);
    doc.setFont('helvetica', 'bold').setFontSize(11.5).setTextColor(...C.navy);
    doc.text(clean(title), MARGIN.left, y + 4);
    const ruleY = y + 6.4;
    doc.setDrawColor(...C.accent).setLineWidth(0.5);
    doc.line(MARGIN.left, ruleY, MARGIN.left + CW, ruleY);
    y = ruleY + 4.5;
  }

  function subhead(text) {
    y += 1.5;
    ensure(9);
    doc.setFont('helvetica', 'bold').setFontSize(8.6).setTextColor(...C.gray);
    doc.text(clean(text).toUpperCase(), MARGIN.left, y + 3);
    y += 5.4;
  }

  function para(text, { size = 9.5, style = 'normal', color = C.ink } = {}) {
    const lines = doc.setFont('helvetica', style).setFontSize(size).setTextColor(...color)
      .splitTextToSize(clean(text), CW);
    for (const line of lines) {
      ensure(lh(size));
      doc.text(line, MARGIN.left, y + lh(size) * 0.78);
      y += lh(size);
    }
    y += 1.5;
  }

  /** Label/value rows with wrapping and light separators. */
  function kvRows(pairs, labelW = 52) {
    pairs.forEach(([label, value], i) => {
      const valueLines = doc.setFont('helvetica', 'normal').setFontSize(9.5).splitTextToSize(clean(fmtValue(value)), CW - labelW - 3);
      const rowH = Math.max(7, valueLines.length * lh(9.5) + 2.2);
      ensure(rowH);
      doc.setFont('helvetica', 'bold').setFontSize(8.4).setTextColor(...C.gray);
      doc.text(clean(humanize(label)), MARGIN.left, y + 4.4);
      doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...C.ink);
      valueLines.forEach((line, j) => doc.text(line, MARGIN.left + labelW + 3, y + 4.4 + j * lh(9.5)));
      y += rowH;
      if (i < pairs.length - 1) {
        doc.setDrawColor(...C.border).setLineWidth(0.15);
        doc.line(MARGIN.left, y - 0.6, MARGIN.left + CW, y - 0.6);
      }
    });
    y += 2;
  }

  /** Grid of KPI cards, two per row, auto-shrinking long values. */
  function kpiCards(entries) {
    const gap = 4;
    const colW = (CW - gap) / 2;
    const cardH = 17;
    let rowY = y;
    entries.forEach(([label, rawValue], i) => {
      const col = i % 2;
      if (col === 0) {
        ensure(cardH + 4);
        rowY = y;
      }
      const x = col === 0 ? MARGIN.left : MARGIN.left + colW + gap;
      doc.setFillColor(...C.fill).setDrawColor(...C.border).setLineWidth(0.2);
      doc.roundedRect(x, rowY, colW, cardH, 1.6, 1.6, 'FD');

      doc.setFont('helvetica', 'bold').setFontSize(6.3).setTextColor(...C.gray);
      doc.text(clean(humanize(label)).toUpperCase(), x + 3, rowY + 5.6);

      const valueStr = clean(fmtValue(rawValue));
      let size = 10;
      let lines = doc.setFont('helvetica', 'bold').setFontSize(size).splitTextToSize(valueStr, colW - 6);
      while (lines.length > 2 && size > 7.2) {
        size -= 1;
        lines = doc.setFont('helvetica', 'bold').setFontSize(size).splitTextToSize(valueStr, colW - 6);
      }
      if (lines.length > 2) lines = [...lines.slice(0, 2)];
      const capped = lines.map((l, j) => (j === lines.length - 1 && l.length >= 46 ? `${l.slice(0, 45)}…` : l));
      capped.forEach((line, j) => {
        doc.setTextColor(...C.ink);
        doc.text(line, x + 3, rowY + 12 + j * (size * 0.3528 * 1.25));
      });

      if (col === 1 || i === entries.length - 1) y = rowY + cardH + 4;
    });
  }

  /** Zebra-striped table with header repeat after page breaks. */
  function table(keys, headers, rows) {
    const pad = 2.4;
    const fs = 8;
    const weights = keys.map((k) => Math.max(
      headers[k].length,
      Math.min(38, ...rows.map((r) => clean(fmtValue(r?.[k])).length)),
    ));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const widths = weights.map((w) => Math.max(16, (w / totalWeight) * CW));
    widths[widths.length - 1] += CW - widths.reduce((a, b) => a + b, 0);
    const numericCol = keys.map((k) => rows.every((r) => typeof r?.[k] === 'number'));

    const drawHeader = () => {
      ensure(10);
      doc.setFillColor(...C.navy);
      doc.rect(MARGIN.left, y, CW, 6.6, 'F');
      doc.setFont('helvetica', 'bold').setFontSize(7.4).setTextColor(...C.white);
      let x = MARGIN.left;
      keys.forEach((k, i) => {
        doc.text(headers[k].toUpperCase(), numericCol[i] ? x + widths[i] - pad : x + pad, y + 4.4, { align: numericCol[i] ? 'right' : 'left' });
        x += widths[i];
      });
      y += 6.6;
    };

    drawHeader();

    rows.forEach((row, idx) => {
      const cellLines = keys.map((k, i) => {
        const lines = doc.setFont('helvetica', 'normal').setFontSize(fs)
          .splitTextToSize(clean(fmtValue(row?.[k])), widths[i] - pad * 2);
        if (lines.length > 6) return [...lines.slice(0, 6).slice(0, 5), `${lines[5].slice(0, 30)}…`];
        return lines;
      });
      const maxLines = Math.max(...cellLines.map((a) => Math.max(a.length, 1)));
      const rowH = Math.max(6.4, maxLines * lh(fs) + 2.6);

      if (y + rowH > CONTENT_BOTTOM) {
        doc.addPage();
        y = MARGIN.top;
        drawHeader();
      }

      if (idx % 2 === 1) {
        doc.setFillColor(...C.fill);
        doc.rect(MARGIN.left, y, CW, rowH, 'F');
      }

      let x = MARGIN.left;
      keys.forEach((k, i) => {
        doc.setFont('helvetica', 'normal').setFontSize(fs).setTextColor(...C.ink);
        cellLines[i].forEach((line, j) => {
          doc.text(line, numericCol[i] ? x + widths[i] - pad : x + pad, y + 4.2 + j * lh(fs), { align: numericCol[i] ? 'right' : 'left' });
        });
        x += widths[i];
      });

      doc.setDrawColor(...C.border).setLineWidth(0.1);
      doc.line(MARGIN.left, y + rowH, MARGIN.left + CW, y + rowH);
      y += rowH;
    });
    y += 3;
  }

  function bullets(items) {
    items.forEach((item) => {
      const lines = doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...C.ink)
        .splitTextToSize(clean(item), CW - 6);
      lines.forEach((line, j) => {
        ensure(lh(9));
        if (j === 0) {
          doc.setFillColor(...C.accent);
          doc.circle(MARGIN.left + 1.4, y + lh(9) * 0.55, 0.55, 'f');
        }
        doc.text(line, MARGIN.left + 5.5, y + lh(9) * 0.78);
        y += lh(9);
      });
    });
    y += 1.5;
  }

  // ----------------------------------------------------------
  // COVER BLOCK (page 1)
  // ----------------------------------------------------------
  y = MARGIN.top + 2;
  doc.setFont('helvetica', 'bold').setFontSize(21).setTextColor(...C.navy);
  doc.text('FORESKILLS', MARGIN.left, y + 7);

  const tagW = 40;
  doc.setFillColor(...C.amberFill).setDrawColor(...C.amberText).setLineWidth(0.25);
  doc.roundedRect(A4.W - MARGIN.right - tagW, y, tagW, 6.4, 1.4, 1.4, 'FD');
  doc.setFont('helvetica', 'bold').setFontSize(6.6).setTextColor(...C.amberText);
  doc.text('REFERENCE DATA — DEMO', A4.W - MARGIN.right - tagW / 2, y + 4.1, { align: 'center' });

  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...C.gray);
  doc.text('Workforce Intelligence & Policy Simulation Platform', MARGIN.left, y + 12.5);
  doc.setDrawColor(...C.accent).setLineWidth(0.7);
  doc.line(MARGIN.left, y + 15.5, MARGIN.left + CW, y + 15.5);

  y += 22;
  doc.setFont('helvetica', 'bold').setFontSize(14.5).setTextColor(...C.ink);
  const typeLines = doc.splitTextToSize(clean(report.type || 'Report'), CW);
  typeLines.forEach((line) => {
    doc.text(line, MARGIN.left, y);
    y += 7;
  });
  y += 1;

  const districtName = clean(report.inputs?.district || report.inputs?.district_name || 'Maharashtra (state-wide)');
  const generatedAt = (() => {
    try {
      return new Date(report.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return clean(report.timestamp);
    }
  })();

  kvRows([
    ['District', districtName],
    ['Generated', generatedAt],
    ['Data status', 'Reference Dataset — demo data, not a live government feed'],
  ], 34);

  // ----------------------------------------------------------
  // SECTIONS
  // ----------------------------------------------------------
  const inputPairs = Object.entries(report.inputs || {});
  if (inputPairs.length) {
    section('Inputs');
    kvRows(inputPairs);
  }

  if (report.method) {
    section('Methodology');
    para(report.method);
  }

  const results = report.results || {};
  const scalars = [];
  const objectTables = [];
  const stringLists = [];
  const notes = [];
  for (const [key, value] of Object.entries(results)) {
    if (Array.isArray(value) && value.length && typeof value[0] === 'object' && value[0] !== null) objectTables.push([key, value]);
    else if (Array.isArray(value)) stringLists.push([key, value]);
    else if (typeof value === 'string' && value.length > 90) notes.push([key, value]);
    else scalars.push([key, value]);
  }

  if (scalars.length || objectTables.length || stringLists.length || notes.length) {
    section('Results');
    if (scalars.length) kpiCards(scalars);
    objectTables.forEach(([key, rows]) => {
      subhead(humanize(key));
      const keys = Object.keys(rows[0]);
      const headers = Object.fromEntries(keys.map((k) => [k, humanize(k)]));
      table(keys, headers, rows);
    });
    stringLists.forEach(([key, items]) => {
      subhead(humanize(key));
      bullets(items);
    });
    notes.forEach(([key, value]) => {
      subhead(humanize(key));
      para(value);
    });
  }

  section('Confidence & Evidence');
  const conf = Math.max(0, Math.min(100, Number.parseFloat(report.confidence) || 0));
  ensure(14);
  doc.setFillColor(...C.fill).setDrawColor(...C.border).setLineWidth(0.2);
  doc.roundedRect(MARGIN.left, y, 80, 3.6, 1, 1, 'FD');
  doc.setFillColor(...C.accent);
  doc.roundedRect(MARGIN.left, y, Math.max(2, (80 * conf) / 100), 3.6, 1, 1, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...C.ink);
  doc.text(`${clean(report.confidence)}% confidence`, MARGIN.left + 84, y + 3.1);
  y += 9;
  if (Array.isArray(report.evidence) && report.evidence.length) bullets(report.evidence);

  y += 3;
  ensure(10);
  para(
    'This document was generated automatically from the FORESKILLS reference dataset. Figures are demo values produced by deterministic simulation engines and must not be treated as official statistics.',
    { size: 7.6, style: 'italic', color: C.gray },
  );

  // ----------------------------------------------------------
  // RUNNING HEADER + FOOTER ON EVERY PAGE
  // ----------------------------------------------------------
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    if (i > 1) {
      doc.setFont('helvetica', 'bold').setFontSize(8.5).setTextColor(...C.navy);
      doc.text('FORESKILLS', MARGIN.left, 13);
      doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...C.gray);
      doc.text(clean(report.type || 'Report'), A4.W - MARGIN.right, 13, { align: 'right' });
      doc.setDrawColor(...C.border).setLineWidth(0.2);
      doc.line(MARGIN.left, 15.5, A4.W - MARGIN.right, 15.5);
    }
    doc.setDrawColor(...C.border).setLineWidth(0.2);
    doc.line(MARGIN.left, A4.H - 12, A4.W - MARGIN.right, A4.H - 12);
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...C.faint);
    doc.text(`FORESKILLS · Reference Dataset (demo) · Generated ${generatedAt}`, MARGIN.left, A4.H - 8);
    doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...C.gray);
    doc.text(`Page ${i} of ${pages}`, A4.W - MARGIN.right, A4.H - 8, { align: 'right' });
  }

  return { doc, districtName };
}

/** Generates and saves the A4 PDF for a report. */
export async function downloadReportPdf(report) {
  const { doc, districtName } = await buildReportDoc(report);
  doc.save(`FORESKILLS-${slug(report.type)}-${slug(districtName.replace(/ \(.*\)$/, ''))}.pdf`);
}
