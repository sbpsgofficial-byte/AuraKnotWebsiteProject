'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Payment, PaymentType } from '@/types';
import { PAYMENT_TYPES } from '@/config/constants';

interface PaymentEditFormProps {
  payment: Payment;
  onSuccess: () => void;
  onCancel: () => void;
}

/* ================= SAFE NUMBER PARSER ================= */
const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  return (
    Number(
      String(value)
        .replace(/₹/g, '')
        .replace(/,/g, '')
        .trim()
    ) || 0
  );
};

/* ================= COMPONENT ================= */
export function PaymentEditForm({
  payment,
  onSuccess,
  onCancel,
}: PaymentEditFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [amount, setAmount] = useState<number>(toNumber((payment as any).amount));
  const [paymentType, setPaymentType] = useState<PaymentType>(payment.paymentType);
  const [date, setDate] = useState(payment.date.split('T')[0]);
  const [notes, setNotes] = useState(payment.notes || '');
  const [order, setOrder] = useState<any>(null);

  /* ================= FETCH ORDER ================= */
  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((orders) => {
        const foundOrder = Array.isArray(orders)
          ? orders.find((o: any) => o.orderId === payment.orderId)
          : null;
        if (foundOrder) setOrder(foundOrder);
      })
      .catch((error) => console.error('Error fetching order:', error));
  }, [payment.orderId]);

  /* ================= CALCULATIONS ================= */
  const finalBudget = toNumber(order?.finalBudget);
  const balanceAmount = finalBudget - amount;
  const safeBalanceAmount = Math.max(balanceAmount, 0);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/payments/${payment.paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType,
          amount,
          date,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update payment');
      }

      toast({
        title: 'Success',
        description: 'Payment updated successfully',
      });

      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update payment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================= UI ================= */
  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Payment</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label>Payment Type *</Label>
              <Select
                value={paymentType}
                onValueChange={(value) =>
                  setPaymentType(value as PaymentType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) =>
                  setAmount(parseFloat(e.target.value) || 0)
                }
                required
                onWheel={(e) =>
                  (e.currentTarget as HTMLInputElement).blur()
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Total Balance Amount</Label>
              <Input
                type="text"
                value={safeBalanceAmount.toLocaleString('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                })}
                disabled
                className="bg-gray-100 dark:bg-gray-800"
              />
              <p className="text-xs text-gray-500">
                Calculated automatically: Final Budget − Amount
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Payment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
