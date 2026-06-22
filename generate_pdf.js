const fs = require('fs');
const puppeteer = require('puppeteer-core');
const { marked } = require('marked');

async function generatePDF() {
  try {
    const mdContent = fs.readFileSync('report.md', 'utf-8');
    const htmlContent = marked.parse(mdContent);
    
    // Add some styling for the PDF
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1, h2, h3 { color: #2c3e50; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          hr { border: 0; border-top: 1px solid #eee; margin: 20px 0; }
          .page-break { page-break-after: always; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;
    
    const browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: "new"
    });
    
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: 'Project_Report.pdf',
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    });
    
    await browser.close();
    console.log('Successfully generated Project_Report.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

generatePDF();
