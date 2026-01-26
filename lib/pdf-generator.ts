import { formatCurrency, formatCurrencyForPDF, formatDate } from './utils';

function safeFormatDate(date: string | Date | undefined | null) {
  try {
    if (!date) return '';
    return formatDate(date as string | Date);
  } catch (e) {
    return '';
  }
}

export async function generateQuotationPDF(quotation: any, customerName: string, deliverables?: any | null): Promise<void> {
  try {
    // Make request to PDF API route
    const response = await fetch('/api/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quotationId: quotation.quotationId,
      }),
    });

    if (!response.ok) {
      // Attempt to read error details from server to aid debugging
      let errBody = '';
      try {
        errBody = await response.text();
      } catch (e) {
        // ignore
      }
      const msg = `Failed to generate PDF (status ${response.status}): ${errBody}`;
      console.error(msg);
      throw new Error(msg);
    }

    // Get the PDF blob
    const pdfBlob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedCustomerName = customerName.replace(/[^a-zA-Z0-9]/g, '-');
    link.download = `Quotation-${quotation.quotationId}-${sanitizedCustomerName}-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
