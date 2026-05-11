import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse the Excel file
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    if (!rawData || rawData.length === 0) {
      return NextResponse.json({ error: "Excel file is empty" }, { status: 400 });
    }

    const pool = getPool();
    let importCount = 0;

    // Use a transaction for the bulk import
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const row of rawData as any[]) {
        // Map Excel columns to database columns
        // We handle various potential header naming conventions
        const partNumber = row.PartNumber || row["Part Number"] || row["PartNo"] || row.id;
        const partDescription = row.PartDescription || row["Part Description"] || row.Description || "";
        const unit = row.Unit || "";
        const brand = row.Brand || "";
        const oem = row.OEM || "";
        const tType = row.TType || row.Type || "";
        const extraDescription = row.ExtraDescription || row["Extra Description"] || "";
        const onhand = parseInt(row.Onhand || row["On Hand"] || row.Quantity || "0", 10) || 0;

        if (!partNumber) continue;

        // Upsert logic: insert or update if part number exists
        await connection.query(
          `INSERT INTO itemTools (PartNumber, PartDescription, Unit, Brand, OEM, TType, ExtraDescription, Onhand)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           PartDescription = VALUES(PartDescription),
           Unit = VALUES(Unit),
           Brand = VALUES(Brand),
           OEM = VALUES(OEM),
           TType = VALUES(TType),
           ExtraDescription = VALUES(ExtraDescription),
           Onhand = VALUES(Onhand)`,
          [partNumber, partDescription, unit, brand, oem, tType, extraDescription, onhand]
        );
        importCount++;
      }

      await connection.commit();
    } catch (dbError) {
      await connection.rollback();
      console.error("Database error during import:", dbError);
      throw dbError;
    } finally {
      connection.release();
    }

    return NextResponse.json({ success: true, count: importCount });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process Excel file" },
      { status: 500 }
    );
  }
}
