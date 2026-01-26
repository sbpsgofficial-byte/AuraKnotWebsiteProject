const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Get command line arguments and process event dates
const args = process.argv.slice(2);
let eventDates = args[3] || '20 January 2026 – 21 January 2026';
// Convert common separators to em dash
eventDates = eventDates.replace(/\s*-\s*|\s*–\s*|\s*to\s*/gi, ' – ');

const customerData = {
  quotationId: args[0] || 'Q-AKP-26-0001',
  date: args[1] || '18 January 2026',
  clientName: args[2] || 'Naveen',
  eventDates: eventDates,
  location: args[4] || 'SSM Mahal',
  totalAmount: args[5] || '₹95,000'
};

(async () => {
  const htmlPath = path.resolve(__dirname, 'quotation.html');
  const logoPath = path.resolve(__dirname, 'assets', 'ak-logo-final.png');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Read HTML file
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Convert PNG logo to data URL for better PDF rendering
  let logoDataUrl = '';
  try {
    const logoContent = fs.readFileSync(logoPath);
    logoDataUrl = `data:image/png;base64,${logoContent.toString('base64')}`;
  } catch (error) {
    console.log('Logo file not found, using original path');
  }

  // Replace placeholders with actual data
  htmlContent = htmlContent
    .replace(/\{\{QUOTATION_ID\}\}/g, customerData.quotationId)
    .replace(/\{\{DATE\}\}/g, customerData.date)
    .replace(/\{\{CLIENT_NAME\}\}/g, customerData.clientName)
    .replace(/\{\{EVENT_DATES\}\}/g, customerData.eventDates)
    .replace(/\{\{LOCATION\}\}/g, customerData.location)
    .replace(/\{\{TOTAL_AMOUNT\}\}/g, customerData.totalAmount)
    .replace(/assets\/ak-logo-final\.png/g, logoDataUrl || 'assets/ak-logo-final.png')
    .replace(/assets\/ak-logo-final\.svg/g, logoDataUrl || 'assets/ak-logo-final.svg')
    // Also replace hardcoded values for backward compatibility
    .replace(/Q-AKP-26-0002/g, customerData.quotationId)
    .replace(/18 January 2026/g, customerData.date)
    .replace(/Naveen B T/g, customerData.clientName)
    .replace(/30 January 2026 – 31 January 2026/g, customerData.eventDates)
    .replace(/Cauvery Mahal/g, customerData.location)
    .replace(/₹1,00,000/g, customerData.totalAmount);

  // Set the modified HTML content
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const pdfPath = path.resolve(__dirname, 'quotation.pdf');
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });

  console.log('PDF generated at:', pdfPath);
  console.log('Customer Data Used:', customerData);
  await browser.close();
})();
