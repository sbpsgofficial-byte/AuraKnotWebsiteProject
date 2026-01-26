'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Quotation, Deliverables } from '@/types';
import { generateQuotationPDF } from '@/lib/pdf-generator';

export default function QuotationViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const [remarks, setRemarks] = useState('');

  const fetchQuotation = useCallback(async () => {
    try {
      const response = await fetch(`/api/quotations/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setQuotation(data);
        
        // Fetch customer name
        if (data.customerId) {
          const customerRes = await fetch(`/api/customers?id=${data.customerId}`);
          if (customerRes.ok) {
            const customerData = await customerRes.json();
            setCustomerName(customerData.name || '');
          }
        }
        
        // If confirmed, find the order
        if (data.confirmedAt) {
          const ordersRes = await fetch('/api/orders');
          if (ordersRes.ok) {
            const orders = await ordersRes.json();
            const relatedOrder = orders.find((o: any) => o.quotationId === params.id);
            if (relatedOrder) {
              setOrderId(relatedOrder.orderId);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching quotation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchQuotation();
  }, [params.id, fetchQuotation]); // Re-run when quotation ID changes

  const handleDownloadPDF = async () => {
    try {
      // Always fetch fresh data from API before generating PDF
      const quotationResponse = await fetch(`/api/quotations/${params.id}`);
      if (!quotationResponse.ok) {
        throw new Error('Failed to fetch quotation data');
      }
      const freshQuotation = await quotationResponse.json();

      // Fetch fresh customer data
      let freshCustomerName = customerName;
      if (freshQuotation.customerId) {
        const customerRes = await fetch(`/api/customers?id=${freshQuotation.customerId}`);
        if (customerRes.ok) {
          const customerData = await customerRes.json();
          freshCustomerName = customerData.name || '';
        }
      }

      const deliverables = freshQuotation.deliverables
        ? (typeof freshQuotation.deliverables === 'string' ? JSON.parse(freshQuotation.deliverables) : freshQuotation.deliverables)
        : null;

      generateQuotationPDF(freshQuotation, freshCustomerName, deliverables);
      toast({ title: 'Success', description: 'PDF downloaded successfully' });
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (status: 'Confirmed' | 'Declined' | 'Pending') => {
    if (!quotation) return;

    if (status === 'Declined' && !remarks.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide remarks for declining the quotation',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/quotations/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          remarks: status === 'Declined' ? remarks : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quotation');
      }

      toast({
        title: 'Success',
        description: `Quotation ${status.toLowerCase()} successfully`,
      });

      if (status === 'Confirmed') {
        // Fetch the created order and navigate to it
        setTimeout(async () => {
          const ordersRes = await fetch('/api/orders');
          if (ordersRes.ok) {
            const orders = await ordersRes.json();
            const relatedOrder = orders.find((o: any) => o.quotationId === params.id);
            if (relatedOrder) {
              router.push(`/orders/${relatedOrder.orderId}`);
            } else {
              router.push('/orders');
            }
          } else {
            router.push('/orders');
          }
        }, 1000);
      } else {
        fetchQuotation();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update quotation',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div>Loading quotation...</div>;
  }

  if (!quotation) {
    return <div>Quotation not found</div>;
  }

  // Quotations can be edited even after confirmation
  const isLocked = false;
  const services = typeof quotation.services === 'string' 
    ? JSON.parse(quotation.services) 
    : quotation.services;
  const deliverables = quotation.deliverables
    ? (typeof quotation.deliverables === 'string'
        ? JSON.parse(quotation.deliverables)
        : quotation.deliverables)
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Quotation {quotation.quotationId}</CardTitle>
              <CardDescription>
                {customerName && <span className="font-semibold">{customerName} | </span>}
                Status: <span className={`font-semibold ${quotation.status === 'Confirmed' ? 'text-green-600' : quotation.status === 'Declined' ? 'text-red-600' : quotation.status === 'Pending' ? 'text-yellow-600' : 'text-gray-600'}`}>
                  {quotation.status}
                </span>
                {quotation.remarks && quotation.status === 'Declined' && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                    <span className="font-medium">Remarks:</span> {quotation.remarks}
                  </div>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadPDF}>
                Download PDF
              </Button>
              <Button variant="outline" onClick={() => router.push(`/quotations/new?quotationId=${params.id}`)}>
                Edit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Event Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Event Type:</span> {quotation.eventType}
              </div>
              <div>
                <span className="text-gray-600">Package:</span> {quotation.packageType}
              </div>
              <div>
                <span className="text-gray-600">Start Date:</span> {formatDate(quotation.eventDateStart)}
              </div>
              <div>
                <span className="text-gray-600">End Date:</span> {formatDate(quotation.eventDateEnd)}
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Location:</span> {quotation.location}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Services</h3>
            {services.photography && services.photography.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Photography</h4>
                {services.photography.map((service: any, idx: number) => (
                  <div key={idx} className="text-sm text-gray-600 mb-1">
                    {service.type} - {service.stage} ({service.cameraCount} cameras, {service.session})
                  </div>
                ))}
              </div>
            )}
            {services.videography && services.videography.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Videography</h4>
                {services.videography.map((service: any, idx: number) => (
                  <div key={idx} className="text-sm text-gray-600 mb-1">
                    {service.type} - {service.stage} ({service.cameraCount} cameras, {service.session})
                  </div>
                ))}
              </div>
            )}
            {services.additional && services.additional.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Additional Services</h4>
                {services.additional.map((service: any, idx: number) => (
                  <div key={idx} className="text-sm text-gray-600 mb-1">
                    {service.name} ({service.session})
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deliverables Display */}
          {deliverables && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Deliverables</h3>

              {deliverables.numberOfAlbums > 0 && (
                <div className="mb-2">
                  <div className="text-sm text-gray-600"><span className="font-medium">Albums:</span></div>
                  <div className="text-sm text-gray-700 ml-4">Number of Albums: {deliverables.numberOfAlbums}</div>
                  {deliverables.albumSize && <div className="text-sm text-gray-700 ml-4">Album Size: {deliverables.albumSize}</div>}
                  {deliverables.sheetsPerAlbum && <div className="text-sm text-gray-700 ml-4">Sheets per Album: {deliverables.sheetsPerAlbum}</div>}
                  {deliverables.totalSheets && <div className="text-sm text-gray-700 ml-4">Total Sheets: {deliverables.totalSheets}</div>}
                  {deliverables.totalPhotosForSelection && <div className="text-sm text-gray-700 ml-4">Total No. of photos for selection: {deliverables.totalPhotosForSelection}</div>}
                </div>
              )}

              {deliverables.services && (
                <div className="mb-2">
                  <div className="text-sm text-gray-600"><span className="font-medium">Services:</span></div>
                  <ul className="ml-4 list-disc text-sm text-gray-700">
                    {deliverables.services.dronePhotography && <li>Drone Photography</li>}
                    {deliverables.services.droneVideography && <li>Drone Videography</li>}
                    {deliverables.services.preWeddingShoot && <li>Pre-Wedding Shoot</li>}
                    {deliverables.services.postWeddingShoot && <li>Post-Wedding Shoot</li>}
                    {deliverables.services.outdoorShoot && <li>Outdoor Shoot</li>}
                  </ul>
                  {deliverables.sessionType && <div className="text-sm text-gray-700 ml-4">Session Type: {deliverables.sessionType}</div>}
                </div>
              )}

              {deliverables.digital && (
                <div className="mb-2">
                  <div className="text-sm text-gray-600"><span className="font-medium">Digital Deliverables:</span></div>
                  <ul className="ml-4 list-disc text-sm text-gray-700">
                    {deliverables.digital.allImagesJPEG && <li>All Images in JPEG (Pendrive)</li>}
                    {deliverables.digital.traditionalVideoPendrive && <li>Traditional Video (Pendrive)</li>}
                  </ul>
                </div>
              )}

              {deliverables.others && (
                <div className="mb-2">
                  <div className="text-sm text-gray-600"><span className="font-medium">Other Deliverables:</span></div>
                  <ul className="ml-4 list-disc text-sm text-gray-700">
                    {deliverables.others.cinematicTeaser && <li>Cinematic Teaser</li>}
                    {deliverables.others.cinematicHighlight && <li>Cinematic Highlight</li>}
                    {deliverables.others.aiFaceRecognitionImageDelivery && <li>AI Face Recognition Image Delivery</li>}
                    {deliverables.others.saveTheDateReels && <li>Save The Date Reels</li>}
                    {deliverables.others.premiumAlbumBox && <li>Premium Album Box</li>}
                    {deliverables.others.extraFrame && <li>Extra Frame</li>}
                    {deliverables.others.otherWorks && deliverables.others.otherWorksText && <li>Other Works: {deliverables.others.otherWorksText}</li>}
                  </ul>
                </div>
              )}

              {deliverables.printGifts && (
                <div className="mb-2">
                  <div className="text-sm text-gray-600"><span className="font-medium">Print & Gifts:</span></div>
                  <ul className="ml-4 list-disc text-sm text-gray-700">
                    {deliverables.printGifts.miniBook > 0 && <li>Mini Book: {deliverables.printGifts.miniBook}</li>}
                    {deliverables.printGifts.calendar > 0 && <li>Calendar: {deliverables.printGifts.calendar}</li>}
                    {deliverables.printGifts.portraitFrames > 0 && <li>Portrait Frames: {deliverables.printGifts.portraitFrames}</li>}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold">Total:</span>
              <span className="text-2xl font-bold">{formatCurrency(quotation.manualTotal || quotation.customerTotal)}</span>
            </div>
          </div>

          {!isLocked && (
            <div className="space-y-4 pt-4">
              {showRemarks && (
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks (Required for Decline)</Label>
                  <Input
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter reason for declining..."
                  />
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRemarks(true);
                    if (!showRemarks) return;
                    handleStatusChange('Declined');
                  }}
                  disabled={isUpdating}
                  className="w-full sm:w-auto"
                >
                  Decline
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRemarks(false);
                    handleStatusChange('Pending');
                  }}
                  disabled={isUpdating}
                  className="w-full sm:w-auto"
                >
                  {isUpdating ? 'Updating...' : 'Mark as Pending'}
                </Button>
                <Button
                  onClick={() => {
                    setShowRemarks(false);
                    handleStatusChange('Confirmed');
                  }}
                  disabled={isUpdating}
                  className="w-full sm:w-auto"
                >
                  {isUpdating ? 'Confirming...' : 'Confirm Quotation'}
                </Button>
              </div>
            </div>
          )}

          {isLocked && orderId && (
            <div className="pt-4">
              <Button onClick={() => router.push(`/orders/${orderId}`)}>
                View Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
