import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RouteSettings, TrafficDataProvider } from '@shared/schema';
import { Separator } from '@/components/ui/separator';
import { CheckedState } from '@radix-ui/react-checkbox';

// Define form schema directly without using drizzle-zod
const formSchema = z.object({
  shortestDistance: z.boolean().default(true),
  realTimeTraffic: z.boolean().default(true),
  avoidHighways: z.boolean().default(false),
  avoidTolls: z.boolean().default(false),
  minimizeLeftTurns: z.boolean().default(false),
  startingPoint: z.string().default('Current Location'),
  returnToStart: z.boolean().default(false),
  offlineMode: z.boolean().default(false),
  trafficDataProvider: z.string().default(TrafficDataProvider.OPENDATA),
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
      shortestDistance: defaultValues?.shortestDistance ?? true,
      realTimeTraffic: defaultValues?.realTimeTraffic ?? true,
      avoidHighways: defaultValues?.avoidHighways ?? false,
      avoidTolls: defaultValues?.avoidTolls ?? false,
      minimizeLeftTurns: defaultValues?.minimizeLeftTurns ?? false,
      startingPoint: defaultValues?.startingPoint ?? 'Current Location',
      returnToStart: defaultValues?.returnToStart ?? false,
      offlineMode: defaultValues?.offlineMode ?? false,
      trafficDataProvider: defaultValues?.trafficDataProvider ?? TrafficDataProvider.OPENDATA,
    },
  });

  // Handle checkbox changes properly
  const handleCheckboxChange = (field: any, value: CheckedState) => {
    field.onChange(value);
  };

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
                      checked={!!field.value} 
                      onCheckedChange={(checked) => handleCheckboxChange(field, checked)}
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
                      checked={!!field.value} 
                      onCheckedChange={(checked) => handleCheckboxChange(field, checked)}
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
                      checked={!!field.value} 
                      onCheckedChange={(checked) => handleCheckboxChange(field, checked)}
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
                      checked={!!field.value}
                      onCheckedChange={(checked) => handleCheckboxChange(field, checked)}
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
                      checked={!!field.value}
                      onCheckedChange={(checked) => handleCheckboxChange(field, checked)}
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
                    value={field.value || "Current Location"}
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
            
            <Separator className="my-4" />
            
            <div className="pt-2">
              <h3 className="text-md font-semibold mb-2">Advanced Settings</h3>
            </div>
            
            <FormField
              control={form.control}
              name="offlineMode"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox 
                      checked={!!field.value}
                      onCheckedChange={(checked) => handleCheckboxChange(field, checked)}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="text-sm font-medium text-primary-700 cursor-pointer">
                      Enable offline mode
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Store map data on your device for areas with poor connectivity
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="trafficDataProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-primary-700">Traffic Data Provider</FormLabel>
                  <Select
                    value={field.value || TrafficDataProvider.OPENDATA}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select traffic data provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TrafficDataProvider.OPENDATA}>{TrafficDataProvider.OPENDATA}</SelectItem>
                      <SelectItem value={TrafficDataProvider.TOMTOM}>{TrafficDataProvider.TOMTOM}</SelectItem>
                      <SelectItem value={TrafficDataProvider.HERE}>{TrafficDataProvider.HERE}</SelectItem>
                      <SelectItem value={TrafficDataProvider.COMMUNITY}>{TrafficDataProvider.COMMUNITY}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Some providers may require API keys for full functionality
                  </FormDescription>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      
      {form.getValues().offlineMode && (
        <CardFooter className="p-4 pt-0">
          <div className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="text-sm font-medium text-yellow-800">Offline Mode Information</h4>
            <p className="text-xs text-yellow-700 mt-1">
              Offline maps for your current area are {defaultValues?.offlineMapsLastUpdated ? 
                `last updated on ${new Date(defaultValues.offlineMapsLastUpdated).toLocaleDateString()}` : 
                'not downloaded yet'}.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 text-xs"
              onClick={() => {
                onSubmit({
                  ...form.getValues(),
                  offlineMapsLastUpdated: new Date()
                });
              }}
              disabled={isSubmitting}
            >
              {defaultValues?.offlineMapsLastUpdated ? 'Update Offline Maps' : 'Download Maps for Offline Use'}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
