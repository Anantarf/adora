const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function run() {
  const contentPdf = await PDFDocument.create();
  contentPdf.addPage();
  contentPdf.addPage();
  const contentBytes = await contentPdf.save();
  console.log('contentPdf pages:', (await PDFDocument.load(contentBytes)).getPageCount());

  const templatePdf = await PDFDocument.create();
  templatePdf.addPage();
  
  const contentLoaded = await PDFDocument.load(contentBytes);
  const contentPages = await templatePdf.embedPdf(contentLoaded);
  console.log('contentPages length:', contentPages.length);
  
  const [templatePage] = templatePdf.getPages();
  const blankTemplates = [];
  if (contentPages.length > 1) {
    blankTemplates.push(...await templatePdf.copyPages(templatePdf, Array(contentPages.length - 1).fill(0)));
  }
  console.log('blankTemplates length:', blankTemplates.length);

  templatePage.drawPage(contentPages[0], { x: 0, y: 0 });

  for (let index = 1; index < contentPages.length; index++) {
    const newPage = blankTemplates[index - 1];
    templatePdf.addPage(newPage);
    newPage.drawPage(contentPages[index], { x: 0, y: 0 });
  }

  const finalBytes = await templatePdf.save();
  const finalDoc = await PDFDocument.load(finalBytes);
  console.log('finalDoc pages:', finalDoc.getPageCount());
}
run();
