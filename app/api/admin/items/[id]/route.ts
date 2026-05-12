import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      PartNumber,
      PartDescription,
      Unit,
      Brand,
      OEM,
      TType,
      ExtraDescription,
      Onhand,
    } = body;

    if (!PartNumber || !PartDescription) {
      return NextResponse.json(
        { error: "Part Number and Description are required." },
        { status: 400 }
      );
    }

    const pool = getPool();
    const [result]: any = await pool.query(
      `UPDATE itemTools
       SET PartNumber = ?, PartDescription = ?, Unit = ?, Brand = ?, OEM = ?, TType = ?, ExtraDescription = ?, Onhand = ?
       WHERE ID = ?`,
      [
        PartNumber,
        PartDescription,
        Unit || null,
        Brand || null,
        OEM || null,
        TType || null,
        ExtraDescription || null,
        Onhand ?? 0,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Item updated successfully." });
  } catch (error: any) {
    console.error("Update error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "A tool with this Part Number already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update item." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getPool();
    const [result]: any = await pool.query(
      "DELETE FROM itemTools WHERE ID = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Item deleted successfully." });
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete item." },
      { status: 500 }
    );
  }
}
