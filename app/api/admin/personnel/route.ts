import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// GET all personnel
export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT * FROM personnel ORDER BY ID ASC"
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch personnel" },
      { status: 500 }
    );
  }
}

// POST create new employee
export async function POST(req: NextRequest) {
  try {
    const { EmployeeCode, EmployeeName, Department, Position } = await req.json();

    if (!EmployeeCode || !EmployeeName) {
      return NextResponse.json({ error: "Employee Code and Name are required" }, { status: 400 });
    }

    const pool = getPool();
    await pool.query(
      "INSERT INTO personnel (EmployeeCode, EmployeeName, Department, Position) VALUES (?, ?, ?, ?)",
      [EmployeeCode, EmployeeName, Department, Position]
    );

    return NextResponse.json({ success: true, message: "Employee added successfully" });
  } catch (error: any) {
    console.error("Database error:", error);
    // Handle duplicate EmployeeCode
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: "Employee Code already exists" }, { status: 409 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to add employee" },
      { status: 500 }
    );
  }
}
