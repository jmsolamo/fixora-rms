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
        const employeeCode = row.EmployeeCode || row["Employee Code"] || row["Code"] || row.id;
        const employeeName = row.EmployeeName || row["Employee Name"] || row.Name || "";
        const department = row.Department || "";
        const position = row.Position || "";

        if (!employeeCode || !employeeName) continue;

        // Upsert logic: insert or update if employee code exists
        await connection.query(
          `INSERT INTO personnel (EmployeeCode, EmployeeName, Department, Position)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           EmployeeName = VALUES(EmployeeName),
           Department = VALUES(Department),
           Position = VALUES(Position)`,
          [employeeCode, employeeName, department, position]
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
