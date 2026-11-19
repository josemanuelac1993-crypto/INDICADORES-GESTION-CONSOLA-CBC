import * as XLSX from 'xlsx';
import { PendingUploadBatch } from '../types/console';
import { processUploadedFiles } from '../utils/excelParser';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime: string;
}

// Fetch list of accessible Google Sheets from Google Drive
export async function listDriveSpreadsheets(accessToken: string): Promise<DriveSpreadsheetFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime%20desc&pageSize=15&fields=files(id,name,modifiedTime)`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al listar archivos de Google Drive: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return (data.files || []) as DriveSpreadsheetFile[];
}

// Fetch spreadsheet content and convert into a PendingUploadBatch
export async function fetchAndParseGoogleSpreadsheet(
  spreadsheetId: string,
  spreadsheetTitle: string,
  accessToken: string
): Promise<PendingUploadBatch> {
  // 1. Get spreadsheet metadata (all sheet names)
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`;
  const metaResp = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!metaResp.ok) {
    const err = await metaResp.text();
    throw new Error(`Error consultando hoja de Google Sheets: ${metaResp.status} - ${err}`);
  }

  const metaData = await metaResp.json();
  const sheets: { properties: { title: string } }[] = metaData.sheets || [];

  if (sheets.length === 0) {
    throw new Error('La hoja de cálculo no contiene pestañas activas.');
  }

  // 2. Build an in-memory XLSX WorkBook from Google Sheets tabs
  const wb = XLSX.utils.book_new();

  for (const sh of sheets) {
    const title = sh.properties.title;
    const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(title)}!A1:ZZ1000?valueRenderOption=UNFORMATTED_VALUE`;
    const valResp = await fetch(valuesUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (valResp.ok) {
      const valData = await valResp.json();
      const rows: any[][] = valData.values || [];
      if (rows.length > 0) {
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
      }
    }
  }

  // 3. Convert in-memory workbook to a virtual File and process via excelParser
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const virtualFile = new File([blob], `${spreadsheetTitle || 'Google_Sheet'}.xlsx`, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  return await processUploadedFiles([virtualFile]);
}
