import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = getPool();
    const [rows]: any = await pool.query(
      `SELECT t.*, (SELECT COUNT(*) FROM item_inventory i WHERE i.PartNumber = t.PartNumber) as ActualStock 
       FROM itemTools t ORDER BY t.ID ASC`
    );

    const mappedRows = rows.map((row: any) => {
      // If there are actual inventory items, we reflect that as Onhand.
      // If there are no items in item_inventory, Onhand becomes 0.
      return {
        ...row,
        Onhand: row.ActualStock
      };
    });

    return NextResponse.json(mappedRows);
  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch items" },
      { status: 500 }
    );
  }
}
