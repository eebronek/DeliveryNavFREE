import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { parseCSV, parsePastedText, generateCSVTemplate } from '@/lib/csv-parser';
import { CSVRow } from '@/lib/types';
import { InsertAddress } from '@shared/schema';
import { FileText, Download, ClipboardCopy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CSVImportProps {
  onImport: (addresses: InsertAddress[]) => void;
  isImporting: boolean;
}

export function CSVImport({ onImport, isImporting }: CSVImportProps) {
  const [isCSVDialogOpen, setIsCSVDialogOpen] = useState(false);
  const [isPasteDialogOpen, setIsPasteDialogOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleCSVImport = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      const parsedRows = await parseCSV(selectedFile);
      
      if (parsedRows.length === 0) {
        toast({
          title: "No valid addresses found",
          description: "Make sure your CSV has the correct format.",
          variant: "destructive",
        });
        return;
      }
      
      const addresses = transformCSVToAddresses(parsedRows);
      onImport(addresses);
      setIsCSVDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      toast({
        title: "Error importing CSV",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handlePasteImport = () => {
    if (!pastedText.trim()) {
      toast({
        title: "No addresses pasted",
        description: "Please paste addresses to import.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      const parsedRows = parsePastedText(pastedText);
      
      if (parsedRows.length === 0) {
        toast({
          title: "No valid addresses found",
          description: "Make sure your pasted text has one address per line.",
          variant: "destructive",
        });
        return;
      }
      
      const addresses = transformCSVToAddresses(parsedRows);
      onImport(addresses);
      setIsPasteDialogOpen(false);
      setPastedText('');
    } catch (error) {
      toast({
        title: "Error processing addresses",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const downloadTemplate = () => {
    const template = generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'address_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Transform CSVRow to InsertAddress
  const transformCSVToAddresses = (rows: CSVRow[]): InsertAddress[] => {
    return rows.map(row => ({
      fullAddress: row.address,
      timeWindow: row.timeWindow || 'Any time',
      priority: row.priority || 'Normal',
      specialInstructions: row.specialInstructions || '',
    }));
  };
  
  return (
    <div className="space-y-4">
      {/* CSV Import Dialog */}
      <Dialog open={isCSVDialogOpen} onOpenChange={setIsCSVDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <FileText className="mr-2 h-4 w-4" /> Import CSV
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Addresses from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with address information. Each row should have an address, and optionally time window, priority, and special instructions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-primary-500">Need a template?</p>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-3 w-3" /> Download Template
              </Button>
            </div>
            
            <div className="grid w-full items-center gap-1.5">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={isProcessing || isImporting}
              />
              <p className="text-xs text-primary-500">
                {selectedFile ? `Selected: ${selectedFile.name}` : 'No file selected'}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCSVDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCSVImport} 
              disabled={!selectedFile || isProcessing || isImporting}
            >
              {isProcessing || isImporting ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Paste Addresses Dialog */}
      <Dialog open={isPasteDialogOpen} onOpenChange={setIsPasteDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <ClipboardCopy className="mr-2 h-4 w-4" /> Paste Multiple Addresses
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paste Multiple Addresses</DialogTitle>
            <DialogDescription>
              Paste one address per line. Each address will be added to your route.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder="123 Main St, New York, NY 10001
456 Broadway, New York, NY 10012
789 5th Ave, New York, NY 10022"
            rows={8}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            disabled={isProcessing || isImporting}
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasteDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handlePasteImport}
              disabled={!pastedText.trim() || isProcessing || isImporting}
            >
              {isProcessing || isImporting ? 'Processing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
