'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatCurrencyForPDF } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/ui/use-toast';
import { EVENT_TYPES } from '@/config/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ReportData {
  orderId: string;
  customerName: string;
  eventType: string;
  amount: number;
  expenses: number;
  profit: number;
  createdAt: string;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [category, setCategory] = useState<string>('all');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [reportType, category]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, customersRes, expensesRes, quotationsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/customers'),
        fetch('/api/expenses'),
        fetch('/api/quotations'),
      ]);

      const orders = await ordersRes.json();
      const customers = await customersRes.json();
      const expenses = await expensesRes.json();
      const quotations = await quotationsRes.json();

      const customerMap: Record<string, string> = {};
      customers.forEach((c: any) => {
        customerMap[c.customerId] = c.name;
      });

      const quotationMap: Record<string, any> = {};
      quotations.forEach((q: any) => {
        quotationMap[q.quotationId] = q;
      });

      const expenseMap: Record<string, number> = {};
      expenses.forEach((e: any) => {
        if (!expenseMap[e.orderId]) {
          expenseMap[e.orderId] = 0;
        }
        expenseMap[e.orderId] += parseFloat(e.amount) || 0;
      });

      const now = new Date();
      const filteredOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.createdAt);
        const matchesPeriod = reportType === 'monthly'
          ? orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
          : orderDate.getFullYear() === now.getFullYear();

        if (!matchesPeriod) return false;
        if (category === 'all') return true;

        // Filter by event type from quotation
        const quotation = quotationMap[order.quotationId];
        return quotation && quotation.eventType === category;
      });

      const data: ReportData[] = filteredOrders.map((order: any) => {
        const orderExpenses = expenseMap[order.orderId] || 0;
        const amount = parseFloat(order.finalBudget) || 0;
        const profit = amount - orderExpenses;
        const quotation = quotationMap[order.quotationId];
        
        return {
          orderId: order.orderId,
          customerName: customerMap[order.customerId] || 'Unknown',
          eventType: (quotation?.eventType && quotation.eventType !== 'undefined' && quotation.eventType.trim() !== '') ? quotation.eventType : 'Unknown',
          amount,
          expenses: orderExpenses,
          profit,
          createdAt: order.createdAt,
        };
      });

      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch report data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateReportData = () => {
    return [
      ['Order ID', 'Customer', 'Event Type', 'Amount', 'Expenses', 'Profit', 'Date'],
      ...reportData.map((row) => [
        row.orderId,
        row.customerName,
        row.eventType,
        row.amount,
        row.expenses,
        row.profit,
        formatDate(row.createdAt),
      ]),
    ];
  };

  const generatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Letterhead Design (Same as Quotation)
    doc.setFillColor(50, 50, 50);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('AURA KNOT PHOTOGRAPHY', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Photography & Videography Services', pageWidth / 2, 30, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);
    yPos = 50;

    // Report Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCIAL REPORT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Report Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Period: ${reportType}`, 20, yPos);
    doc.text(`Category: ${category}`, pageWidth / 2, yPos, { align: 'center' });
    doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 15;

    // Table Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const headers = ['Order ID', 'Customer', 'Event Type', 'Amount', 'Expenses', 'Profit', 'Date'];
    const colWidths = [25, 35, 30, 20, 20, 20, 25];
    let xPos = 20;

    headers.forEach((header, index) => {
      doc.text(header, xPos, yPos);
      xPos += colWidths[index];
    });
    yPos += 8;

    // Draw header line
    doc.setLineWidth(0.5);
    doc.line(20, yPos - 2, pageWidth - 20, yPos - 2);
    yPos += 5;

    // Table Data
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    reportData.forEach((row, index) => {
      if (yPos > pageHeight - 40) {
        // Add new page
        doc.addPage();
        yPos = 30;

        // Re-add letterhead on new page
        doc.setFillColor(50, 50, 50);
        doc.rect(0, 0, pageWidth, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('AURA KNOT PHOTOGRAPHY - Financial Report (Continued)', pageWidth / 2, 15, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        yPos = 35;

        // Re-add headers
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        xPos = 20;
        headers.forEach((header, headerIndex) => {
          doc.text(header, xPos, yPos);
          xPos += colWidths[headerIndex];
        });
        yPos += 8;
        doc.line(20, yPos - 2, pageWidth - 20, yPos - 2);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }

      xPos = 20;
      const rowData = [
        row.orderId,
        row.customerName.length > 15 ? row.customerName.substring(0, 15) + '...' : row.customerName,
        row.eventType,
        formatCurrencyForPDF(row.amount),
        formatCurrencyForPDF(row.expenses),
        formatCurrencyForPDF(row.profit),
        formatDate(row.createdAt)
      ];

      rowData.forEach((cell, cellIndex) => {
        doc.text(String(cell), xPos, yPos);
        xPos += colWidths[cellIndex];
      });
      yPos += 6;
    });

    // Summary Section
    yPos += 10;
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 30;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Summary:', 20, yPos);
    yPos += 8;

    const totalAmount = reportData.reduce((sum, row) => sum + row.amount, 0);
    const totalExpenses = reportData.reduce((sum, row) => sum + row.expenses, 0);
    const totalProfit = reportData.reduce((sum, row) => sum + row.profit, 0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Records: ${reportData.length}`, 25, yPos);
    yPos += 6;
    doc.text(`Total Revenue: ${formatCurrencyForPDF(totalAmount)}`, 25, yPos);
    yPos += 6;
    doc.text(`Total Expenses: ${formatCurrencyForPDF(totalExpenses)}`, 25, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(`Net Profit: ${formatCurrencyForPDF(totalProfit)}`, 25, yPos);

    // Footer
    const footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a computer-generated financial report', pageWidth / 2, footerY, { align: 'center' });
    doc.text('Aura Knot Photography - Professional Services', pageWidth / 2, footerY + 5, { align: 'center' });

    doc.save(`Financial-Report-${reportType}-${category}-${Date.now()}.pdf`);

    toast({
      title: 'Success',
      description: 'PDF report generated successfully',
    });
  };

  const generateExcel = async () => {
    try {
      const data = generateReportData();
      
      // Add summary row
      const totalAmount = reportData.reduce((sum, row) => sum + row.amount, 0);
      const totalExpenses = reportData.reduce((sum, row) => sum + row.expenses, 0);
      const totalProfit = reportData.reduce((sum, row) => sum + row.profit, 0);
      data.push([]);
      data.push(['TOTAL', '', totalAmount, totalExpenses, totalProfit, '']);

      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `report-${reportType}-${category}-${Date.now()}.xlsx`);
      
      toast({
        title: 'Success',
        description: 'Excel report generated successfully',
      });
    } catch (error: any) {
      console.error('Excel generation error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to generate Excel report',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold">Reports</h1>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Export reports in PDF or Excel format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Report Period</Label>
              <Select
                value={reportType}
                onValueChange={(value) => setReportType(value as 'monthly' | 'yearly')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {EVENT_TYPES.map((eventType) => (
                    <SelectItem key={eventType} value={eventType}>
                      {eventType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button onClick={generatePDF} disabled={isLoading || reportData.length === 0} className="flex-1 sm:flex-none">
              Export PDF
            </Button>
            <Button onClick={generateExcel} variant="outline" disabled={isLoading || reportData.length === 0} className="flex-1 sm:flex-none">
              Export Excel
            </Button>
          </div>
          {isLoading && <p className="text-sm text-gray-500">Loading report data...</p>}
          {!isLoading && reportData.length === 0 && (
            <p className="text-sm text-gray-500">No data available for the selected period and category.</p>
          )}
          {!isLoading && reportData.length > 0 && (
            <p className="text-sm text-gray-500">
              Found {reportData.length} order(s). Total Profit: {formatCurrency(reportData.reduce((sum, row) => sum + row.profit, 0))}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profit & Loss Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Report generation will be implemented with actual data from Google Sheets.</p>
        </CardContent>
      </Card>
    </div>
  );
}
