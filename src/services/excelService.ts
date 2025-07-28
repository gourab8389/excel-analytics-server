import * as XLSX from 'xlsx';
import { ProcessedExcelData } from '../types/upload';

export class ExcelService {
  static async processExcelFile(filePath: string, originalName: string): Promise<ProcessedExcelData> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) {
        throw new Error('Excel file is empty');
      }

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];

      // Clean and validate data
      const cleanedRows = rows
        .filter((row: any[]) => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
        .map((row: any[]) => {
          const rowObj: any = {};
          headers.forEach((header, index) => {
            rowObj[header] = row[index] || null;
          });
          return rowObj;
        });

      return {
        headers: headers.filter(header => header && header.toString().trim() !== ''),
        rows: cleanedRows,
        metadata: {
          totalRows: cleanedRows.length,
          totalColumns: headers.length,
          fileName: originalName,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to process Excel file: ${error.message}`);
      } else {
        throw new Error('Failed to process Excel file: Unknown error');
      }
    }
  }

  static validateChartData(data: any[], xAxis: string, yAxis: string): boolean {
    if (!data || data.length === 0) return false;
    
    const hasValidData = data.some(row => 
      row[xAxis] !== null && row[xAxis] !== undefined &&
      row[yAxis] !== null && row[yAxis] !== undefined
    );

    return hasValidData;
  }

  static prepareChartData(data: any[], xAxis: string, yAxis: string, chartType: string) {
    const validRows = data.filter(row => 
      row[xAxis] !== null && row[xAxis] !== undefined &&
      row[yAxis] !== null && row[yAxis] !== undefined
    );

    return validRows.map(row => ({
      x: row[xAxis],
      y: parseFloat(row[yAxis]) || 0,
      label: row[xAxis]?.toString() || '',
    }));
  }
}