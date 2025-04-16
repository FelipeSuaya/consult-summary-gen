
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const renderMarkdownTable = (markdownTable: string) => {
  if (!markdownTable.includes('|')) return markdownTable;
  
  try {
    const rows = markdownTable.trim().split('\n');
    if (rows.length < 2) return markdownTable;
    
    const headerRow = rows[0].trim();
    const headers = headerRow
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell !== '');
      
    const isSeparator = rows[1].trim().replace(/[^|\-\s]/g, '') === rows[1].trim();
    const dataStartIndex = isSeparator ? 2 : 1;
    
    const dataRows = rows.slice(dataStartIndex).map(row => {
      return row
        .trim()
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell !== '');
    }).filter(row => row.length > 0);
    
    // Limit to first two columns (Parámetro and Resultado)
    const processedHeaders = headers.slice(0, 2);
    const processedDataRows = dataRows.map(row => row.slice(0, 2));
    
    return (
      <Table className="mt-2 mb-4 border border-gray-200">
        <TableHeader className="bg-medical-50">
          <TableRow>
            {processedHeaders.map((header, i) => (
              <TableHead key={`header-${i}`} className="font-medium text-medical-800">{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {processedDataRows.map((row, rowIndex) => (
            <TableRow key={`row-${rowIndex}`} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {row.map((cell, cellIndex) => (
                <TableCell key={`cell-${rowIndex}-${cellIndex}`}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } catch (error) {
    console.error("Error parsing markdown table:", error);
    return markdownTable;
  }
};

export default renderMarkdownTable;
