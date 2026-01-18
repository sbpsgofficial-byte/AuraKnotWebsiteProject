'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { formatCurrency, formatCurrencyForPDF, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { WorkflowStatus, Expense, Payment } from '@/types';
import { calculateProfit } from '@/lib/calculations';
import { ExpenseForm } from '@/components/orders/ExpenseForm';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { PaymentEditForm } from '@/components/payments/PaymentEditForm';
import { jsPDF } from 'jspdf';

export default function OrderDetailPage() {
  const params = useParams();
  const { toast } = useToast();

  const [order, setOrder] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [quotation, setQuotation] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [finalBudget, setFinalBudget] = useState<number | ''>('');
  const [isEditingFinal, setIsEditingFinal] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [workflow, setWorkflow] = useState<WorkflowStatus>({
    photoSelection: 'No',
    albumDesign: 'No',
    albumPrinting: 'No',
    videoEditing: 'No',
    outdoorShoot: 'No',
    albumDelivery: 'No',
  });

  useEffect(() => {
    fetchOrderData();
  }, [params.id]);

  const fetchOrderData = async () => {
    try {
      const [orderRes, expensesRes, paymentsRes] = await Promise.all([
        fetch(`/api/orders/${params.id}`),
        fetch(`/api/expenses?orderId=${params.id}`),
        fetch(`/api/payments?orderId=${params.id}`),
      ]);

      const orderData = await orderRes.json();
      const expensesData = await expensesRes.json();
      const paymentsData = await paymentsRes.json();

      setOrder(orderData);
      setExpenses(expensesData);
      setPayments(paymentsData);

      // Fetch customer details
      if (orderData.customerId) {
        const c = await fetch(`/api/customers?id=${orderData.customerId}`);
        if (c.ok) {
          const cd = await c.json();
          setCustomer(cd);
          setCustomerName(cd.name || '');
        }
      }

      // Fetch quotation details
      if (orderData.quotationId) {
        const q = await fetch(`/api/quotations/${orderData.quotationId}`);
        if (q.ok) {
          const qd = await q.json();
          setQuotation(qd);
        }
      }

      if (orderData.workflowStatus) {
        const ws =
          typeof orderData.workflowStatus === 'string'
            ? JSON.parse(orderData.workflowStatus)
            : orderData.workflowStatus;
        setWorkflow(ws);
      }
      // initialize finalBudget state
      setFinalBudget(orderData.finalBudget ?? '');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- TOTALS ----------------
  const totalExpenses = expenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  const totalPayments = payments.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

  const profit = calculateProfit(Number(finalBudget || order?.finalBudget || 0), totalExpenses);

  const handleSaveFinalBudget = async () => {
    if (!order) return;
    const value = typeof finalBudget === 'string' ? parseFloat(finalBudget || '0') : finalBudget;
    try {
      const res = await fetch(`/api/orders/${order.orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalBudget: value }),
      });
      if (!res.ok) throw new Error('Failed to update final budget');
      // refresh
      await fetchOrderData();
      setIsEditingFinal(false);
      toast({ title: 'Success', description: 'Final budget updated' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Could not update final budget', variant: 'destructive' });
    }
  };

  const handleRemoveExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to remove this expense?')) return;
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove expense');
      await fetchOrderData();
      toast({ title: 'Success', description: 'Expense removed' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Could not remove expense', variant: 'destructive' });
    }
  };

  const handleRemovePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to remove this payment?')) return;
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove payment');
      await fetchOrderData();
      toast({ title: 'Success', description: 'Payment removed' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Could not remove payment', variant: 'destructive' });
    }
  };

  const handleWorkflowUpdate = async (field: keyof WorkflowStatus, value: string) => {
    if (!order) return;
    try {
      const updatedWorkflow = { ...workflow, [field]: value };
      const res = await fetch(`/api/orders/${order.orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowStatus: updatedWorkflow }),
      });
      if (!res.ok) throw new Error('Failed to update workflow');
      setWorkflow(updatedWorkflow);
      toast({ title: 'Success', description: 'Workflow updated' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Could not update workflow', variant: 'destructive' });
    }
  };

  // ---------------- PDF ----------------
  const handleDownloadPDF = () => {
    if (!order) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Header
    doc.setFillColor(50, 50, 50);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('AURA KNOT PHOTOGRAPHY', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Photography & Videography Services', pageWidth / 2, 30, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    yPos = 50;

    // Order Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER DETAILS', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Comprehensive Order Report & Financial Summary', pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    // Order Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Order Information:', 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.text(`Order ID: ${order.orderId}`, 25, yPos);
    yPos += 6;
    doc.text(`Created Date: ${formatDate(order.createdAt)}`, 25, yPos);
    yPos += 6;
    doc.text(`Estimated Budget: ${formatCurrencyForPDF(order.estimatedBudget || 0)}`, 25, yPos);
    yPos += 6;
    doc.text(`Final Budget: ${formatCurrencyForPDF(order.finalBudget || 0)}`, 25, yPos);
    yPos += 10;

    // Section divider
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;

    // Customer Information
    if (customer) {
      doc.setFont('helvetica', 'bold');
      doc.text('Customer Information:', 20, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${customer.name || 'N/A'}`, 25, yPos);
      yPos += 6;
      doc.text(`Mobile: ${customer.mobile || 'N/A'}`, 25, yPos);
      yPos += 6;
      if (customer.email) {
        doc.text(`Email: ${customer.email}`, 25, yPos);
        yPos += 6;
      }
      if (customer.location) {
        doc.text(`Location: ${customer.location}`, 25, yPos);
        yPos += 6;
      }
      yPos += 8;

      // Section divider
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 8;
    }

    // Quotation Information
    if (quotation) {
      doc.setFont('helvetica', 'bold');
      doc.text('Event Details:', 20, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.text(`Quotation ID: ${quotation.quotationId}`, 25, yPos);
      yPos += 6;
      doc.text(`Event Type: ${quotation.eventType || 'N/A'}`, 25, yPos);
      yPos += 6;
      doc.text(`Event Date Start: ${formatDate(quotation.eventDateStart)}`, 25, yPos);
      yPos += 6;
      doc.text(`Event Date End: ${formatDate(quotation.eventDateEnd)}`, 25, yPos);
      yPos += 6;
      doc.text(`Location: ${quotation.location || 'N/A'}`, 25, yPos);
      yPos += 6;
      doc.text(`Package Type: ${quotation.packageType || 'N/A'}`, 25, yPos);
      yPos += 6;
      doc.text(`Session Type: ${quotation.sessionType || 'N/A'}`, 25, yPos);
      yPos += 10;

      // Services
      if (quotation.services) {
        doc.setFont('helvetica', 'bold');
        doc.text('Services:', 20, yPos);
        yPos += 8;

        doc.setFont('helvetica', 'normal');

        if (quotation.services.photography && quotation.services.photography.length > 0) {
          doc.text('Photography:', 25, yPos);
          yPos += 6;
          quotation.services.photography.forEach((service: any) => {
            doc.text(`• ${service.type} - ${service.stage} - ${service.session} (${service.cameraCount} cameras)`, 30, yPos);
            yPos += 5;
          });
          yPos += 2;
        }

        if (quotation.services.videography && quotation.services.videography.length > 0) {
          doc.text('Videography:', 25, yPos);
          yPos += 6;
          quotation.services.videography.forEach((service: any) => {
            doc.text(`• ${service.type} - ${service.stage} - ${service.session} (${service.cameraCount} cameras)`, 30, yPos);
            yPos += 5;
          });
          yPos += 2;
        }

        if (quotation.services.additional && quotation.services.additional.length > 0) {
          doc.text('Additional Services:', 25, yPos);
          yPos += 6;
          quotation.services.additional.forEach((service: any) => {
            doc.text(`• ${service.name}${service.customName ? ` (${service.customName})` : ''} - ${service.session}`, 30, yPos);
            yPos += 5;
          });
          yPos += 2;
        }
        yPos += 10;
      }

      // Deliverables
      if (quotation.deliverables) {
        const deliverables = typeof quotation.deliverables === 'string'
          ? JSON.parse(quotation.deliverables)
          : quotation.deliverables;

        doc.setFont('helvetica', 'bold');
        doc.text('Deliverables:', 20, yPos);
        yPos += 8;

        doc.setFont('helvetica', 'normal');
        if (deliverables.albumSize) doc.text(`Album Size: ${deliverables.albumSize}`, 25, yPos), yPos += 6;
        if (deliverables.numberOfAlbums) doc.text(`Number of Albums: ${deliverables.numberOfAlbums}`, 25, yPos), yPos += 6;
        if (deliverables.sheetsPerAlbum) doc.text(`Sheets per Album: ${deliverables.sheetsPerAlbum}`, 25, yPos), yPos += 6;
        if (deliverables.totalSheets) doc.text(`Total Sheets: ${deliverables.totalSheets}`, 25, yPos), yPos += 6;
        if (deliverables.totalPhotosForSelection) doc.text(`Total Photos for Selection: ${deliverables.totalPhotosForSelection}`, 25, yPos), yPos += 6;
        if (deliverables.digital !== undefined) doc.text(`Digital Delivery: ${deliverables.digital ? 'Yes' : 'No'}`, 25, yPos), yPos += 6;
        if (deliverables.printGifts !== undefined) doc.text(`Print Gifts: ${deliverables.printGifts ? 'Yes' : 'No'}`, 25, yPos), yPos += 6;
        if (deliverables.others !== undefined) doc.text(`Others: ${deliverables.others ? 'Yes' : 'No'}`, 25, yPos), yPos += 6;
        yPos += 10;
      }

      doc.text(`Quotation Total: ${formatCurrencyForPDF(quotation.manualTotal || quotation.customerTotal)}`, 25, yPos);
      yPos += 8;

      // Section divider
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 8;
    }

    // Workflow Status
    doc.setFont('helvetica', 'bold');
    doc.text('Workflow Status:', 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    Object.entries(workflow).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      doc.text(`${label}: ${value}`, 25, yPos);
      yPos += 6;
    });
    yPos += 8;

    // Section divider
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;

    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    // Expenses
    doc.setFont('helvetica', 'bold');
    doc.text('Expenses:', 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    if (expenses.length === 0) {
      doc.text('No expenses recorded', 25, yPos);
      yPos += 6;
    } else {
      expenses.forEach((expense) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${expense.costHead}: ${formatCurrencyForPDF(Number(expense.amount))}`, 25, yPos);
        yPos += 5;
        if (expense.vendorName) {
          doc.setFontSize(10);
          doc.text(`Vendor: ${expense.vendorName}`, 30, yPos);
          yPos += 4;
          doc.setFontSize(12);
        }
        if (expense.description) {
          doc.setFontSize(10);
          doc.text(`Description: ${expense.description}`, 30, yPos);
          yPos += 4;
          doc.setFontSize(12);
        }
        if (expense.date) {
          doc.setFontSize(10);
          doc.text(`Date: ${formatDate(expense.date)}`, 30, yPos);
          yPos += 4;
          doc.setFontSize(12);
        }
        yPos += 2;
      });
    }
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Expenses: ${formatCurrencyForPDF(totalExpenses)}`, 25, yPos);
    yPos += 8;

    // Section divider
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;

    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    // Payments
    doc.setFont('helvetica', 'bold');
    doc.text('Payments:', 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    if (payments.length === 0) {
      doc.text('No payments recorded', 25, yPos);
      yPos += 6;
    } else {
      payments.forEach((payment) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${payment.paymentType}: ${formatCurrencyForPDF(payment.amount)}`, 25, yPos);
        yPos += 5;
        if (payment.date) {
          doc.setFontSize(10);
          doc.text(`Date: ${formatDate(payment.date)}`, 30, yPos);
          yPos += 4;
          doc.setFontSize(12);
        }
        if (payment.notes) {
          doc.setFontSize(10);
          doc.text(`Notes: ${payment.notes}`, 30, yPos);
          yPos += 4;
          doc.setFontSize(12);
        }
        yPos += 2;
      });
    }
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Payments: ${formatCurrencyForPDF(totalPayments)}`, 25, yPos);
    yPos += 8;

    // Section divider
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;

    // Financial Summary
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary:', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    const balance = (order.finalBudget || 0) - totalPayments;
    doc.text(`Final Budget: ${formatCurrencyForPDF(order.finalBudget || 0)}`, 25, yPos);
    yPos += 6;
    doc.text(`Total Expenses: ${formatCurrencyForPDF(totalExpenses)}`, 25, yPos);
    yPos += 6;
    doc.text(`Total Payments: ${formatCurrencyForPDF(totalPayments)}`, 25, yPos);
    yPos += 6;
    doc.text(`Outstanding Balance: ${formatCurrencyForPDF(balance)}`, 25, yPos);
    yPos += 6;
    doc.text(`Profit: ${formatCurrencyForPDF(profit)}`, 25, yPos);

    // Footer
    const footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for choosing Aura Knot Photography', pageWidth / 2, footerY, { align: 'center' });
    doc.text('This is a computer-generated order report', pageWidth / 2, footerY + 5, { align: 'center' });

    doc.save(`Order-${order.orderId}-Details.pdf`);

    toast({
      title: 'Success',
      description: 'Detailed PDF downloaded successfully',
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl">
                Order {order.orderId} {customerName && `- ${customerName}`}
              </CardTitle>
              <CardDescription>
                Created: {formatDate(order.createdAt)}
              </CardDescription>
            </div>
            <Button onClick={handleDownloadPDF} className="w-full lg:w-auto">
              Download Detailed PDF
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Budgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div>
              <Label>Estimated Budget</Label>
              <div className="font-bold text-lg">{formatCurrency(order.estimatedBudget || 0)}</div>
            </div>
            <div>
              <Label>Final Budget</Label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                {!isEditingFinal ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="font-bold text-lg">{formatCurrency(order.finalBudget || 0)}</div>
                    <Button variant="outline" onClick={() => setIsEditingFinal(true)} size="sm">
                      Edit
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={finalBudget as any}
                      onChange={(e) => setFinalBudget(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                      className="w-full sm:w-auto"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSaveFinalBudget} size="sm">Save</Button>
                      <Button variant="outline" onClick={() => { setIsEditingFinal(false); setFinalBudget(order.finalBudget ?? ''); }} size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setShowExpenseForm((s) => !s)} size="sm" className="w-full sm:w-auto">
                {showExpenseForm ? 'Close Expense' : 'Add Expense'}
              </Button>
              <Button variant="outline" onClick={() => setShowPaymentForm((s) => !s)} size="sm" className="w-full sm:w-auto">
                {showPaymentForm ? 'Close Payment' : 'Add Payment'}
              </Button>
            </div>
          </div>

          {/* Workflow Status */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Photo Selection</Label>
                  <Select value={workflow.photoSelection} onValueChange={(value) => handleWorkflowUpdate('photoSelection', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes 🟢</SelectItem>
                      <SelectItem value="No">No 🔴</SelectItem>
                      <SelectItem value="Not needed">Not Needed 🟢</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Album Design</Label>
                  <Select value={workflow.albumDesign} onValueChange={(value) => handleWorkflowUpdate('albumDesign', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes 🟢</SelectItem>
                      <SelectItem value="No">No 🔴</SelectItem>
                      <SelectItem value="Not needed">Not Needed 🟢</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Album Printing</Label>
                  <Select value={workflow.albumPrinting} onValueChange={(value) => handleWorkflowUpdate('albumPrinting', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes 🟢</SelectItem>
                      <SelectItem value="No">No 🔴</SelectItem>
                      <SelectItem value="Not needed">Not Needed 🟢</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Video Editing</Label>
                  <Select value={workflow.videoEditing} onValueChange={(value) => handleWorkflowUpdate('videoEditing', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes 🟢</SelectItem>
                      <SelectItem value="No">No 🔴</SelectItem>
                      <SelectItem value="Not needed">Not Needed 🟢</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Outdoor Shoot</Label>
                  <Select value={workflow.outdoorShoot} onValueChange={(value) => handleWorkflowUpdate('outdoorShoot', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes 🟢</SelectItem>
                      <SelectItem value="No">No 🔴</SelectItem>
                      <SelectItem value="Not needed">Not Needed 🟢</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Album Delivery</Label>
                  <Select value={workflow.albumDelivery} onValueChange={(value) => handleWorkflowUpdate('albumDelivery', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes 🟢</SelectItem>
                      <SelectItem value="No">No 🔴</SelectItem>
                      <SelectItem value="Not needed">Not Needed 🟢</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {editingExpense && (
                <div className="mb-4">
                  <ExpenseForm 
                    orderId={params.id as string} 
                    expense={editingExpense} 
                    onSuccess={() => { setEditingExpense(null); fetchOrderData(); }} 
                    onCancel={() => setEditingExpense(null)} 
                  />
                </div>
              )}
              {showExpenseForm && !editingExpense && (
                <div className="mb-4">
                  <ExpenseForm orderId={params.id as string} onSuccess={() => { setShowExpenseForm(false); fetchOrderData(); }} />
                </div>
              )}
              {expenses.length > 0 ? (
                <>
                  {expenses.map((e) => (
                    <div key={e.expenseId} className="border-b pb-2 mb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{e.costHead}</div>
                          <div className="text-sm text-gray-600">
                            {e.vendorName && <span>Vendor: {e.vendorName} | </span>}
                            Date: {formatDate(e.date)}
                            {e.description && <span> | {e.description}</span>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{formatCurrency(Number(e.amount))}</span>
                          <Button size="sm" variant="outline" onClick={() => setEditingExpense(e)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRemoveExpense(e.expenseId)}>Remove</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t mt-2 pt-2 font-bold">
                    Total: {formatCurrency(totalExpenses)}
                  </div>
                </>
              ) : (
                <p className="text-gray-500">No expenses recorded yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {showPaymentForm && (
                <div className="mb-4">
                  <PaymentForm orderId={params.id as string} estimated={Number(order?.finalBudget || 0)} onSuccess={() => { setShowPaymentForm(false); fetchOrderData(); }} />
                </div>
              )}
              {payments.length > 0 ? (
                <>
                  {payments.map((p) => (
                    <div key={p.paymentId} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{p.paymentType}</div>
                        <div className="text-sm text-gray-500">{formatDate(p.date)}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="font-bold">{formatCurrency(p.amount)}</div>
                        <Button size="sm" variant="outline" onClick={() => setEditingPayment(p)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRemovePayment(p.paymentId)}>Remove</Button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t mt-2 pt-2 font-bold">
                    Total: {formatCurrency(totalPayments)}
                  </div>
                </>
              ) : (
                <p className="text-gray-500">No payments recorded yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Profit */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-6">
              <div className="flex justify-between mb-4">
                <span className="text-xl font-semibold">Profit</span>
                <span
                  className={`text-3xl font-bold ${
                    profit >= 0 ? 'text-green-300' : 'text-red-300'
                  }`}
                >
                  {formatCurrency(profit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-lg font-medium">Balance</span>
                <span className="text-xl font-bold text-yellow-300">
                  {formatCurrency(Number(finalBudget || order?.finalBudget || 0) - totalPayments)}
                </span>
              </div>
            </CardContent>
          </Card>

          {editingPayment && (
            <div>
              <PaymentEditForm
                payment={editingPayment}
                onSuccess={() => { setEditingPayment(null); fetchOrderData(); }}
                onCancel={() => setEditingPayment(null)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}