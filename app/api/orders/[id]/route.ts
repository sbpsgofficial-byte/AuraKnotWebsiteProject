import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/google-auth';
import { sheetsClient } from '@/lib/google-sheets';
import { GOOGLE_SHEETS_SHEET_NAMES } from '@/config/constants';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.ORDERS);
    if (orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const headers = orders[0];
    const orderRow = orders.find((row: any[]) => row[0] === params.id);

    if (!orderRow) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order: any = {};
    headers.forEach((header, index) => {
      const value = orderRow[index] || '';
      if (header === 'workflowStatus') {
        order[header] = value ? JSON.parse(value) : {};
      } else {
        order[header] = value;
      }
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

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
    const rows = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.ORDERS);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updatedRow = [...rows[rowIndex - 1]];

    if (body.workflowStatus) {
      const workflowIndex = headers.indexOf('workflowStatus');
      if (workflowIndex >= 0) {
        updatedRow[workflowIndex] = JSON.stringify(body.workflowStatus);
      }
    }

    if (body.finalBudget !== undefined) {
      const finalIndex = headers.indexOf('finalBudget');
      if (finalIndex >= 0) {
        updatedRow[finalIndex] = body.finalBudget;
      }
    }

    await sheetsClient.updateRow(GOOGLE_SHEETS_SHEET_NAMES.ORDERS, rowIndex, updatedRow);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}
