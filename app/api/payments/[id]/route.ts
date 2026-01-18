import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/google-auth';
import { sheetsClient } from '@/lib/google-sheets';
import { GOOGLE_SHEETS_SHEET_NAMES } from '@/config/constants';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const rows = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.PAYMENTS);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const updatedRow = [...rows[rowIndex - 1]];

    // Update fields
    const headerMap: Record<string, number> = {};
    headers.forEach((header, idx) => {
      headerMap[header] = idx;
    });

    if (body.paymentType !== undefined) {
      const idx = headerMap['paymentType'] ?? headers.indexOf('paymentType');
      if (idx >= 0) updatedRow[idx] = body.paymentType;
    }

    if (body.amount !== undefined) {
      const idx = headerMap['amount'] ?? headers.indexOf('amount');
      if (idx >= 0) {
        updatedRow[idx] = body.amount;
      } else {
        // Legacy sheets may have paidAmount/balance columns — try to update paidAmount and recalc balance
        const paidIdx = headerMap['paidAmount'] ?? headers.indexOf('paidAmount');
        if (paidIdx >= 0) updatedRow[paidIdx] = body.amount;
        const estimatedIdx = headerMap['estimatedAmount'] ?? headers.indexOf('estimatedAmount');
        const balanceIdx = headerMap['balanceAmount'] ?? headers.indexOf('balanceAmount');
        if (estimatedIdx >= 0 && balanceIdx >= 0) {
          const estimated = parseFloat(updatedRow[estimatedIdx] || '0');
          updatedRow[balanceIdx] = estimated - Number(body.amount);
        }
      }
    }

    if (body.estimatedAmount !== undefined) {
      const idx = headerMap['estimatedAmount'] ?? headers.indexOf('estimatedAmount');
      if (idx >= 0) updatedRow[idx] = body.estimatedAmount;
    }

    if (body.paidAmount !== undefined) {
      const idx = headerMap['paidAmount'] ?? headers.indexOf('paidAmount');
      if (idx >= 0) updatedRow[idx] = body.paidAmount;
    }

    if (body.balanceAmount !== undefined) {
      const idx = headerMap['balanceAmount'] ?? headers.indexOf('balanceAmount');
      if (idx >= 0) updatedRow[idx] = body.balanceAmount;
    }

    if (body.date !== undefined) {
      const idx = headerMap['date'] ?? headers.indexOf('date');
      if (idx >= 0) updatedRow[idx] = body.date;
    }

    if (body.notes !== undefined) {
      const idx = headerMap['notes'] ?? headers.indexOf('notes');
      if (idx >= 0) updatedRow[idx] = body.notes || '';
    }

    await sheetsClient.updateRow(GOOGLE_SHEETS_SHEET_NAMES.PAYMENTS, rowIndex, updatedRow);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update payment' },
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

    const rows = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.PAYMENTS);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Clear the row by setting it to empty strings
    const emptyRow = new Array(headers.length).fill('');
    await sheetsClient.updateRow(GOOGLE_SHEETS_SHEET_NAMES.PAYMENTS, rowIndex, emptyRow);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete payment' },
      { status: 500 }
    );
  }
}
