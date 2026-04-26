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
 * @param {string} opts.title - Sensor name (e.g., "Suhu Rumah Kaca")
 * @param {Array}  opts.data  - Chart data array [{time, value}, ...]
 * @param {string} opts.unit  - Unit string (e.g., "°C")
 * @param {HTMLElement} opts.chartRef - DOM ref to chart container for image capture
 */
export async function exportSensorToExcel({ title, data, unit, chartRef }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Dashboard Monitoring';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(title, {
    properties: { tabColor: { argb: '1E463A' } },
    pageSetup: { orientation: 'landscape' },
  });

  const trimUnit = (unit || '').trim();
  const now = new Date();

  // ── Column widths ──
  sheet.getColumn(1).width = 6;   // A: No
  sheet.getColumn(2).width = 20;  // B: Waktu
  sheet.getColumn(3).width = 18;  // C: Nilai
  sheet.getColumn(4).width = 3;   // D: spacer
  sheet.getColumn(5).width = 18;  // E: Stats label
  sheet.getColumn(6).width = 20;  // F: Stats value

  // ── Title Row ──
  sheet.mergeCells('A1:C1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `Data Sensor: ${title}`;
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: '1E463A' } };
  titleCell.alignment = { vertical: 'middle' };
  sheet.getRow(1).height = 30;

  // ── Export info ──
  sheet.mergeCells('A2:C2');
  const infoCell = sheet.getCell('A2');
  infoCell.value = `Diekspor pada: ${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  infoCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '888888' } };
  sheet.getRow(2).height = 20;

  // Row 3 is blank

  // ── Data Header Row (Row 4) ──
  const headerRowNum = 4;
  const headerRow = sheet.getRow(headerRowNum);
  headerRow.getCell(1).value = 'No';
  headerRow.getCell(2).value = 'Waktu';
  headerRow.getCell(3).value = `Nilai (${trimUnit})`;
  [1, 2, 3].forEach(col => {
    const cell = headerRow.getCell(col);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E463A' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { bottom: { style: 'thin', color: { argb: '1E463A' } } };
  });
  headerRow.height = 24;

  // ── Data Rows (starting Row 5) ──
  const today = new Date();
  const dateStr = today.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  let no = 1;
  const validValues = [];

  data.forEach((point) => {
    if (point.value !== null) {
      const dataRowNum = headerRowNum + no;
      const row = sheet.getRow(dataRowNum);
      const timeStr = `${dateStr} ${String(point.time).padStart(2, '0')}:00`;

      row.getCell(1).value = no;
      row.getCell(2).value = timeStr;
      row.getCell(3).value = point.value;

      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(2).alignment = { horizontal: 'center' };
      row.getCell(3).alignment = { horizontal: 'center' };
      row.getCell(3).numFmt = '0.00';

      if (no % 2 === 0) {
        [1, 2, 3].forEach(col => {
          row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F7F4' } };
        });
      }

      [1, 2, 3].forEach(col => {
        row.getCell(col).border = { bottom: { style: 'hair', color: { argb: 'E0E0E0' } } };
      });

      validValues.push(point.value);
      no++;
    }
  });

  // ════════════════════════════════════════════════════
  //  RIGHT SIDE: Stats + Chart (columns E-F, starting row 4)
  // ════════════════════════════════════════════════════

  // ── Stats Header (Row 4, same as data header) ──
  const statsHeaderRow = sheet.getRow(4);
  statsHeaderRow.getCell(5).value = 'Statistik';
  statsHeaderRow.getCell(6).value = 'Nilai';
  [5, 6].forEach(col => {
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
      { label: 'Total Data', value: `${validValues.length} pembacaan`, color: '6B7280' },
    ];

    statsData.forEach((stat, idx) => {
      const row = sheet.getRow(5 + idx);
      row.getCell(5).value = stat.label;
      row.getCell(6).value = stat.value;
      row.getCell(5).font = { name: 'Calibri', size: 11, bold: true, color: { argb: stat.color } };
      row.getCell(6).font = { name: 'Calibri', size: 11, color: { argb: '333333' } };
      row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(5).border = { bottom: { style: 'hair', color: { argb: 'E0E0E0' } } };
      row.getCell(6).border = { bottom: { style: 'hair', color: { argb: 'E0E0E0' } } };
    });
  } else {
    const noDataRow = sheet.getRow(5);
    noDataRow.getCell(5).value = 'Belum ada data';
    noDataRow.getCell(5).font = { name: 'Calibri', size: 11, italic: true, color: { argb: '999999' } };
    noDataRow.getCell(5).alignment = { horizontal: 'center' };
  }

  // ── Chart Label (Row 10) ──
  const chartLabelRow = sheet.getRow(10);
  chartLabelRow.getCell(5).value = 'Grafik 24 Jam';
  chartLabelRow.getCell(5).font = { name: 'Calibri', size: 12, bold: true, color: { argb: '1E463A' } };

  // ── Embed Chart Image (Row 11, columns E-F) ──
  if (chartRef) {
    try {
      const imageBuffer = await captureChartAsImage(chartRef);
      if (imageBuffer) {
        const imageId = workbook.addImage({
          buffer: imageBuffer,
          extension: 'png',
        });

        sheet.addImage(imageId, {
          tl: { col: 4, row: 10.5 },
          ext: { width: 500, height: 200 },
        });
      }
    } catch (err) {
      console.warn('Could not capture chart image for Excel:', err);
    }
  }

  // ── Freeze panes: freeze the header row ──
  sheet.views = [{ state: 'frozen', ySplit: 4 }];

  // ── Generate & Download ──
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `${title.toLowerCase().replace(/\s+/g, '_')}_${now.toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, fileName);
}

