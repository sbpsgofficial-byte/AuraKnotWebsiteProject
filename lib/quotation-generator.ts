import { sheetsClient } from './google-sheets';
import { GOOGLE_SHEETS_SHEET_NAMES, QUOTATION_PREFIX } from '@/config/constants';

export async function generateQuotationId(): Promise<string> {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const prefix = `${QUOTATION_PREFIX}-${currentYear}-`;

  try {
    // Read all quotations to find the highest number
    const rows = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.QUOTATIONS);
    
    let maxNumber = 0;
    
    if (rows.length > 1) {
      // Check header row
      const quotationIdIndex = rows[0]?.indexOf('quotationId') ?? -1;
      
      if (quotationIdIndex >= 0) {
        // Find max number from existing quotations for this year
        for (let i = 1; i < rows.length; i++) {
          const quotationId = rows[i][quotationIdIndex];
          if (quotationId && quotationId.startsWith(prefix)) {
            const numberStr = quotationId.replace(prefix, '');
            const number = parseInt(numberStr, 10);
            if (!isNaN(number) && number > maxNumber) {
              maxNumber = number;
            }
          }
        }
      }
    }

    const nextNumber = maxNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(4, '0');
    
    return `${prefix}${paddedNumber}`;
  } catch (error) {
    console.error('Error generating quotation ID:', error);
    // Fallback: use timestamp-based ID
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  }
}

export async function generateOrderId(): Promise<string> {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const prefix = `ORD-AKP-${currentYear}-`;

  try {
    const rows = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.ORDERS);
    
    let maxNumber = 0;
    
    if (rows.length > 1) {
      const orderIdIndex = rows[0]?.indexOf('orderId') ?? -1;
      
      if (orderIdIndex >= 0) {
        for (let i = 1; i < rows.length; i++) {
          const orderId = rows[i][orderIdIndex];
          if (orderId && orderId.startsWith(prefix)) {
            const numberStr = orderId.replace(prefix, '');
            const number = parseInt(numberStr, 10);
            if (!isNaN(number) && number > maxNumber) {
              maxNumber = number;
            }
          }
        }
      }
    }

    const nextNumber = maxNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(4, '0');
    
    return `${prefix}${paddedNumber}`;
  } catch (error) {
    console.error('Error generating order ID:', error);
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  }
}
