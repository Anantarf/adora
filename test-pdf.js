const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function run() {
  const contentPdf = await PDFDocument.create();
  const p1 = contentPdf.addPage();
  p1.drawText('Page 1 Content', { x: 50, y: 500, size: 50 });
  const p2 = contentPdf.addPage();
  p2.drawText('Page 2 Content', { x: 50, y: 500, size: 50 });
  const contentBytes = await contentPdf.save();

  const templatePdf = await PDFDocument.create();
  const tp1 = templatePdf.addPage();
  tp1.drawText('HEADER', { x: 50, y: 800, size: 30 });
  
  const contentLoaded = await PDFDocument.load(contentBytes);
  const contentPages = await templatePdf.embedPdf(contentLoaded);
  
  const [templatePage] = templatePdf.getPages();
  const blankTemplates = [];
  if (contentPages.length > 1) {
    blankTemplates.push(...await templatePdf.copyPages(templatePdf, Array(contentPages.length - 1).fill(0)));
  }

  templatePage.drawPage(contentPages[0], { x: 0, y: 0 });

  for (let index = 1; index < contentPages.length; index++) {
    const newPage = blankTemplates[index - 1];
    templatePdf.addPage(newPage);
    newPage.drawPage(contentPages[index], { x: 0, y: 0 });
  }

  fs.writeFileSync('test-out.pdf', await templatePdf.save());
  console.log('done');
}
run();
