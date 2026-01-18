"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { paymentSchema } from '@/lib/validations';
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
import { PAYMENT_TYPES } from '@/config/constants';
import { PaymentType } from '@/types';

interface PaymentFormProps {
  orderId: string;
  estimated?: number;
  onSuccess: () => void;
}

export function PaymentForm({ orderId, estimated = 0, onSuccess }: PaymentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      orderId,
      paymentType: PAYMENT_TYPES[0],
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create payment');

      toast({ title: 'Success', description: 'Payment added' });
      reset({ orderId, paymentType: PAYMENT_TYPES[0], amount: 0, date: new Date().toISOString().split('T')[0], notes: '' });
      onSuccess();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Could not add payment', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keep balanceAmount in sync with estimatedAmount - paidAmount
  // no derived fields; single amount field
  const watchedAmount = watch('amount');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Type *</Label>
              <Select onValueChange={(v) => setValue('paymentType', v as PaymentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" {...register('date')} />
            </div>

            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Input {...register('notes')} placeholder="Optional notes" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Payment'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
