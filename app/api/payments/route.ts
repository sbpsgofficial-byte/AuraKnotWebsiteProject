import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/google-auth';
import { sheetsClient, getPayments } from '@/lib/google-sheets';
import { GOOGLE_SHEETS_SHEET_NAMES } from '@/config/constants';
import { paymentSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    // Use single `amount` field for payments
    const amount = body.amount || 0;

    const paymentId = `PAY-${Date.now()}`;
    const paymentData = {
      paymentId,
      orderId: body.orderId,
      paymentType: body.paymentType,
      amount,
      date: body.date,
      notes: body.notes || '',
    };

      // Map to sheet headers if they exist, otherwise create a simple header set including `amount`
      const headers = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.PAYMENTS);
      if (headers.length === 0) {
        // Create a simple, compatible header row using `amount` for older sheets
        await sheetsClient.writeSheet(GOOGLE_SHEETS_SHEET_NAMES.PAYMENTS, [
          ['paymentId', 'orderId', 'paymentType', 'amount', 'date', 'notes'],
          [paymentData.paymentId, paymentData.orderId, paymentData.paymentType, paymentData.amount, paymentData.date, paymentData.notes],
        ]);
      } else {
        const headerRow: string[] = headers[0];
        const mappedRow = headerRow.map((h) => {
          switch (h) {
            case 'paymentId':
              return paymentData.paymentId;
            case 'orderId':
              return paymentData.orderId;
            case 'paymentType':
              return paymentData.paymentType;
            case 'amount':
              return paymentData.amount;
            case 'date':
              return paymentData.date;
            case 'notes':
              return paymentData.notes || '';
            default:
              return '';
          }
        });

        await sheetsClient.appendRow(GOOGLE_SHEETS_SHEET_NAMES.PAYMENTS, mappedRow);
      }

    return NextResponse.json({
      paymentId,
      orderId: body.orderId,
      paymentType: body.paymentType,
      amount,
      date: body.date,
      notes: body.notes,
    });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
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
    const balanceFilter = searchParams.get('balanceFilter') === 'true';

    let payments = await getPayments(orderId || undefined);
    
    // Filter by balance > 0 if requested
    if (balanceFilter) {
      payments = payments.filter((p: any) => {
        const balance = p.balanceAmount || ((p.estimatedAmount || 0) - (p.paidAmount || p.amount || 0)) || 0;
        return balance > 0;
      });
    }
    
    return NextResponse.json(payments);
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
