import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/google-auth';
import { supabase } from '@/lib/supabase';
import { expenseSchema } from '@/lib/validations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = expenseSchema.parse(body);

    // Prepare expense data
    const expenseData = {
      order_id: validated.orderId,
      cost_head: validated.costHead,
      amount: validated.amount,
      vendor_name: validated.vendorName || null,
      description: validated.description || null,
      date: validated.date,
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }

    return NextResponse.json({
      expenseId: data.id,
      orderId: data.order_id,
      costHead: data.cost_head,
      amount: data.amount,
      vendorName: data.vendor_name,
      description: data.description,
      date: data.date,
      createdAt: data.created_at,
    });
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

    let query = supabase
      .from('expenses')
      .select(`
        *,
        orders (
          order_id,
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
      console.error('Error fetching expenses:', error);
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }

    // Transform to match existing API format
    const expenses = data.map(expense => ({
      expenseId: expense.id,
      orderId: expense.order_id,
      order: expense.orders ? {
        orderId: expense.orders.order_id,
        customer: expense.orders.customers ? {
          customerId: expense.orders.customers.customer_id,
          name: expense.orders.customers.name,
          mobile: expense.orders.customers.phone,
          email: expense.orders.customers.email,
          location: expense.orders.customers.address,
        } : null,
      } : null,
      costHead: expense.cost_head,
      amount: expense.amount,
      vendorName: expense.vendor_name,
      description: expense.description,
      date: expense.date,
      createdAt: expense.created_at,
    }));

    return NextResponse.json(expenses);
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}
