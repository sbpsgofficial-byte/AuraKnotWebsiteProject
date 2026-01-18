import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/google-auth';
import { sheetsClient, getExpenses } from '@/lib/google-sheets';
import { GOOGLE_SHEETS_SHEET_NAMES } from '@/config/constants';
import { expenseSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = expenseSchema.parse(body);

    const expenseId = `EXP-${Date.now()}`;
    const expenseData = [
      expenseId,
      validated.orderId,
      validated.costHead,
      validated.amount,
      validated.vendorName || '',
      validated.description || '',
      validated.date,
    ];

    const headers = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.EXPENSES);
    if (headers.length === 0) {
      await sheetsClient.writeSheet(GOOGLE_SHEETS_SHEET_NAMES.EXPENSES, [
        ['expenseId', 'orderId', 'costHead', 'amount', 'vendorName', 'description', 'date'],
        expenseData,
      ]);
    } else {
      await sheetsClient.appendRow(GOOGLE_SHEETS_SHEET_NAMES.EXPENSES, expenseData);
    }

    return NextResponse.json({ expenseId, ...validated });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create expense' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    const expenses = await getExpenses(orderId || undefined);
    return NextResponse.json(expenses);
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}
