const { PDFDocument } = require('pdf-lib');

async function run() {
  const doc = await PDFDocument.create();
  const p1 = doc.addPage();
  p1.drawText('Page 1');
  const [copied] = await doc.copyPages(doc, [0]);
  doc.addPage(copied);
  console.log('Pages:', doc.getPageCount());
}
run();
