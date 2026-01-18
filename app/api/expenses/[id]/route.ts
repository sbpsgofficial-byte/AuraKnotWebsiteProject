import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/google-auth';
import { sheetsClient } from '@/lib/google-sheets';
import { GOOGLE_SHEETS_SHEET_NAMES } from '@/config/constants';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { costHead, amount, vendorName, description, date } = body;

    const rows = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.EXPENSES);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const headers = rows[0];
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === params.id) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Update the row
    const updatedRow = [...rows[rowIndex - 1]];
    const headerMap: Record<string, number> = {};
    headers.forEach((h, idx) => headerMap[h] = idx);

    if (costHead !== undefined) updatedRow[headerMap['costHead']] = costHead;
    if (amount !== undefined) updatedRow[headerMap['amount']] = amount;
    if (vendorName !== undefined) updatedRow[headerMap['vendorName']] = vendorName;
    if (description !== undefined) updatedRow[headerMap['description']] = description;
    if (date !== undefined) updatedRow[headerMap['date']] = date;

    await sheetsClient.updateRow(GOOGLE_SHEETS_SHEET_NAMES.EXPENSES, rowIndex, updatedRow);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update expense' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.EXPENSES);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const headers = rows[0];
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === params.id) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // To delete, we can clear the row or shift rows, but Google Sheets doesn't have direct delete.
    // For simplicity, clear the row by setting it to empty strings.
    const emptyRow = new Array(headers.length).fill('');
    await sheetsClient.updateRow(GOOGLE_SHEETS_SHEET_NAMES.EXPENSES, rowIndex, emptyRow);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete expense' },
      { status: 500 }
    );
  }
}