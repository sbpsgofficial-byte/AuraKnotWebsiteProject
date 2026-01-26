const { spawn } = require('child_process');
const path = require('path');

/**
 * Generate PDF with customer data
 * @param {Object} customerData - Customer information
 * @param {string} customerData.quotationId
 * @param {string} customerData.date
 * @param {string} customerData.clientName
 * @param {string} customerData.eventDates
 * @param {string} customerData.location
 * @param {string} customerData.totalAmount
 * @returns {Promise<string>} Path to generated PDF
 */
function generateQuotationPDF(customerData) {
  return new Promise((resolve, reject) => {
    const pdfScriptPath = path.join(__dirname, '..', 'pdf-report', 'generate-pdf.js');

    const args = [
      customerData.quotationId || 'Q-AKP-26-0001',
      customerData.date || new Date().toLocaleDateString('en-GB'),
      customerData.clientName || 'Customer Name',
      customerData.eventDates || 'Event Dates',
      customerData.location || 'Event Location',
      customerData.totalAmount || '₹0'
    ];

    const child = spawn('node', [pdfScriptPath, ...args], {
      cwd: path.join(__dirname, '..', 'pdf-report'),
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        const pdfPath = path.join(__dirname, '..', 'pdf-report', 'quotation.pdf');
        resolve(pdfPath);
      } else {
        reject(new Error(`PDF generation failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

module.exports = { generateQuotationPDF };

// Example usage:
/*
const pdfGenerator = require('./pdf-generator-integration');

const customerData = {
  quotationId: 'Q-AKP-26-0005',
  date: '25 January 2026',
  clientName: 'Sarah Johnson',
  eventDates: '28 January 2026 – 29 January 2026',
  location: 'Royal Palace Hotel',
  totalAmount: '₹1,50,000'
};

generateQuotationPDF(customerData)
  .then(pdfPath => {
    console.log('PDF generated at:', pdfPath);
    // Now you can send the PDF file as response or save it
  })
  .catch(error => {
    console.error('Error generating PDF:', error);
  });
*/