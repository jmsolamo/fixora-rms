import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT * FROM item_inventory ORDER BY PartNumber ASC, ControlNumber ASC"
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Inventory fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

/**
 * POST  /api/admin/inventory
 * Generates item_inventory rows from itemTools.
 * For each tool with Onhand > 0, creates individual rows with ControlNumbers.
 * ControlNumber = PartNumber (dashes removed) + "-" + zero-padded 4-digit index (starting at 0000).
 */
export async function POST() {
  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Clear existing inventory
    await conn.query("DELETE FROM item_inventory");

    // Get all tools with stock
    const [tools]: any = await conn.query(
      "SELECT PartNumber, PartDescription, Onhand FROM itemTools WHERE Onhand > 0 ORDER BY PartNumber ASC"
    );

    let totalInserted = 0;

    for (const tool of tools) {
      const stripped = tool.PartNumber.replace(/-/g, "");

      const rows: [string, string, string][] = [];
      for (let i = 0; i < tool.Onhand; i++) {
        const controlNumber = `${stripped}-${String(i).padStart(4, "0")}`;
        rows.push([controlNumber, tool.PartNumber, tool.PartDescription]);
      }

      if (rows.length > 0) {
        await conn.query(
          "INSERT INTO item_inventory (ControlNumber, PartNumber, PartDescription) VALUES ?",
          [rows]
        );
        totalInserted += rows.length;
      }
    }

    await conn.commit();

    return NextResponse.json({
      message: `Generated ${totalInserted} inventory items.`,
      count: totalInserted,
    });
  } catch (error: any) {
    await conn.rollback();
    console.error("Inventory generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate inventory" },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}
