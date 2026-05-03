import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Captures a DOM element's SVG chart as a PNG data URL.
 * Works by serializing the SVG, rendering it on a canvas.
 */
function captureChartAsImage(containerEl) {
  return new Promise((resolve) => {
    const svgEl = containerEl?.querySelector('svg');
    if (!svgEl) {
      resolve(null);
      return;
    }

    const svgClone = svgEl.cloneNode(true);
    const { width, height } = svgEl.getBoundingClientRect();

    // Ensure the clone has explicit dimensions
    svgClone.setAttribute('width', width);
    svgClone.setAttribute('height', height);
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Inline computed styles for proper rendering
    const allElements = svgClone.querySelectorAll('*');
    const originalElements = svgEl.querySelectorAll('*');
    allElements.forEach((el, i) => {
      const computed = window.getComputedStyle(originalElements[i]);
      el.style.cssText = computed.cssText;
    });

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const scale = 2; // Higher resolution
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsArrayBuffer(blob);
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Export sensor chart data to a fully-formatted Excel file.
 *
 * @param {Object} opts
 * @param {string} opts.title      - Sensor name (e.g., "Suhu Rumah Kaca")
 * @param {Array}  opts.data       - Chart data array [{time, value, label?}, ...]  (merged/averaged)
 * @param {string} opts.unit       - Unit string (e.g., "°C")
 * @param {HTMLElement} opts.chartRef - DOM ref to chart container for image capture
 * @param {string} [opts.rangeLabel]  - Human-readable date/time range for the export
 * @param {Array}  [opts.rawData]  - Original sensor rows from Supabase [{created_at, [dbKey]: value}, ...]
 * @param {string} [opts.dbKey]    - The column name in rawData to read values from
 * @param {string} [opts.selectedDate] - ISO date string used for per-hour filtering (YYYY-MM-DD)
 * @param {string} [opts.timeMode] - 'Perjam'|'Perhari'|'Perminggu'|'Perbulan' — controls raw-data filter
 * @param {string} [opts.spanLimit]   - e.g. "6 Hari" / "4 Minggu"
 * @param {string} [opts.selectedYear]- e.g. "2026"
 */
export async function exportSensorToExcel({
  title,
  data,
  unit,
  chartRef,
  rangeLabel,
  rawData,
  dbKey,
  selectedDate,
  timeMode,
  spanLimit,
  selectedYear,
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Dashboard Monitoring';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(title, {
    properties: { tabColor: { argb: '1E463A' } },
    pageSetup: { orientation: 'landscape' },
  });

  const trimUnit = (unit || '').trim();
  const now = new Date();

  // ─────────────────────────────────────────────────────────────
  //  Column layout:
  //  A–C : Raw individual readings table
  //  D   : spacer
  //  E–G : Merged/averaged summary table
  //  H   : spacer
  //  I–J : Stats
  // ─────────────────────────────────────────────────────────────
  sheet.getColumn(1).width = 6;   // A: No (raw)
  sheet.getColumn(2).width = 22;  // B: Timestamp (raw)
  sheet.getColumn(3).width = 16;  // C: Nilai (raw)
  sheet.getColumn(4).width = 3;   // D: spacer
  sheet.getColumn(5).width = 6;   // E: No (merged)
  sheet.getColumn(6).width = 20;  // F: Waktu (merged)
  sheet.getColumn(7).width = 16;  // G: Nilai (merged)
  sheet.getColumn(8).width = 3;   // H: spacer
  sheet.getColumn(9).width = 18;  // I: Stats label
  sheet.getColumn(10).width = 20; // J: Stats value

  // ── Title Row ──
  sheet.mergeCells('A1:G1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `Data Sensor: ${title}`;
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: '1E463A' } };
  titleCell.alignment = { vertical: 'middle' };
  sheet.getRow(1).height = 30;

  // ── Export info (Row 2) ──
  sheet.mergeCells('A2:G2');
  const infoCell = sheet.getCell('A2');
  infoCell.value = `Diekspor pada: ${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  infoCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '888888' } };
  sheet.getRow(2).height = 18;

  // ── Range label (Row 3) — shown only when rangeLabel is provided ──
  let headerRowNum = 4; // default: no range row
  if (rangeLabel) {
    sheet.mergeCells('A3:J3');
    const rangeCell = sheet.getCell('A3');
    rangeCell.value = `Rentang Data: ${rangeLabel}`;
    rangeCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    rangeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '385344' } };
    rangeCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet.getRow(3).height = 22;
    headerRowNum = 5; // push header + data down by 1
  }

  // ════════════════════════════════════════════════════
  //  LEFT TABLE: Raw individual readings (columns A–C)
  // ════════════════════════════════════════════════════

  // Sub-heading above raw table
  sheet.mergeCells(`A${headerRowNum - 1}:C${headerRowNum - 1}`);
  const rawSubHead = sheet.getCell(`A${headerRowNum - 1}`);
  rawSubHead.value = 'Data Pembacaan Mentah';
  rawSubHead.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
  rawSubHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2D6A4F' } };
  rawSubHead.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(headerRowNum - 1).height = 20;

  // Raw table header
  const rawHeaderRow = sheet.getRow(headerRowNum);
  rawHeaderRow.getCell(1).value = 'No';
  rawHeaderRow.getCell(2).value = 'Waktu';
  rawHeaderRow.getCell(3).value = `Nilai (${trimUnit})`;
  [1, 2, 3].forEach(col => {
    const cell = rawHeaderRow.getCell(col);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E463A' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { bottom: { style: 'thin', color: { argb: '1E463A' } } };
  });
  rawHeaderRow.height = 24;

  // Build raw readings list from rawData filtered to the current view
  const rawReadings = buildRawReadings(rawData, dbKey, timeMode, selectedDate, spanLimit, selectedYear);

  rawReadings.forEach((item, idx) => {
    const rowNum = headerRowNum + 1 + idx;
    const row = sheet.getRow(rowNum);

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = item.timestamp;
    row.getCell(3).value = item.value;

    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(3).alignment = { horizontal: 'center' };
    row.getCell(3).numFmt = '0.00';

    if ((idx + 1) % 2 === 0) {
      [1, 2, 3].forEach(col => {
        row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5EE' } };
      });
    }
    [1, 2, 3].forEach(col => {
      row.getCell(col).border = { bottom: { style: 'hair', color: { argb: 'E0E0E0' } } };
    });
  });

  if (rawReadings.length === 0) {
    const row = sheet.getRow(headerRowNum + 1);
    row.getCell(2).value = 'Belum ada data mentah';
    row.getCell(2).font = { name: 'Calibri', size: 11, italic: true, color: { argb: '999999' } };
    row.getCell(2).alignment = { horizontal: 'center' };
  }

  // ════════════════════════════════════════════════════
  //  RIGHT TABLE: Merged/averaged summary (columns E–G)
  // ════════════════════════════════════════════════════

  // Sub-heading above merged table
  sheet.mergeCells(`E${headerRowNum - 1}:G${headerRowNum - 1}`);
  const mergedSubHead = sheet.getCell(`E${headerRowNum - 1}`);
  mergedSubHead.value = 'Data Rata-Rata Per Periode';
  mergedSubHead.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
  mergedSubHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '385344' } };
  mergedSubHead.alignment = { horizontal: 'center', vertical: 'middle' };

  // Merged table header
  const mergedHeaderRow = sheet.getRow(headerRowNum);
  mergedHeaderRow.getCell(5).value = 'No';
  mergedHeaderRow.getCell(6).value = 'Waktu';
  mergedHeaderRow.getCell(7).value = `Nilai (${trimUnit})`;
  [5, 6, 7].forEach(col => {
    const cell = mergedHeaderRow.getCell(col);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '385344' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { bottom: { style: 'thin', color: { argb: '385344' } } };
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  let no = 1;
  const validValues = [];

  data.forEach((point) => {
    if (point.value !== null) {
      const dataRowNum = headerRowNum + no;
      const row = sheet.getRow(dataRowNum);
      const timeStr = point.label
        ? point.label
        : `${dateStr} ${String(point.time).padStart(2, '0')}:00`;

      row.getCell(5).value = no;
      row.getCell(6).value = timeStr;
      row.getCell(7).value = point.value;

      row.getCell(5).alignment = { horizontal: 'center' };
      row.getCell(6).alignment = { horizontal: 'center' };
      row.getCell(7).alignment = { horizontal: 'center' };
      row.getCell(7).numFmt = '0.00';

      if (no % 2 === 0) {
        [5, 6, 7].forEach(col => {
          row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F7F4' } };
        });
      }
      [5, 6, 7].forEach(col => {
        row.getCell(col).border = { bottom: { style: 'hair', color: { argb: 'E0E0E0' } } };
      });

      validValues.push(point.value);
      no++;
    }
  });

  // ════════════════════════════════════════════════════
  //  FAR RIGHT: Stats + Chart (columns I–J)
  // ════════════════════════════════════════════════════

  // Stats Header
  const statsHeaderRow = sheet.getRow(headerRowNum);
  statsHeaderRow.getCell(9).value = 'Statistik';
  statsHeaderRow.getCell(10).value = 'Nilai';
  [9, 10].forEach(col => {
    const cell = statsHeaderRow.getCell(col);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '385344' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  if (validValues.length > 0) {
    const minVal = Math.min(...validValues);
    const maxVal = Math.max(...validValues);
    const avgVal = validValues.reduce((a, b) => a + b, 0) / validValues.length;

    const statsData = [
      { label: 'Minimum', value: `${minVal.toFixed(2)} ${trimUnit}`, color: '3B82F6' },
      { label: 'Maksimum', value: `${maxVal.toFixed(2)} ${trimUnit}`, color: 'EF4444' },
      { label: 'Rata-Rata', value: `${avgVal.toFixed(2)} ${trimUnit}`, color: 'F59E0B' },
      { label: 'Total Data Mentah', value: `${rawReadings.length} pembacaan`, color: '6B7280' },
      { label: 'Total Data Rata-Rata', value: `${validValues.length} pembacaan`, color: '6B7280' },
    ];

    statsData.forEach((stat, idx) => {
      const row = sheet.getRow(headerRowNum + 1 + idx);
      row.getCell(9).value = stat.label;
      row.getCell(10).value = stat.value;
      row.getCell(9).font = { name: 'Calibri', size: 11, bold: true, color: { argb: stat.color } };
      row.getCell(10).font = { name: 'Calibri', size: 11, color: { argb: '333333' } };
      row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(9).border = { bottom: { style: 'hair', color: { argb: 'E0E0E0' } } };
      row.getCell(10).border = { bottom: { style: 'hair', color: { argb: 'E0E0E0' } } };
    });
  } else {
    const noDataRow = sheet.getRow(headerRowNum + 1);
    noDataRow.getCell(9).value = 'Belum ada data';
    noDataRow.getCell(9).font = { name: 'Calibri', size: 11, italic: true, color: { argb: '999999' } };
    noDataRow.getCell(9).alignment = { horizontal: 'center' };
  }

  // ── Chart Label & Image (pushed down by 1 extra row for the new Total Data stat) ──
  const chartLabelRowNum = headerRowNum + 7;
  const chartLabelRow = sheet.getRow(chartLabelRowNum);
  chartLabelRow.getCell(9).value = 'Grafik Data';
  chartLabelRow.getCell(9).font = { name: 'Calibri', size: 12, bold: true, color: { argb: '1E463A' } };

  if (chartRef) {
    try {
      const imageBuffer = await captureChartAsImage(chartRef);
      if (imageBuffer) {
        const imageId = workbook.addImage({
          buffer: imageBuffer,
          extension: 'png',
        });

        sheet.addImage(imageId, {
          tl: { col: 8, row: chartLabelRowNum + 0.5 },
          ext: { width: 500, height: 200 },
        });
      }
    } catch (err) {
      console.warn('Could not capture chart image for Excel:', err);
    }
  }

  // ── Freeze panes ──
  sheet.views = [{ state: 'frozen', ySplit: headerRowNum }];

  // ── Generate & Download ──
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `${title.toLowerCase().replace(/\s+/g, '_')}_${now.toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, fileName);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helper: extract individual raw readings filtered to the visible date range
// ─────────────────────────────────────────────────────────────────────────────
function buildRawReadings(rawData, dbKey, timeMode, selectedDate, spanLimit, selectedYear) {
  if (!rawData || !rawData.length || !dbKey) return [];

  let startMs, endMs;
  const now = new Date();

  if (timeMode === 'Perjam' || !timeMode) {
    // Default: today (or selectedDate)
    const base = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startMs = base.getTime();
    endMs = base.getTime() + 24 * 60 * 60 * 1000 - 1;
  } else if (timeMode === 'Perhari') {
    const spanDays = parseInt((spanLimit || '1').split(' ')[0], 10) || 1;
    const base = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startMs = base.getTime();
    endMs = base.getTime() + spanDays * 24 * 60 * 60 * 1000 - 1;
  } else if (timeMode === 'Perminggu') {
    const spanWeeks = parseInt((spanLimit || '1').split(' ')[0], 10) || 1;
    const base = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startMs = base.getTime();
    endMs = base.getTime() + spanWeeks * 7 * 24 * 60 * 60 * 1000 - 1;
  } else if (timeMode === 'Perbulan') {
    const year = parseInt(selectedYear || now.getFullYear(), 10);
    startMs = new Date(year, 0, 1).getTime();
    endMs = new Date(year + 1, 0, 1).getTime() - 1;
  } else {
    startMs = 0;
    endMs = Date.now();
  }

  const results = [];
  rawData.forEach(row => {
    const val = row[dbKey];
    if (val === undefined || val === null) return;
    const d = new Date(row.created_at);
    const ms = d.getTime();
    if (ms < startMs || ms > endMs) return;

    // Format: DD/MM/YYYY HH:MM:SS
    const pad = n => String(n).padStart(2, '0');
    const timestamp = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

    results.push({ timestamp, value: parseFloat(val) });
  });

  // Sort ascending by time
  results.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return results;
}
