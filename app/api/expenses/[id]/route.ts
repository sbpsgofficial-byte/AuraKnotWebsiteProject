import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/google-auth';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
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

    // Prepare update data
    const updateData: any = {};
    if (costHead !== undefined) updateData.cost_head = costHead;
    if (amount !== undefined) updateData.amount = amount;
    if (vendorName !== undefined) updateData.vendor_name = vendorName;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = date;

    const { data, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
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

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting expense:', error);
      return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete expense' },
      { status: 500 }
    );
  }
}