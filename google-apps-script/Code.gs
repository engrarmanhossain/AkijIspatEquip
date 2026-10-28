/**
 * ==============================================================================
 * EquipGuard Industrial CMMS — Google Apps Script Backend (Code.gs)
 * ==============================================================================
 * This script serves as the free, serverless Cloud Database & Image Storage
 * backend for the EquipGuard Equipment Health & Maintenance Register Dashboard.
 *
 * FEATURES:
 * 1. Synchronizes Equipment inventory, Maintenance work orders, Work updates,
 *    Equipment requests, Staff directory, and Company settings in Google Sheets.
 * 2. Saves uploaded machinery photos, field repair proof photos, and user
 *    profile pictures directly into your Google Drive Folder.
 * 3. Handles CORS automatically and serves JSON data.
 *
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Replace all content in Code.gs with this file.
 * 4. Replace DRIVE_FOLDER_ID below with your Google Drive Folder ID.
 * 5. Click "Deploy" > "New Deployment".
 * 6. Select type: "Web app".
 * 7. Set "Execute as": "Me" (your Google account).
 * 8. Set "Who has access": "Anyone".
 * 9. Click "Deploy" and copy the Web App URL (ends with /exec).
 * 10. Paste the Web App URL into your EquipGuard Admin Dashboard!
 * ==============================================================================
 */

// Replace with your Google Drive Folder ID (e.g. from the folder URL)
const DRIVE_FOLDER_ID = "YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE";

/**
 * Handle HTTP GET Requests
 * Used to fetch data from Google Sheets or test the API connection.
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getAll";

    // 1. Healthcheck / Ping test
    if (action === "ping") {
      return jsonResponse({
        success: true,
        status: "online",
        message: "EquipGuard Google Apps Script API is operational",
        timestamp: new Date().toISOString()
      });
    }

    // 2. Fetch all database tables
    if (action === "getAll") {
      const data = {
        equipment: getSheetData(ss, "Equipment"),
        maintenanceRecords: getSheetData(ss, "MaintenanceRecords"),
        workUpdates: getSheetData(ss, "WorkUpdates"),
        equipmentRequests: getSheetData(ss, "EquipmentRequests"),
        employees: getSheetData(ss, "Employees"),
        companySettings: (getSheetData(ss, "CompanySettings")[0]) || null,
        timestamp: new Date().toISOString()
      };
      return jsonResponse({ success: true, data: data });
    }

    // 3. Single table fetch
    const sheetData = getSheetData(ss, action);
    return jsonResponse({ success: true, table: action, data: sheetData });

  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Handle HTTP POST Requests
 * Used to sync database records and upload photos to Google Drive.
 */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: "Empty request payload" });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    // 1. Upload Base64 Image to Google Drive Folder
    if (action === "uploadImage") {
      if (!payload.base64Data) {
        return jsonResponse({ success: false, error: "Missing base64Data in payload" });
      }

      let folder;
      try {
        folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      } catch (err) {
        // Fallback: use root folder if ID is not configured
        folder = DriveApp.getRootFolder();
      }

      const mimeType = payload.mimeType || "image/jpeg";
      const fileName = payload.fileName || ("EquipGuard_Upload_" + Date.now() + ".jpg");
      const decodedBytes = Utilities.base64Decode(payload.base64Data);
      const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      // Fast, CDN-cached viewable link for Google Drive files
      const fileUrl = "https://lh3.googleusercontent.com/d/" + file.getId();

      return jsonResponse({
        success: true,
        fileId: file.getId(),
        fileName: fileName,
        url: fileUrl
      });
    }

    // 2. Full Sync (Pushes all data from dashboard to sheets)
    if (action === "syncAll") {
      if (payload.equipment) writeTable(ss, "Equipment", payload.equipment);
      if (payload.maintenanceRecords) writeTable(ss, "MaintenanceRecords", payload.maintenanceRecords);
      if (payload.workUpdates) writeTable(ss, "WorkUpdates", payload.workUpdates);
      if (payload.equipmentRequests) writeTable(ss, "EquipmentRequests", payload.equipmentRequests);
      if (payload.employees) writeTable(ss, "Employees", payload.employees);
      if (payload.companySettings) writeTable(ss, "CompanySettings", [payload.companySettings]);

      return jsonResponse({
        success: true,
        message: "All EquipGuard records successfully synchronized to Google Sheets",
        timestamp: new Date().toISOString()
      });
    }

    // 3. Append or Update Single Record
    if (action === "upsertRecord") {
      const tableName = payload.table;
      const record = payload.record;
      if (!tableName || !record) {
        return jsonResponse({ success: false, error: "Missing table or record in payload" });
      }

      appendOrUpdateRow(ss, tableName, record);
      return jsonResponse({ success: true, message: "Record saved in " + tableName });
    }

    return jsonResponse({ success: false, error: "Unknown action: " + action });

  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Read data from a sheet and return an array of objects
 */
function getSheetData(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length < 2) return [];

  const headers = values[0];
  const rows = values.slice(1);

  return rows.map(row => {
    const item = {};
    headers.forEach((header, index) => {
      let val = row[index];
      // Parse JSON fields if stored as serialized string
      if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try { val = JSON.parse(val); } catch (e) {}
      }
      item[header] = val;
    });
    return item;
  });
}

/**
 * Overwrite a sheet with a full array of objects (creates sheet & headers automatically)
 */
function writeTable(ss, sheetName, dataArray) {
  if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) return;

  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  sheet.clearContents();

  // Extract all unique headers across all records
  const headers = Array.from(new Set(dataArray.flatMap(obj => Object.keys(obj))));
  sheet.appendRow(headers);

  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#0f172a");
  headerRange.setFontColor("#38bdf8");

  // Append rows
  const rows = dataArray.map(item => {
    return headers.map(header => {
      let val = item[header];
      if (val === undefined || val === null) return "";
      if (typeof val === 'object') return JSON.stringify(val);
      return val;
    });
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Helper to return CORS-compliant JSON
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
