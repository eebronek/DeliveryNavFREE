import { parse } from 'papaparse';
import { z } from 'zod';
import { CSVRow } from './types';
import { Priority, TimeWindow } from '@shared/schema';

// Schema for validating CSV data
const csvRowSchema = z.object({
  address: z.string().min(1, "Address is required"),
  timeWindow: z.enum([
    TimeWindow.ANY, 
    TimeWindow.MORNING, 
    TimeWindow.AFTERNOON, 
    TimeWindow.EVENING
  ]).optional().default(TimeWindow.ANY),
  exactDeliveryTime: z.string().optional(),
  priority: z.enum([
    Priority.NORMAL, 
    Priority.HIGH, 
    Priority.LOW
  ]).optional().default(Priority.NORMAL),
  specialInstructions: z.string().optional()
});

export function parseCSV(file: File): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<unknown>) => {
        try {
          const parsedRows: CSVRow[] = [];
          
          // Loop through each row and validate
          for (const row of results.data) {
            const typedRow = row as Record<string, string>;
            
            try {
              // Validate row against schema
              const validRow = csvRowSchema.parse({
                address: typedRow.address || "",
                timeWindow: typedRow.timeWindow || TimeWindow.ANY,
                exactDeliveryTime: typedRow.exactDeliveryTime || "",
                priority: typedRow.priority || Priority.NORMAL,
                specialInstructions: typedRow.specialInstructions || ""
              });
              
              parsedRows.push(validRow);
            } catch (validationError) {
              console.error("Row validation error:", validationError);
            }
          }
          
          resolve(parsedRows);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}

export function parsePastedText(text: string): CSVRow[] {
  const lines = text.split('\n');
  const parsedRows: CSVRow[] = [];
  
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    
    try {
      // Assume pasted text is just addresses, one per line
      const validRow = csvRowSchema.parse({
        address: line.trim(),
      });
      
      parsedRows.push(validRow);
    } catch (error) {
      console.error("Row validation error:", error);
    }
  }
  
  return parsedRows;
}

// Helper function to generate a sample CSV template
export function generateCSVTemplate(): string {
  return 'address,timeWindow,exactDeliveryTime,priority,specialInstructions\n' +
    '"123 Main St, Anytown, US",Any time,,Normal,"Leave at door"\n' +
    '"456 Oak Ave, Somewhere, US","Morning (8AM-12PM)",14:30,High,"Call customer"';
}
