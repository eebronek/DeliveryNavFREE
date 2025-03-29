import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { addresses } from '@shared/schema';
import { InsertAddress, Priority, TimeWindow } from '@shared/schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Clock } from 'lucide-react';

const formSchema = createInsertSchema(addresses).pick({
  fullAddress: true,
  timeWindow: true,
  exactDeliveryTime: true,
  priority: true,
  specialInstructions: true,
}).extend({
  fullAddress: z.string().min(1, "Address is required"),
  exactDeliveryTime: z.string().optional(),
});

type AddressFormValues = z.infer<typeof formSchema>;

interface AddressFormProps {
  onSubmit: (data: InsertAddress) => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<AddressFormValues>;
}

export function AddressForm({ onSubmit, isSubmitting = false, defaultValues }: AddressFormProps) {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullAddress: '',
      timeWindow: TimeWindow.ANY,
      exactDeliveryTime: '',
      priority: Priority.NORMAL,
      specialInstructions: '',
      ...defaultValues,
    },
  });

  const handleSubmit = (data: AddressFormValues) => {
    // Convert empty strings to null or default values where appropriate
    const formattedData: InsertAddress = {
      ...data,
      exactDeliveryTime: data.exactDeliveryTime || null,
      specialInstructions: data.specialInstructions || null,
      timeWindow: data.timeWindow || TimeWindow.ANY,
      priority: data.priority || Priority.NORMAL,
    };
    
    onSubmit(formattedData);
    
    if (!defaultValues) {
      // Reset form if adding a new address
      form.reset({
        fullAddress: '',
        timeWindow: TimeWindow.ANY,
        exactDeliveryTime: '',
        priority: Priority.NORMAL,
        specialInstructions: '',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-primary-700">Address</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter full address" 
                  className="border" 
                  {...field} 
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="timeWindow"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-primary-700">Time Window</FormLabel>
                <Select 
                  value={field.value || ''}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select time window" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={TimeWindow.ANY}>Any time</SelectItem>
                    <SelectItem value={TimeWindow.MORNING}>Morning (8AM-12PM)</SelectItem>
                    <SelectItem value={TimeWindow.AFTERNOON}>Afternoon (12PM-5PM)</SelectItem>
                    <SelectItem value={TimeWindow.EVENING}>Evening (5PM-8PM)</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-primary-700">Priority</FormLabel>
                <Select 
                  value={field.value || ''}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={Priority.NORMAL}>Normal</SelectItem>
                    <SelectItem value={Priority.HIGH}>High</SelectItem>
                    <SelectItem value={Priority.LOW}>Low</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="exactDeliveryTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-primary-700">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Exact Delivery Time</span>
                </div>
              </FormLabel>
              <FormControl>
                <Input 
                  type="time"
                  placeholder="e.g. 14:30" 
                  className="border" 
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-xs text-gray-500">
                Set a specific delivery time for time-sensitive orders
              </FormDescription>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="specialInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-primary-700">Special Instructions</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any delivery notes" 
                  className="resize-none" 
                  rows={2}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Address
        </Button>
      </form>
    </Form>
  );
}
