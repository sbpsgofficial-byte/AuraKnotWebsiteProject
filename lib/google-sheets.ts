import { google } from 'googleapis';
import { GOOGLE_SHEETS_SHEET_NAMES } from '@/config/constants';

function getAuth() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    throw new Error('Google Service Account credentials not configured');
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

export interface SheetRow {
  [key: string]: any;
}

export class GoogleSheetsClient {
  private spreadsheetId: string;

  constructor() {
    this.spreadsheetId = SPREADSHEET_ID;
  }

  private async getSheets() {
    const auth = getAuth();
    return google.sheets({ version: 'v4', auth });
  }

  async readSheet(sheetName: string, range?: string): Promise<any[][]> {
    try {
      const sheets = await this.getSheets();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}${range ? `!${range}` : ''}`,
      });
      return response.data.values || [];
    } catch (error) {
      console.error('Error reading sheet:', error);
      throw error;
    }
  }

  async writeSheet(sheetName: string, values: any[][], range?: string): Promise<void> {
    try {
      const sheets = await this.getSheets();
      await sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}${range ? `!${range}` : ''}`,
        valueInputOption: 'RAW',
        requestBody: {
          values,
        },
      });
    } catch (error) {
      console.error('Error writing to sheet:', error);
      throw error;
    }
  }

  async appendRow(sheetName: string, values: any[]): Promise<void> {
    try {
      const sheets = await this.getSheets();
      await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [values],
        },
      });
    } catch (error) {
      console.error('Error appending row:', error);
      throw error;
    }
  }

  async updateRow(sheetName: string, rowIndex: number, values: any[]): Promise<void> {
    try {
      const sheets = await this.getSheets();
      await sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A${rowIndex}:Z${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [values],
        },
      });
    } catch (error) {
      console.error('Error updating row:', error);
      throw error;
    }
  }

  async deleteRow(sheetName: string, rowIndex: number): Promise<void> {
    try {
      const sheets = await this.getSheets();
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: await this.getSheetId(sheetName),
                  dimension: 'ROWS',
                  startIndex: rowIndex - 1, // 0-based
                  endIndex: rowIndex, // exclusive
                },
              },
            },
          ],
        },
      });
    } catch (error) {
      console.error('Error deleting row:', error);
      throw error;
    }
  }

  private async getSheetId(sheetName: string): Promise<number> {
    try {
      const sheets = await this.getSheets();
      const response = await sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      const sheet = response.data.sheets?.find(s => s.properties?.title === sheetName);
      if (!sheet?.properties?.sheetId) {
        throw new Error(`Sheet ${sheetName} not found`);
      }
      return sheet.properties.sheetId;
    } catch (error) {
      console.error('Error getting sheet ID:', error);
      throw error;
    }
  }

  async findRow(sheetName: string, columnIndex: number, searchValue: string): Promise<number | null> {
    try {
      const data = await this.readSheet(sheetName);
      for (let i = 1; i < data.length; i++) {
        if (data[i][columnIndex] === searchValue) {
          return i + 1; // Return 1-based row index
        }
      }
      return null;
    } catch (error) {
      console.error('Error finding row:', error);
      throw error;
    }
  }

  async batchRead(sheetNames: string[]): Promise<Record<string, any[][]>> {
    const result: Record<string, any[][]> = {};
    for (const sheetName of sheetNames) {
      result[sheetName] = await this.readSheet(sheetName);
    }
    return result;
  }
}

export const sheetsClient = new GoogleSheetsClient();

// Helper functions for specific data operations
export async function getCustomers(): Promise<any[]> {
  const rows = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.CUSTOMERS);
  if (rows.length === 0) return [];
  
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
}

export async function getQuotations(): Promise<any[]> {
  const rows = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.QUOTATIONS);
  if (rows.length === 0) return [];
  
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      const value = row[index] || '';
      // Parse JSON fields
      if (header === 'services' || header === 'locationCoordinates' || header === 'deliverables') {
        obj[header] = value ? JSON.parse(value) : null;
      } else if (header === 'manualTotal' || header === 'customerTotal') {
        obj[header] = value ? parseFloat(value) : 0;
      } else {
        obj[header] = value;
      }
    });
    return obj;
  });
}

export async function getOrders(): Promise<any[]> {
  const rows = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.ORDERS);
  if (rows.length === 0) return [];
  
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      const value = row[index] || '';
      if (header === 'workflowStatus') {
        obj[header] = value ? JSON.parse(value) : {};
      } else {
        obj[header] = value;
      }
    });
    return obj;
  });
}

export async function getExpenses(orderId?: string): Promise<any[]> {
  const rows = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.EXPENSES);
  if (rows.length === 0) return [];
  
  const headers = rows[0];
  const expenses = rows.slice(1).map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
  
  return orderId ? expenses.filter((e: any) => e.orderId === orderId) : expenses;
}

export async function getPayments(orderId?: string): Promise<any[]> {
  const rows = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.PAYMENTS);
  if (rows.length === 0) return [];
  
  const headers = rows[0];
  const payments = rows.slice(1).map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    
    // Backward compatibility: if old structure (has 'amount' but no 'estimatedAmount')
    if (obj.amount && !obj.estimatedAmount) {
      obj.estimatedAmount = parseFloat(obj.amount) || 0;
      obj.paidAmount = parseFloat(obj.amount) || 0;
      obj.balanceAmount = 0;
    }
    
    // Ensure numeric types
    if (obj.estimatedAmount) obj.estimatedAmount = parseFloat(obj.estimatedAmount) || 0;
    if (obj.paidAmount) obj.paidAmount = parseFloat(obj.paidAmount) || 0;
    if (obj.balanceAmount !== undefined) {
      obj.balanceAmount = parseFloat(obj.balanceAmount) || 0;
    } else if (obj.estimatedAmount !== undefined && obj.paidAmount !== undefined) {
      obj.balanceAmount = obj.estimatedAmount - obj.paidAmount;
    }
    
    return obj;
  });
  
  return orderId ? payments.filter((p: any) => p.orderId === orderId) : payments;
}
