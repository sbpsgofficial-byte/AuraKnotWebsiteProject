import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/google-auth';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
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

    // Prepare update data
    const updateData: any = {};
    if (body.paymentType !== undefined) updateData.payment_type = body.paymentType;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment:', error);
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({
      paymentId: data.id,
      orderId: data.order_id,
      paymentType: data.payment_type,
      amount: data.amount,
      date: data.date,
      notes: data.notes,
      createdAt: data.created_at,
    });
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

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting payment:', error);
      return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete payment' },
      { status: 500 }
    );
  }
}
