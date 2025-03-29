import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { addresses } from '@shared/schema';
import { InsertAddress, Priority, TimeWindow } from '@shared/schema';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const formSchema = createInsertSchema(addresses).pick({
  fullAddress: true,
  timeWindow: true,
  priority: true,
  specialInstructions: true,
}).extend({
  fullAddress: z.string().min(1, "Address is required"),
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
      priority: Priority.NORMAL,
      specialInstructions: '',
      ...defaultValues,
    },
  });

  const handleSubmit = (data: AddressFormValues) => {
    onSubmit(data as InsertAddress);
    if (!defaultValues) {
      // Reset form if adding a new address
      form.reset({
        fullAddress: '',
        timeWindow: TimeWindow.ANY,
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
                  value={field.value}
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
                  value={field.value}
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
