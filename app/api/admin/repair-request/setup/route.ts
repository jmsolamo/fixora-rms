import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

const CREATE_REPAIR_REQUEST_TABLE = `
CREATE TABLE IF NOT EXISTS \`repair_request\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`form_no\` varchar(50) DEFAULT NULL,
  \`form_date\` date NOT NULL,
  \`to_purchase\` tinyint(1) NOT NULL DEFAULT 0,
  \`for_filing\` tinyint(1) NOT NULL DEFAULT 0,
  \`part_number\` varchar(100) DEFAULT NULL,
  \`brand_model\` varchar(255) DEFAULT NULL,
  \`quantity\` varchar(50) DEFAULT NULL,
  \`tool_description\` text,
  \`control_number\` varchar(150) DEFAULT NULL,
  \`utilization\` varchar(20) DEFAULT NULL,
  \`service_priority\` varchar(20) DEFAULT NULL,
  \`low_repair_date\` date DEFAULT NULL,
  \`jo_no\` varchar(100) DEFAULT NULL,
  \`jo_customer\` varchar(255) DEFAULT NULL,
  \`jo_desc\` text,
  \`faults_json\` json DEFAULT NULL,
  \`summary_problems\` text,
  \`requester_name\` varchar(255) DEFAULT NULL,
  \`designation\` varchar(150) DEFAULT NULL,
  \`bay_section\` varchar(150) DEFAULT NULL,
  \`foreman\` varchar(255) DEFAULT NULL,
  \`requester_signature\` varchar(255) DEFAULT NULL,
  \`tool_keeper_name\` varchar(255) DEFAULT NULL,
  \`accepted_by\` varchar(255) DEFAULT NULL,
  \`service_findings\` text,
  \`corrective_reconditioned\` tinyint(1) NOT NULL DEFAULT 0,
  \`corrective_parts_replaced\` tinyint(1) NOT NULL DEFAULT 0,
  \`corrective_others\` text,
  \`parts_needed_json\` json DEFAULT NULL,
  \`final_repairable\` tinyint(1) NOT NULL DEFAULT 0,
  \`final_usable_parts_extraction\` tinyint(1) NOT NULL DEFAULT 0,
  \`final_disposal\` tinyint(1) NOT NULL DEFAULT 0,
  \`final_unit_replacement\` tinyint(1) NOT NULL DEFAULT 0,
  \`pr_no\` varchar(100) DEFAULT NULL,
  \`pr_date\` date DEFAULT NULL,
  \`requested_by\` varchar(255) DEFAULT NULL,
  \`prepared_by\` varchar(255) DEFAULT NULL,
  \`inspected_by\` varchar(255) DEFAULT NULL,
  \`approved_by\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_repair_form_date\` (\`form_date\`),
  KEY \`idx_repair_priority\` (\`service_priority\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
`;

/** Creates the \`repair_request\` table if it does not exist (idempotent). */
export async function POST() {
  try {
    const pool = getPool();
    await pool.query(CREATE_REPAIR_REQUEST_TABLE);
    return NextResponse.json({ success: true, message: "Table repair_request is ready." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create table";
    console.error("repair_request setup:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
