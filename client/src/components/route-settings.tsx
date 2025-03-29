import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { routeSettings } from '@shared/schema';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InsertRouteSettings, RouteSettings } from '@shared/schema';

const formSchema = createInsertSchema(routeSettings).pick({
  shortestDistance: true,
  realTimeTraffic: true,
  avoidHighways: true,
  avoidTolls: true,
  minimizeLeftTurns: true,
  startingPoint: true,
  returnToStart: true,
});

type RouteSettingsFormValues = z.infer<typeof formSchema>;

interface RouteSettingsFormProps {
  onSubmit: (data: Partial<RouteSettings>) => void;
  isSubmitting?: boolean;
  defaultValues?: RouteSettings;
}

export function RouteSettingsForm({ 
  onSubmit, 
  isSubmitting = false, 
  defaultValues 
}: RouteSettingsFormProps) {
  const form = useForm<RouteSettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shortestDistance: true,
      realTimeTraffic: true,
      avoidHighways: false,
      avoidTolls: false,
      minimizeLeftTurns: false,
      startingPoint: 'Current Location',
      returnToStart: false,
      ...defaultValues,
    },
  });

  // Auto-submit when form values change
  const handleChange = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Card>
      <CardHeader className="p-4">
        <h2 className="text-lg font-semibold">Route Settings</h2>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <Form {...form}>
          <form onChange={handleChange} className="space-y-4">
            <FormField
              control={form.control}
              name="shortestDistance"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium text-primary-700 cursor-pointer">
                    Optimize for shortest distance
                  </FormLabel>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="realTimeTraffic"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium text-primary-700 cursor-pointer">
                    Consider real-time traffic
                  </FormLabel>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="avoidHighways"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium text-primary-700 cursor-pointer">
                    Avoid highways
                  </FormLabel>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="avoidTolls"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium text-primary-700 cursor-pointer">
                    Avoid tolls
                  </FormLabel>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="minimizeLeftTurns"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium text-primary-700 cursor-pointer">
                    Minimize left turns
                  </FormLabel>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="startingPoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-primary-700">Starting Point</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select starting point" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Current Location">Current Location</SelectItem>
                      <SelectItem value="Enter Custom Location">Enter Custom Location</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="returnToStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-primary-700">Return to Start</FormLabel>
                  <Select
                    value={field.value ? 'Yes' : 'No'}
                    onValueChange={(value) => field.onChange(value === 'Yes')}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Return to start point?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="Yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
