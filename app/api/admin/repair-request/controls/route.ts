import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partNumber = searchParams.get("partNumber");

    if (!partNumber) {
      return NextResponse.json([]);
    }

    const pool = getPool();
    const [rows]: any = await pool.query(
      "SELECT ControlNumber FROM item_inventory WHERE PartNumber = ? ORDER BY ControlNumber ASC",
      [partNumber]
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Database error in repair-request/controls:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch control numbers" },
      { status: 500 }
    );
  }
}
