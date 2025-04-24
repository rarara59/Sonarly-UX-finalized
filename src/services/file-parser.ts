// src/services/file-parser.ts
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { logger } from '../utils/logger';

/**
 * Service for parsing various file formats
 */
export class FileParserService {
  /**
   * Read and parse a data file (Excel, CSV)
   * @param filePath Path to the file
   * @returns Parsed data as array of objects
   */
  public readDataFile(filePath: string): any[] {
    const extension = path.extname(filePath).toLowerCase();
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    logger.info(`Reading file: ${filePath}`);
    
    const workbook = XLSX.readFile(filePath, { 
      cellDates: true, 
      cellNF: false, 
      cellText: false 
    });
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    logger.info(`Parsed ${data.length} records from file`);
    return data;
  }
}

export const fileParser = new FileParserService();