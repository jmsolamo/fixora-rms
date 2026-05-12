import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = getPool();
    // Fetch distinct part numbers and their details
    const [rows]: any = await pool.query(
      "SELECT PartNumber, Brand, PartDescription FROM itemTools ORDER BY PartNumber ASC"
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Database error in repair-request/items:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch items" },
      { status: 500 }
    );
  }
}
