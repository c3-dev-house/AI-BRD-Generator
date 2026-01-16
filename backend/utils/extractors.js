import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import ExcelJS from 'exceljs';

/**
 * Extract text from PDF files
 */
export const extractPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
};

/**
 * Extract text from DOCX/DOC files
 */
export const extractDOCX = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    throw new Error(`DOCX extraction failed: ${error.message}`);
  }
};

/**
 * Extract text from plain text files (TXT, MD)
 */
export const extractText = async (filePath) => {
  try {
    const text = await fs.readFile(filePath, 'utf-8');
    return text;
  } catch (error) {
    throw new Error(`Text extraction failed: ${error.message}`);
  }
};

/**
 * Extract text from CSV files
 */
export const extractCSV = async (filePath) => {
  try {
    const text = await fs.readFile(filePath, 'utf-8');
    // Convert CSV to readable format
    const lines = text.split('\n');
    return lines.map(line => line.replace(/,/g, ' | ')).join('\n');
  } catch (error) {
    throw new Error(`CSV extraction failed: ${error.message}`);
  }
};

/**
 * Extract text from JSON files
 */
export const extractJSON = async (filePath) => {
  try {
    const text = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(text);
    return JSON.stringify(json, null, 2);
  } catch (error) {
    throw new Error(`JSON extraction failed: ${error.message}`);
  }
};

/**
 * Extract text from Excel files (XLSX, XLS)
 */
export const extractExcel = async (filePath) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    let extractedText = '';
    
    workbook.eachSheet((worksheet, sheetId) => {
      extractedText += `\n=== Sheet: ${worksheet.name} ===\n\n`;
      
      worksheet.eachRow((row, rowNumber) => {
        const values = row.values.slice(1); // Skip index 0
        extractedText += values.join(' | ') + '\n';
      });
    });
    
    return extractedText;
  } catch (error) {
    throw new Error(`Excel extraction failed: ${error.message}`);
  }
};

/**
 * Main extraction function - routes to appropriate extractor based on file extension
 */
export const extractTextFromFile = async (filePath, originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  
  let extractedText = '';
  
  switch (ext) {
    case '.pdf':
      extractedText = await extractPDF(filePath);
      break;
    case '.docx':
    case '.doc':
      extractedText = await extractDOCX(filePath);
      break;
    case '.txt':
    case '.md':
      extractedText = await extractText(filePath);
      break;
    case '.csv':
      extractedText = await extractCSV(filePath);
      break;
    case '.json':
      extractedText = await extractJSON(filePath);
      break;
    case '.xlsx':
    case '.xls':
      extractedText = await extractExcel(filePath);
      break;
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
  
  // Clean and normalize text
  extractedText = extractedText
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\n{3,}/g, '\n\n')  // Remove excessive blank lines
    .trim();
  
  if (!extractedText || extractedText.length < 10) {
    throw new Error('No readable text found in document');
  }
  
  return extractedText;
};

/**
 * Clean up temporary file
 */
export const cleanupFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('File cleanup error:', error);
  }
};
