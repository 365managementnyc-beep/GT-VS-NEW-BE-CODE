const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const ExcelJS = require('exceljs');

const getPDFBuffer = async (data, columnsNames, headerName) => {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 941.89]); // A4

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();

  const margin = 30;
  let y = height - margin;

  page.drawText(headerName, {
    x: margin,
    y,
    size: 18,
    font,
    color: rgb(0, 0, 0)
  });

  y -= 30;



  // Draw headers
  let x = margin;
  for (const col of columnsNames) {
    page.drawText(col.label, {
      x,
      y,
      size: 10,
      font,
      color: rgb(0, 0, 0)
    });
    x += col.width;
  }

  y -= 20;

  // Draw rows
  data.forEach((row, index) => {
    x = margin;
    for (const col of columnsNames) {
      const text = String(row[col.key]);
      page.drawText(text, {
        x,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0)
      });
      x += col.width;
    }
    y -= 20;
    if (y < margin) {
      y = height - margin;
      page = pdfDoc.addPage([595.28 + 50, 941.89]);
    }
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes).toString('base64');
};

// Generate Excel buffer
const getExcelBuffer = async (data, columnsNames, headerName) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(headerName);

  worksheet.columns = columnsNames.map((col) => ({
    header: col.label,
    key: col.key,
    width: col.width
  }));


  worksheet.addRows(data);
  return await workbook.xlsx.writeBuffer();
};

module.exports = { getPDFBuffer, getExcelBuffer };