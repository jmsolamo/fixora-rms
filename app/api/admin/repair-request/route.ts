import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

function bool(v: unknown): number {
  return v === true || v === 1 || v === "1" || v === "true" ? 1 : 0;
}

function strOrNull(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function dateOrNull(v: unknown): string | null {
  const s = strOrNull(v);
  if (!s) return null;
  return s;
}

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT * FROM repair_request ORDER BY id DESC"
    );
    return NextResponse.json(rows);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch repair requests";
    console.error("repair_request GET:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const formDate = strOrNull(body.form_date);
    if (!formDate) {
      return NextResponse.json({ error: "form_date is required" }, { status: 400 });
    }

    const faultsJson = body.faults_json != null ? JSON.stringify(body.faults_json) : null;
    const partsNeeded = Array.isArray(body.parts_needed)
      ? JSON.stringify(body.parts_needed)
      : JSON.stringify([]);

    const pool = getPool();
    await pool.query(
      `INSERT INTO repair_request (
        form_no, form_date, to_purchase, for_filing,
        part_number, brand_model, quantity, tool_description, control_number,
        utilization, service_priority, low_repair_date,
        jo_no, jo_customer, jo_desc,
        faults_json, summary_problems,
        requester_name, designation, bay_section, foreman, requester_signature,
        tool_keeper_name, accepted_by,
        service_findings, corrective_reconditioned, corrective_parts_replaced, corrective_others,
        parts_needed_json,
        final_repairable, final_usable_parts_extraction, final_disposal, final_unit_replacement,
        pr_no, pr_date, requested_by,
        prepared_by, inspected_by, approved_by
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?
      )`,
      [
        strOrNull(body.form_no),
        formDate,
        bool(body.to_purchase),
        bool(body.for_filing),
        strOrNull(body.part_number),
        strOrNull(body.brand_model),
        strOrNull(body.quantity),
        strOrNull(body.tool_description),
        strOrNull(body.control_number),
        strOrNull(body.utilization),
        strOrNull(body.service_priority),
        dateOrNull(body.low_repair_date),
        strOrNull(body.jo_no),
        strOrNull(body.jo_customer),
        strOrNull(body.jo_desc),
        faultsJson,
        strOrNull(body.summary_problems),
        strOrNull(body.requester_name),
        strOrNull(body.designation),
        strOrNull(body.bay_section),
        strOrNull(body.foreman),
        strOrNull(body.requester_signature),
        strOrNull(body.tool_keeper_name),
        strOrNull(body.accepted_by),
        strOrNull(body.service_findings),
        bool(body.corrective_reconditioned),
        bool(body.corrective_parts_replaced),
        strOrNull(body.corrective_others),
        partsNeeded,
        bool(body.final_repairable),
        bool(body.final_usable_parts_extraction),
        bool(body.final_disposal),
        bool(body.final_unit_replacement),
        strOrNull(body.pr_no),
        dateOrNull(body.pr_date),
        strOrNull(body.requested_by),
        strOrNull(body.prepared_by),
        strOrNull(body.inspected_by),
        strOrNull(body.approved_by),
      ]
    );

    return NextResponse.json({ success: true, message: "Repair request saved." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save repair request";
    console.error("repair_request POST:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
