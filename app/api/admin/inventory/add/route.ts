import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

/**
 * POST /api/admin/inventory/add
 * Adds a single inventory item for a given PartNumber.
 * Auto-generates the next ControlNumber based on existing entries.
 */
export async function POST(request: NextRequest) {
  try {
    const { PartNumber, PartDescription } = await request.json();

    if (!PartNumber || !PartDescription) {
      return NextResponse.json(
        { error: "PartNumber and PartDescription are required." },
        { status: 400 }
      );
    }

    const pool = getPool();
    const stripped = PartNumber.replace(/-/g, "");

    // Find the current max index for this PartNumber
    const [existing]: any = await pool.query(
      "SELECT ControlNumber FROM item_inventory WHERE PartNumber = ? ORDER BY ControlNumber DESC LIMIT 1",
      [PartNumber]
    );

    let nextIndex = 0;
    if (existing.length > 0) {
      // Extract the index from the last ControlNumber (e.g. "WRS0550000800-0003" → 3)
      const lastControl: string = existing[0].ControlNumber;
      const dashIdx = lastControl.lastIndexOf("-");
      if (dashIdx !== -1) {
        nextIndex = parseInt(lastControl.substring(dashIdx + 1), 10) + 1;
      }
    }

    const controlNumber = `${stripped}-${String(nextIndex).padStart(4, "0")}`;

    await pool.query(
      "INSERT INTO item_inventory (ControlNumber, PartNumber, PartDescription) VALUES (?, ?, ?)",
      [controlNumber, PartNumber, PartDescription]
    );

    // Update the Onhand count in itemTools
    await pool.query(
      "UPDATE itemTools SET Onhand = Onhand + 1 WHERE PartNumber = ?",
      [PartNumber]
    );

    return NextResponse.json({
      message: `Added stock item ${controlNumber}`,
      controlNumber,
    });
  } catch (error: any) {
    console.error("Add inventory error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Duplicate control number. Please try again." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to add inventory item." },
      { status: 500 }
    );
  }
}
