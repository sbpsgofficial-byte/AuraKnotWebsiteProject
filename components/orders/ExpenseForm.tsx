'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { expenseSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Expense } from '@/types';

interface ExpenseFormProps {
  orderId: string;
  onSuccess: () => void;
  expense?: Expense;
  onCancel?: () => void;
}

export function ExpenseForm({ orderId, onSuccess, expense, onCancel }: ExpenseFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense ? {
      orderId: expense.orderId,
      costHead: expense.costHead,
      amount: expense.amount,
      vendorName: expense.vendorName || '',
      description: expense.description || '',
      date: expense.date.split('T')[0],
    } : {
      orderId,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const method = expense ? 'PUT' : 'POST';
      const url = expense ? `/api/expenses/${expense.expenseId}` : '/api/expenses';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${expense ? 'update' : 'create'} expense`);
      }

      toast({
        title: 'Success',
        description: `Expense ${expense ? 'updated' : 'recorded'} successfully`,
      });

      reset();
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${expense ? 'update' : 'record'} expense`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{expense ? 'Edit Expense' : 'Add Expense'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="costHead">Cost Head *</Label>
            <Input
              id="costHead"
              {...register('costHead')}
              placeholder="e.g., Photographer rate, Video editing"
            />
            {errors.costHead && (
              <p className="text-sm text-red-500">{errors.costHead.message as string}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date.message as string}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorName">Vendor Name</Label>
            <Input
              id="vendorName"
              {...register('vendorName')}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="Optional"
            />
          </div>

          <div className="flex space-x-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (expense ? 'Updating...' : 'Adding...') : (expense ? 'Update Expense' : 'Add Expense')}
            </Button>
            {expense && onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
