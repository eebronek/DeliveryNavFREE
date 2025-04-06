import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Address, DeliveryStatus, InsertAddress } from '@shared/schema';

export function useAddresses() {
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  // Fetch all addresses
  const addressesQuery = useQuery({
    queryKey: ['/api/addresses'],
  });

  // Get a single address
  const addressQuery = useQuery({
    queryKey: ['/api/addresses', selectedAddressId],
    enabled: selectedAddressId !== null,
  });

  // Add a new address
  const createAddressMutation = useMutation({
    mutationFn: async (newAddress: InsertAddress) => {
      const res = await apiRequest('POST', '/api/addresses', newAddress);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Address added",
        description: "The delivery address has been added to your route.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add address",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update an address
  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Address> }) => {
      const res = await apiRequest('PATCH', `/api/addresses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Address updated",
        description: "The delivery address has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update address",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete an address
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/addresses/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Address removed",
        description: "The delivery address has been removed from your route.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove address",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk add addresses
  const bulkAddAddressesMutation = useMutation({
    mutationFn: async (addresses: InsertAddress[]) => {
      const res = await apiRequest('POST', '/api/addresses/bulk', addresses);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Addresses imported",
        description: `Successfully imported ${data.count} addresses.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to import addresses",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update address status
  const updateAddressStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: DeliveryStatus }) => {
      const res = await apiRequest('PATCH', `/api/addresses/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    addresses: addressesQuery.data as Address[] || [],
    isLoadingAddresses: addressesQuery.isLoading,
    errorLoadingAddresses: addressesQuery.error,
    
    selectedAddress: addressQuery.data as Address | undefined,
    setSelectedAddressId,
    
    createAddress: createAddressMutation.mutate,
    isCreatingAddress: createAddressMutation.isPending,
    
    updateAddress: updateAddressMutation.mutate,
    isUpdatingAddress: updateAddressMutation.isPending,
    
    deleteAddress: deleteAddressMutation.mutate,
    isDeletingAddress: deleteAddressMutation.isPending,
    
    bulkAddAddresses: bulkAddAddressesMutation.mutate,
    isBulkAddingAddresses: bulkAddAddressesMutation.isPending,
    
    updateAddressStatus: updateAddressStatusMutation.mutate,
    isUpdatingAddressStatus: updateAddressStatusMutation.isPending,
  };
}
