'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerFormSchema } from '@/lib/validations';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EVENT_TYPES, PACKAGE_TYPES, SESSION_TYPES } from '@/config/constants';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { LocationAutocomplete } from '@/components/ui/location-autocomplete';

export default function CustomerFormPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState('');
  const [locationCoordinates, setLocationCoordinates] = useState<{ lat: number; lng: number } | undefined>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerFormSchema),
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const customerData = {
        ...data,
        location,
        locationCoordinates,
      };
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        throw new Error('Failed to create customer');
      }

      const result = await response.json();
      toast({
        title: 'Success',
        description: 'Customer created successfully. Redirecting to quotation...',
      });
      
      // Redirect to quotation maker with customer ID
      router.push(`/quotations/new?customerId=${result.customerId}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create customer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">New Customer Form</CardTitle>
          <CardDescription>Enter customer and event details to create a quotation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter customer name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  {...register('mobile')}
                  placeholder="Enter mobile number"
                />
                {errors.mobile && (
                  <p className="text-sm text-red-500">{errors.mobile.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type *</Label>
                <Select
                  onValueChange={(value) => setValue('eventType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.eventType && (
                  <p className="text-sm text-red-500">{errors.eventType.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDateStart">Event Start Date *</Label>
                <Input
                  id="eventDateStart"
                  type="date"
                  {...register('eventDateStart')}
                />
                {errors.eventDateStart && (
                  <p className="text-sm text-red-500">{errors.eventDateStart.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDateEnd">Event End Date *</Label>
                <Input
                  id="eventDateEnd"
                  type="date"
                  {...register('eventDateEnd')}
                />
                {errors.eventDateEnd && (
                  <p className="text-sm text-red-500">{errors.eventDateEnd.message as string}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">Event Location *</Label>
                <LocationAutocomplete
                  value={location}
                  onChange={(value, coordinates) => {
                    setLocation(value);
                    setLocationCoordinates(coordinates);
                    setValue('location', value);
                  }}
                  placeholder="Enter event location or search on map"
                />
                {errors.location && (
                  <p className="text-sm text-red-500">{errors.location.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="packageType">Package Type *</Label>
                <Select
                  onValueChange={(value) => setValue('packageType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select package type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PACKAGE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.packageType && (
                  <p className="text-sm text-red-500">{errors.packageType.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionType">Session Type *</Label>
                <Select
                  onValueChange={(value) => setValue('sessionType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select session type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sessionType && (
                  <p className="text-sm text-red-500">{errors.sessionType.message as string}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Quotation'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
