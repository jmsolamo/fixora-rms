import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const pool = getPool();
    const [rows]: any = await pool.query(
      "SELECT EmployeeName, Department, Position FROM personnel WHERE EmployeeName LIKE ? OR EmployeeCode LIKE ? LIMIT 20",
      [`%${q}%`, `%${q}%`]
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Database error in personnel/search:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch personnel" },
      { status: 500 }
    );
  }
}
