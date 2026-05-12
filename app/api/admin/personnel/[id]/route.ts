import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { EmployeeCode, EmployeeName, Department, Position } = await req.json();

    if (!EmployeeCode || !EmployeeName) {
      return NextResponse.json({ error: "Employee Code and Name are required" }, { status: 400 });
    }

    const pool = getPool();
    const [result]: any = await pool.query(
      "UPDATE personnel SET EmployeeCode = ?, EmployeeName = ?, Department = ?, Position = ? WHERE ID = ?",
      [EmployeeCode, EmployeeName, Department, Position, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Employee updated successfully" });
  } catch (error: any) {
    console.error("Database error:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: "Employee Code already exists" }, { status: 409 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getPool();
    const [result]: any = await pool.query("DELETE FROM personnel WHERE ID = ?", [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Employee deleted successfully" });
  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete employee" },
      { status: 500 }
    );
  }
}
