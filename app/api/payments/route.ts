import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/google-auth';
import { supabase } from '@/lib/supabase';
import { paymentSchema } from '@/lib/validations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = paymentSchema.parse(body);

    // Prepare payment data
    const paymentData = {
      order_id: validated.orderId,
      amount: validated.amount,
      payment_type: validated.paymentType,
      date: validated.date,
      notes: validated.notes || null,
    };

    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }

    return NextResponse.json({
      paymentId: data.id, // Use the auto-generated ID
      orderId: data.order_id,
      paymentType: data.payment_type,
      amount: data.amount,
      date: data.date,
      notes: data.notes,
      createdAt: data.created_at,
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

    let query = supabase
      .from('payments')
      .select(`
        *,
        orders (
          order_id,
          estimated_budget,
          final_budget,
          customers (
            customer_id,
            name,
            phone,
            email,
            address
          )
        )
      `)
      .order('date', { ascending: false });

    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    // Transform to match existing API format
    const payments = data.map(payment => ({
      paymentId: payment.id,
      orderId: payment.order_id,
      order: payment.orders ? {
        orderId: payment.orders.order_id,
        estimatedBudget: payment.orders.estimated_budget,
        finalBudget: payment.orders.final_budget,
        customer: payment.orders.customers ? {
          customerId: payment.orders.customers.customer_id,
          name: payment.orders.customers.name,
          mobile: payment.orders.customers.phone,
          email: payment.orders.customers.email,
          location: payment.orders.customers.address,
        } : null,
      } : null,
      paymentType: payment.payment_type,
      amount: payment.amount,
      date: payment.date,
      notes: payment.notes,
      createdAt: payment.created_at,
    }));

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
