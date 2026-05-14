"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import {
  Loader2,
  Save,
  Search,
  Hammer,
  Database,
  RefreshCw,
  Plus,
  Minus,
  X,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FAULT_GROUPS = [
  {
    title: "General issues",
    key: "general" as const,
    items: [
      { id: "no_power", label: "No Power" },
      { id: "overheating", label: "Overheating" },
      { id: "unusual_noise", label: "Unusual Noise" },
      { id: "vibrating_issues", label: "Vibrating Issues" },
      { id: "not_functioning", label: "Not Functioning Properly" },
      { id: "slow_performance", label: "Slow Performance" },
      { id: "frequent_shutdown", label: "Frequent Shutdown" },
      { id: "display_indicator_error", label: "Display / Indicator Error" },
      { id: "switch_buttons_not_working", label: "Switch / Buttons Not Working" },
      { id: "software_error", label: "Software / Program Error" },
    ],
  },
  {
    title: "Mechanical issues",
    key: "mechanical" as const,
    items: [
      { id: "loose_parts", label: "Loose Parts" },
      { id: "jammed_stuck", label: "Jammed / Stuck Mechanism" },
      { id: "broken_damaged_parts", label: "Broken / Damaged Parts" },
      { id: "leaking", label: "Leaking Fluid / Air" },
      { id: "misalignment", label: "Misalignment" },
      { id: "rust_corrosion", label: "Rust / Corrosion" },
      { id: "wear_tear", label: "Wear and Tear" },
    ],
  },
  {
    title: "Electrical issues",
    key: "electrical" as const,
    items: [
      { id: "blown_fuse", label: "Blown Fuse" },
      { id: "wiring_issue", label: "Wiring Issue" },
      { id: "short_circuit", label: "Short Circuit" },
      { id: "sparks_smokes", label: "Sparks and Smokes" },
      { id: "battery_not_charging", label: "Battery Not Charging" },
      { id: "voltage_fluctuation", label: "Voltage Fluctuation" },
    ],
  },
  {
    title: "Safety concerns",
    key: "safety" as const,
    items: [
      { id: "exposed_wiring", label: "Exposed Wiring" },
      { id: "missing_broken_safety_locks", label: "Missing / Broken Safety Locks" },
      { id: "emergency_stop_not_working", label: "Emergency Stop Not Working" },
      { id: "protective_cover_missing", label: "Protective Cover Missing" },
      { id: "risk_of_burns", label: "Risk of Burns (Hot Surface)" },
    ],
  },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function emptyPartsNeeded(): string[] {
  return Array(10).fill("");
}

type RepairRow = {
  id: number;
  form_no: string | null;
  form_date: string;
  part_number: string | null;
  brand_model?: string | null;
  quantity?: string | null;
  tool_description: string | null;
  control_number: string | null;
  utilization?: string | null;
  service_priority: string | null;
  low_repair_date?: string | null;
  jo_no?: string | null;
  jo_customer?: string | null;
  jo_desc?: string | null;
  faults_json?: unknown;
  summary_problems?: string | null;
  requester_name: string | null;
  designation?: string | null;
  bay_section?: string | null;
  foreman?: string | null;
  tool_keeper_name?: string | null;
  accepted_by?: string | null;
  service_findings?: string | null;
  corrective_reconditioned?: number;
  corrective_parts_replaced?: number;
  corrective_others?: string | null;
  parts_needed_json?: unknown;
  final_repairable: number;
  final_usable_parts_extraction: number;
  final_disposal: number;
  final_unit_replacement: number;
  pr_no?: string | null;
  pr_date?: string | null;
  requested_by?: string | null;
  prepared_by?: string | null;
  inspected_by?: string | null;
  approved_by?: string | null;
  created_at?: string;
};

function parseJsonMaybe<T>(v: unknown): T | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "object") return v as T;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  }
  return null;
}

function formatAssessment(r: RepairRow): string {
  const parts: string[] = [];
  if (r.final_repairable) parts.push("Repairable");
  if (r.final_usable_parts_extraction) parts.push("Usable parts extraction");
  if (r.final_disposal) parts.push("Disposal");
  if (r.final_unit_replacement) parts.push("Unit replacement");
  return parts.length ? parts.join(", ") : "—";
}

function formatPriority(p: string | null): string {
  if (!p) return "—";
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950",
        className,
      )}
    >
      <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white">
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function ToolsRepairPage() {
  const [setupDone, setSetupDone] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<RepairRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasScrollbar, setHasScrollbar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [deletingRow, setDeletingRow] = useState<RepairRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const [faultChecks, setFaultChecks] = useState<Record<string, boolean>>({});
  const [partsNeeded, setPartsNeeded] = useState<string[]>(emptyPartsNeeded);
  const [availableItems, setAvailableItems] = useState<{ PartNumber: string; Brand: string; PartDescription: string }[]>([]);
  const [availableControls, setAvailableControls] = useState<{ ControlNumber: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [personnelSuggestions, setPersonnelSuggestions] = useState<{ EmployeeName: string; Department: string; Position: string }[]>([]);
  const [activePersonnelField, setActivePersonnelField] = useState<string | null>(null);

  const [form, setForm] = useState({
    form_no: "",
    form_date: todayISO(),
    to_purchase: false,
    for_filing: true,
    part_number: "",
    brand_model: "",
    quantity: "",
    tool_description: "",
    control_number: "",
    utilization: "" as "" | "site" | "shop",
    service_priority: "" as "" | "high" | "medium" | "low",
    low_repair_date: "",
    jo_no: "",
    jo_customer: "",
    jo_desc: "",
    summary_problems: "",
    requester_name: "",
    designation: "",
    bay_section: "",
    foreman: "",
    tool_keeper_name: "",
    accepted_by: "",
    service_findings: "",
    corrective_reconditioned: false,
    corrective_parts_replaced: false,
    corrective_others: "",
    final_repairable: false,
    final_usable_parts_extraction: false,
    final_disposal: false,
    final_unit_replacement: false,
    pr_no: "",
    pr_date: "",
    requested_by: "",
    prepared_by: "",
    inspected_by: "",
    approved_by: "",
  });

  const itemsPerPage = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const runSetup = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/repair-request/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not create repair_request table.");
        return false;
      }
      setSetupDone(true);
      return true;
    } catch {
      toast.error("Could not reach setup endpoint.");
      return false;
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/admin/repair-request");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load repair requests.");
        setRows([]);
        return;
      }
      setRows(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load repair requests.");
      setRows([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const fetchAvailableItems = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/repair-request/items");
      if (res.ok) {
        const data = await res.json();
        setAvailableItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch available items", err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const ok = await runSetup();
      if (ok) {
        await fetchList();
        await fetchAvailableItems();
      } else {
        setLoadingList(false);
      }
    })();
  }, [runSetup, fetchList, fetchAvailableItems]);

  const fetchControls = useCallback(async (pn: string) => {
    if (!pn) {
      setAvailableControls([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/repair-request/controls?partNumber=${encodeURIComponent(pn)}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableControls(data);
      }
    } catch (err) {
      console.error("Failed to fetch control numbers", err);
    }
  }, []);

  const handlePartNumberChange = (val: string) => {
    const match = availableItems.find((i) => i.PartNumber === val);
    setForm((prev) => ({
      ...prev,
      part_number: val,
      brand_model: match ? (match.Brand || "") : "",
      tool_description: match ? (match.PartDescription || "") : "",
      control_number: "",
    }));
    setShowSuggestions(true);

    if (match) {
      fetchControls(val);
    } else {
      setAvailableControls([]);
    }
  };

  const searchPersonnel = async (q: string, field: string) => {
    setForm((s) => ({ ...s, [field]: q }));
    setActivePersonnelField(field);

    if (q.length < 1) {
      setPersonnelSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`/api/admin/personnel/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setPersonnelSuggestions(data);
      }
    } catch (err) {
      console.error("Failed to search personnel", err);
    }
  };

  const handlePersonnelSelect = (name: string, field: string) => {
    setForm((s) => ({ ...s, [field]: name }));
    setPersonnelSuggestions([]);
    setActivePersonnelField(null);
  };

  const filteredItems = useMemo(() => {
    const q = form.part_number.toLowerCase().trim();
    if (!q) return [];
    return availableItems.filter((i) =>
      i.PartNumber.toLowerCase().includes(q) ||
      (i.Brand || "").toLowerCase().includes(q) ||
      (i.PartDescription || "").toLowerCase().includes(q)
    ).slice(0, 10);
  }, [availableItems, form.part_number]);

  const resetForm = () => {
    setForm({
      form_no: "",
      form_date: todayISO(),
      to_purchase: false,
      for_filing: true,
      part_number: "",
      brand_model: "",
      quantity: "",
      tool_description: "",
      control_number: "",
      utilization: "",
      service_priority: "",
      low_repair_date: "",
      jo_no: "",
      jo_customer: "",
      jo_desc: "",
      summary_problems: "",
      requester_name: "",
      designation: "",
      bay_section: "",
      foreman: "",
      tool_keeper_name: "",
      accepted_by: "",
      service_findings: "",
      corrective_reconditioned: false,
      corrective_parts_replaced: false,
      corrective_others: "",
      final_repairable: false,
      final_usable_parts_extraction: false,
      final_disposal: false,
      final_unit_replacement: false,
      pr_no: "",
      pr_date: "",
      requested_by: "",
      prepared_by: "",
      inspected_by: "",
      approved_by: "",
    });
    setFaultChecks({});
    setPartsNeeded(emptyPartsNeeded());
    setAvailableControls([]);
    setEditId(null);
    setViewOnly(false);
  };

  const hydrateFormFromRow = (r: RepairRow) => {
    const faults = parseJsonMaybe<Record<string, string[]>>(r.faults_json) || null;
    const parts = parseJsonMaybe<string[]>(r.parts_needed_json) || null;

    setForm((prev) => ({
      ...prev,
      form_no: r.form_no || "",
      form_date: typeof r.form_date === "string" ? r.form_date.slice(0, 10) : (r.form_date as unknown as string),
      to_purchase: prev.to_purchase,
      for_filing: prev.for_filing,
      part_number: r.part_number || "",
      brand_model: r.brand_model || "",
      quantity: r.quantity || "",
      tool_description: r.tool_description || "",
      control_number: r.control_number || "",
      utilization: (r.utilization as "" | "site" | "shop") || "",
      service_priority: (r.service_priority as "" | "high" | "medium" | "low") || "",
      low_repair_date: r.low_repair_date || "",
      jo_no: r.jo_no || "",
      jo_customer: r.jo_customer || "",
      jo_desc: r.jo_desc || "",
      summary_problems: r.summary_problems || "",
      requester_name: r.requester_name || "",
      designation: r.designation || "",
      bay_section: r.bay_section || "",
      foreman: r.foreman || "",
      tool_keeper_name: r.tool_keeper_name || "",
      accepted_by: r.accepted_by || "",
      service_findings: r.service_findings || "",
      corrective_reconditioned: !!r.corrective_reconditioned,
      corrective_parts_replaced: !!r.corrective_parts_replaced,
      corrective_others: r.corrective_others || "",
      final_repairable: !!r.final_repairable,
      final_usable_parts_extraction: !!r.final_usable_parts_extraction,
      final_disposal: !!r.final_disposal,
      final_unit_replacement: !!r.final_unit_replacement,
      pr_no: r.pr_no || "",
      pr_date: r.pr_date || "",
      requested_by: r.requested_by || "",
      prepared_by: r.prepared_by || "",
      inspected_by: r.inspected_by || "",
      approved_by: r.approved_by || "",
    }));

    if (faults) {
      const nextChecks: Record<string, boolean> = {};
      for (const g of Object.keys(faults)) {
        const arr = faults[g] || [];
        for (const id of arr) nextChecks[id] = true;
      }
      setFaultChecks(nextChecks);
    } else {
      setFaultChecks({});
    }

    if (parts && Array.isArray(parts)) {
      const trimmed = parts.map((s) => String(s ?? "").trim());
      setPartsNeeded(trimmed.length ? trimmed : emptyPartsNeeded());
    } else {
      setPartsNeeded(emptyPartsNeeded());
    }

    if (r.part_number) fetchControls(r.part_number);
  };

  const startEdit = (r: RepairRow) => {
    setViewOnly(false);
    hydrateFormFromRow(r);
    setEditId(r.id);
    setIsFormModalOpen(true);
  };

  const startView = (r: RepairRow) => {
    setViewOnly(true);
    hydrateFormFromRow(r);
    setEditId(null);
    setIsFormModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingRow) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/repair-request/${deletingRow.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Delete failed.");
        return;
      }
      toast.success(data.message || "Deleted.");
      setDeletingRow(null);
      fetchList();
    } catch {
      toast.error("Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = (r: RepairRow) => {
    const faults = parseJsonMaybe<Record<string, string[]>>(r.faults_json) || {};
    const parts = parseJsonMaybe<string[]>(r.parts_needed_json) || [];
    const allFaultIds = new Set([
      ...(faults.general || []),
      ...(faults.mechanical || []),
      ...(faults.electrical || []),
      ...(faults.safety || []),
    ]);
    const ck = (id: string) => allFaultIds.has(id) ? "checked" : "";
    const v = (s: string | null | undefined) => s || "";
    const fmtDate = (d: string | null | undefined) => {
      if (!d) return "";
      const s = d.slice(0, 10);
      const [y, m, dd] = s.split("-");
      return m && dd && y ? `${m}/${dd}/${y}` : s;
    };
    const fd = typeof r.form_date === "string" ? r.form_date.slice(0, 10) : "";
    const partsRows = Array.from({ length: 10 }, (_, i) => {
      const val = parts[i] ? parts[i].replace(/"/g, "&quot;") : "";
      return `<span>${i + 1}.</span><span class="u-line" style="min-height:16px;display:inline-block;width:100%">${val}</span>`;
    }).join("\n");

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Request for Repair Form - Enertech Systems</title>
<style>
:root{--border-color:#000;--font-main:'Arial',sans-serif}
body{font-family:var(--font-main);font-size:11px;background:#fff;padding:0;margin:0}
.page-container{width:100%;max-width:100%;margin:0 auto;background:#fff;padding:0.3in;box-sizing:border-box}
@page{margin:0.3in}
.header-top{display:grid;grid-template-columns:1.5fr 3fr 1.5fr;grid-template-rows:auto auto;align-items:flex-end;margin-bottom:5px;gap:10px}
.u-line{border:none;border-bottom:1px solid var(--border-color);padding:0 5px;font-family:inherit;font-size:11px;outline:none;background:transparent}
.fieldset-custom{border:1px solid var(--border-color);margin-bottom:12px;padding:10px;position:relative}
.fieldset-custom legend{font-weight:bold;padding:0 5px;margin-left:10px}
.row{display:flex;gap:8px;margin-bottom:10px}
.faults-container{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}
.column-title{font-weight:bold;height:18px;display:flex;align-items:center;margin-bottom:2px}
.check-item{display:flex;align-items:center;height:16px;margin-bottom:2px;white-space:nowrap}
.check-item input{margin-right:5px}
.text-box{width:100%;border:1px solid var(--border-color);margin-top:5px;box-sizing:border-box;padding:5px;font-family:inherit;min-height:60px;white-space:pre-wrap}
.user-section{display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:repeat(6,16px)}
.user-left{padding-left:15px}.user-middle{padding:0 10px}
.user-right{border-left:1px solid var(--border-color);padding-left:20px}
.user-cell{display:flex;align-items:center}
.sig-line{width:100%;border-top:1px solid var(--border-color);margin-top:2px;font-size:11px;text-align:center}
.label-val{display:flex;margin-bottom:8px;align-items:flex-end}
.label-val span{min-width:80px}
.maintenance-divider{border-top:2px dashed #000;margin:20px 0 5px 0;text-align:center}
.maintenance-divider span{display:block;margin-top:5px;font-style:italic;font-weight:bold;font-size:12px}
.footer-sections{display:grid;grid-template-columns:1.2fr 1fr 1.2fr;gap:0;width:100%}
.parts-grid{display:grid;grid-template-columns:20px 1fr;gap:4px}
.technician-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:40px;margin-top:15px;text-align:left}
@media print{body{background:none;padding:0}.page-container{padding:0;width:100%;max-width:none}.job-order-print-reduce{flex:1!important}}
</style></head><body>
<div class="page-container">
  <div class="header-top">
    <div style="grid-row:1;grid-column:1;display:flex;gap:10px">
      <label><input type="checkbox" ${r.corrective_parts_replaced ? "checked" : ""}> To Purchase</label>
      <label><input type="checkbox" checked> For Filing</label>
    </div>
    <div style="grid-row:1;grid-column:2;text-align:center">
      <h1 style="font-size:16px;margin:0;letter-spacing:0.5px">ENERTECH SYSTEMS INDUSTRIES, INC.</h1>
    </div>
    <div style="grid-row:1;grid-column:3;text-align:right">
      <div style="display:flex;align-items:center;justify-content:flex-end">
        <span style="font-size:11px;font-weight:bold;width:45px">No:</span>
        <span style="font-size:24px;font-weight:bold;font-family:'Courier New',Courier,monospace;border-bottom:1px solid black;width:100px;text-align:center;margin-left:5px">${v(r.form_no)}</span>
      </div>
    </div>
    <div style="grid-row:2;grid-column:1/span 2;text-align:left">
      <div style="font-size:13px;font-weight:bold">REQUEST FOR REPAIR FORM (Tools/Equipment/Machinery)</div>
    </div>
    <div style="grid-row:2;grid-column:3;text-align:right">
      <div style="display:flex;align-items:center;justify-content:flex-end">
        <span style="font-size:11px;font-weight:bold;width:45px">Date:</span>
        <span class="u-line" style="width:100px;margin-left:5px;text-align:center;display:inline-block">${fd}</span>
      </div>
    </div>
  </div>

  <fieldset class="fieldset-custom"><legend>Tools Detail</legend>
    <div class="row" style="gap:25px">
      <div style="flex:1.2;display:flex;align-items:center"><span style="min-width:90px">Part Number</span> : <span class="u-line" style="flex:1;margin-left:5px;display:inline-block">${v(r.part_number)}</span></div>
      <div style="flex:1.2;display:flex;align-items:center"><span style="min-width:90px">Brand/Model</span> : <span class="u-line" style="flex:1;margin-left:5px;display:inline-block">${v(r.brand_model)}</span></div>
      <div style="flex:1;display:flex;align-items:center"><span style="min-width:100px">Quantity</span> : <span class="u-line" style="flex:1;margin-left:5px;display:inline-block">${v(r.quantity)}</span></div>
    </div>
    <div class="row" style="margin-bottom:0;gap:25px">
      <div style="flex:1.5;display:flex;align-items:center"><span style="min-width:90px">Description</span> : <span class="u-line" style="flex:1;margin-left:5px;display:inline-block">${v(r.tool_description)}</span></div>
      <div style="flex:1;display:flex;align-items:center"><span style="min-width:100px">Control Number</span> : <span class="u-line" style="flex:1;margin-left:5px;display:inline-block">${v(r.control_number)}</span></div>
    </div>
  </fieldset>

  <div class="row" style="gap:8px">
    <fieldset class="fieldset-custom" style="flex:0.35;margin-bottom:0"><legend>Utilization</legend>
      <div style="display:grid;grid-template-columns:1fr;grid-template-rows:repeat(2,minmax(16px,auto));gap:2px">
        <div class="check-item"><input type="checkbox" ${r.utilization === "site" ? "checked" : ""}><span style="margin-left:5px">Site</span></div>
        <div class="check-item"><input type="checkbox" ${r.utilization === "shop" ? "checked" : ""}><span style="margin-left:5px">Shop</span></div>
      </div>
    </fieldset>
    <fieldset class="fieldset-custom" style="flex:0.7;margin-bottom:0"><legend>Service Priority</legend>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,minmax(16px,auto));gap:5px">
        <div class="check-item"><input type="checkbox" ${r.service_priority === "high" ? "checked" : ""}><span style="margin-left:5px">High</span></div>
        <div class="check-item"><input type="checkbox" ${r.service_priority === "medium" ? "checked" : ""}><span style="margin-left:5px">Medium</span></div>
        <div class="check-item"><input type="checkbox" ${r.service_priority === "low" ? "checked" : ""}><span style="margin-left:5px">Low</span></div>
        <div style="grid-column:span 3;display:flex;align-items:flex-end;flex-wrap:nowrap">
          <span style="font-size:10px;padding-left:10px;white-space:nowrap">For low, please set repair date :</span>
          <span class="u-line" style="flex:1;min-width:20px;margin-left:5px;display:block;min-height:14px">${fmtDate(r.low_repair_date)}</span>
        </div>
      </div>
    </fieldset>
    <fieldset class="fieldset-custom job-order-print-reduce" style="flex:3.45;margin-bottom:0"><legend>Job Order</legend>
      <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(2,minmax(16px,auto));gap:5px">
        <div style="display:flex;align-items:center"><span style="white-space:nowrap">J.O. No.</span> : <span class="u-line" style="flex:1;margin-left:5px;display:inline-block">${v(r.jo_no)}</span></div>
        <div style="display:flex;align-items:center"><span style="margin-left:5px">Customer</span> : <span class="u-line" style="flex:1;margin-left:5px;display:inline-block">${v(r.jo_customer)}</span></div>
        <div style="grid-column:span 2;display:flex;align-items:center"><span>Desc.</span> : <span class="u-line" style="flex:1;margin-left:5px;display:inline-block">${v(r.jo_desc)}</span></div>
      </div>
    </fieldset>
  </div>

  <fieldset class="fieldset-custom"><legend>Faults</legend>
    <div class="faults-container">
      <div>
        <span class="column-title">General Issues</span>
        <div class="check-item"><input type="checkbox" ${ck("no_power")}><span style="margin-left:10px">No Power</span></div>
        <div class="check-item"><input type="checkbox" ${ck("overheating")}><span style="margin-left:10px">Overheating</span></div>
        <div class="check-item"><input type="checkbox" ${ck("unusual_noise")}><span style="margin-left:10px">Unusual Noise</span></div>
        <div class="check-item"><input type="checkbox" ${ck("vibrating_issues")}><span style="margin-left:10px">Vibrating Issues</span></div>
        <div class="check-item"><input type="checkbox" ${ck("not_functioning")}><span style="margin-left:10px">Not Functioning Properly</span></div>
        <div class="check-item"><input type="checkbox" ${ck("slow_performance")}><span style="margin-left:10px">Slow Performance</span></div>
        <div class="check-item"><input type="checkbox" ${ck("frequent_shutdown")}><span style="margin-left:10px">Frequent Shutdown</span></div>
      </div>
      <div>
        <div class="check-item"><input type="checkbox" ${ck("display_indicator_error")}><span style="margin-left:10px">Display/Indicator Error</span></div>
        <div class="check-item"><input type="checkbox" ${ck("switch_buttons_not_working")}><span style="margin-left:10px">Switch/Buttons Not Working</span></div>
        <div class="check-item"><input type="checkbox" ${ck("software_error")}><span style="margin-left:10px">Software/Program Error</span></div>
        <span class="column-title">Mechanical Issues</span>
        <div class="check-item"><input type="checkbox" ${ck("loose_parts")}><span style="margin-left:10px">Loose Parts</span></div>
        <div class="check-item"><input type="checkbox" ${ck("jammed_stuck")}><span style="margin-left:10px">Jammed/Stuck Mechanism</span></div>
        <div class="check-item"><input type="checkbox" ${ck("broken_damaged_parts")}><span style="margin-left:10px">Broken/Damaged Parts</span></div>
        <div class="check-item"><input type="checkbox" ${ck("leaking")}><span style="margin-left:10px">Leaking Fluid/Air</span></div>
      </div>
      <div>
        <div class="check-item"><input type="checkbox" ${ck("misalignment")}><span style="margin-left:10px">Misalignment</span></div>
        <div class="check-item"><input type="checkbox" ${ck("rust_corrosion")}><span style="margin-left:10px">Rust/Corrosion</span></div>
        <div class="check-item"><input type="checkbox" ${ck("wear_tear")}><span style="margin-left:10px">Wear and Tear</span></div>
        <span class="column-title">Electrical Issues</span>
        <div class="check-item"><input type="checkbox" ${ck("blown_fuse")}><span style="margin-left:10px">Blown Fuse</span></div>
        <div class="check-item"><input type="checkbox" ${ck("wiring_issue")}><span style="margin-left:10px">Wiring Issue</span></div>
        <div class="check-item"><input type="checkbox" ${ck("short_circuit")}><span style="margin-left:10px">Short Circuit</span></div>
        <div class="check-item"><input type="checkbox" ${ck("sparks_smokes")}><span style="margin-left:10px">Sparks and Smokes</span></div>
      </div>
      <div>
        <div class="check-item"><input type="checkbox" ${ck("battery_not_charging")}><span style="margin-left:10px">Battery Not Charging</span></div>
        <div class="check-item"><input type="checkbox" ${ck("voltage_fluctuation")}><span style="margin-left:10px">Voltage Fluctuation</span></div>
        <span class="column-title">Safety Concerns</span>
        <div class="check-item"><input type="checkbox" ${ck("exposed_wiring")}><span style="margin-left:10px">Exposed Wiring</span></div>
        <div class="check-item"><input type="checkbox" ${ck("missing_broken_safety_locks")}><span style="margin-left:10px">Missing/Broken Safety Locks</span></div>
        <div class="check-item"><input type="checkbox" ${ck("emergency_stop_not_working")}><span style="margin-left:10px">Emergency Stop Not Working</span></div>
        <div class="check-item"><input type="checkbox" ${ck("protective_cover_missing")}><span style="margin-left:10px">Protective Cover Missing</span></div>
        <div class="check-item"><input type="checkbox" ${ck("risk_of_burns")}><span style="margin-left:10px">Risk OF Burns (Hot Surface)</span></div>
      </div>
    </div>
    <div style="margin-top:15px"><strong>Summary/Detailed Problems Encountered</strong><div class="text-box">${v(r.summary_problems)}</div></div>
  </fieldset>

  <div class="user-section">
    <div class="user-left user-cell" style="grid-row:1;grid-column:1"><strong>User Details</strong></div>
    <div class="user-middle" style="grid-row:1;grid-column:2"></div>
    <div class="user-right" style="grid-row:1;grid-column:3"></div>
    <div class="user-left user-cell" style="grid-row:2;grid-column:1"><div class="label-val" style="margin:0;width:100%"><span style="padding-left:10px">Name</span> : <span class="u-line" style="flex:1;margin-left:5px;display:inline-block">${v(r.requester_name)}</span></div></div>
    <div class="user-middle user-cell" style="grid-row:2;grid-column:2;justify-content:flex-start;padding-left:10px">Name</div>
    <div class="user-right user-cell" style="grid-row:2;grid-column:3"><div class="label-val" style="margin:0;width:100%"><span style="padding-left:10px">Name</span> : <span style="flex:1;text-align:center;border-bottom:1px solid #000;margin-left:10px;display:inline-block">${v(r.tool_keeper_name)}</span></div></div>
    <div class="user-left user-cell" style="grid-row:3;grid-column:1"><div class="label-val" style="margin:0;width:100%"><span style="padding-left:10px">Designation</span> : <span class="u-line" style="flex:1;margin-left:5px;display:inline-block">${v(r.designation)}</span></div></div>
    <div class="user-middle" style="grid-row:3;grid-column:2"></div>
    <div class="user-right user-cell" style="grid-row:3;grid-column:3;font-size:10px"><div style="display:flex;width:100%"><span style="visibility:hidden;min-width:80px">Name</span><span style="visibility:hidden"> : </span><span style="flex:1;text-align:center;margin-left:10px">Tool Keeper</span></div></div>
    <div class="user-left user-cell" style="grid-row:4;grid-column:1"><div class="label-val" style="margin:0;width:100%"><span style="padding-left:10px">Bay/Section</span> : <span class="u-line" style="flex:1;margin-left:5px;display:inline-block">${v(r.bay_section)}</span></div></div>
    <div class="user-middle user-cell" style="grid-row:4;grid-column:2;align-items:flex-end;justify-content:center"><div class="sig-line" style="width:80%;margin:0"></div></div>
    <div class="user-right" style="grid-row:4;grid-column:3"></div>
    <div class="user-left user-cell" style="grid-row:5;grid-column:1"><div class="label-val" style="margin:0;width:100%"><span style="padding-left:10px">Foreman</span> : <span class="u-line" style="flex:1;margin-left:5px;display:inline-block">${v(r.foreman)}</span></div></div>
    <div class="user-middle user-cell" style="grid-row:5;grid-column:2;justify-content:center;font-size:10px">Signature Over Printed Name</div>
    <div class="user-right user-cell" style="grid-row:5;grid-column:3"><div class="label-val" style="margin:0;width:100%"><span style="padding-left:10px">Accepted by</span> : <span style="flex:1;border-bottom:1px solid #000;margin-left:10px;display:inline-block;text-align:center">${v(r.accepted_by)}</span></div></div>
    <div class="user-left" style="grid-row:6;grid-column:1"></div>
    <div class="user-middle" style="grid-row:6;grid-column:2"></div>
    <div class="user-right user-cell" style="grid-row:6;grid-column:3;font-size:10px"><div style="display:flex;width:100%"><span style="visibility:hidden;min-width:80px">Accepted by</span><span style="visibility:hidden"> : </span><span style="flex:1;text-align:center;margin-left:10px">Maintenance Personnel</span></div></div>
  </div>

  <div class="maintenance-divider"><span>FOR MAINTENANCE TECHNICIAN INPUT ONLY</span></div>

  <fieldset class="fieldset-custom"><legend>Service Findings</legend><div class="text-box" style="height:100px">${v(r.service_findings)}</div></fieldset>

  <div class="footer-sections">
    <fieldset class="fieldset-custom" style="margin:0"><legend>Corrective Actions</legend>
      <div style="display:flex;gap:15px">
        <div class="check-item"><input type="checkbox" ${r.corrective_reconditioned ? "checked" : ""}> Reconditioned / Repaired</div>
        <div class="check-item"><input type="checkbox" ${r.corrective_parts_replaced ? "checked" : ""}> Parts Replaced</div>
      </div>
      <p style="margin:10px 0 5px 0">Others, write a short summary</p>
      <div class="text-box" style="height:80px">${v(r.corrective_others)}</div>
    </fieldset>
    <fieldset class="fieldset-custom" style="margin:0;border-left:none"><legend>Part(s) Needed</legend>
      <div class="parts-grid">${partsRows}</div>
    </fieldset>
    <fieldset class="fieldset-custom" style="margin:0;border-left:none"><legend>Final Assesment</legend>
      <div class="check-item"><input type="checkbox" ${r.final_repairable ? "checked" : ""}><span style="margin-left:10px">Repairable</span></div>
      <div class="check-item"><input type="checkbox" ${r.final_usable_parts_extraction ? "checked" : ""}><span style="margin-left:10px">Usable Parts Extraction</span></div>
      <div class="check-item"><input type="checkbox" ${r.final_disposal ? "checked" : ""}><span style="margin-left:10px">Disposal</span></div>
      <div class="check-item"><input type="checkbox" ${r.final_unit_replacement ? "checked" : ""}><span style="margin-left:10px">Unit Replacement</span></div>
      <div style="margin-top:10px;padding-left:32px">
        <div class="label-val" style="margin-bottom:5px"><span style="min-width:50px">PR No.</span> : <span class="u-line" style="width:120px;margin-left:5px;display:inline-block">${v(r.pr_no)}</span></div>
        <div class="label-val"><span style="min-width:50px">PR Date</span> : <span class="u-line" style="width:120px;margin-left:5px;display:inline-block">${fmtDate(r.pr_date)}</span></div>
      </div>
      <div style="margin-top:10px;padding-left:32px">Requested by;<div style="margin-top:10px;text-align:center;width:230px"><span style="display:block;margin-bottom:2px">${v(r.requested_by)}</span><div class="sig-line" style="width:230px">Print Name and Sign</div></div></div>
    </fieldset>
  </div>

  <div class="technician-grid">
    <div>Prepared by:<br><div style="margin-top:10px;text-align:center;width:180px"><span style="display:block;margin-bottom:2px">${v(r.prepared_by)}</span><div style="border-top:1px solid #000;text-align:center">Technician</div></div></div>
    <div>Inspected by:<br><div style="margin-top:10px;text-align:center;width:180px"><span style="display:block;margin-bottom:2px">${v(r.inspected_by)}</span><div style="border-top:1px solid #000;text-align:center">Maintenance Foreman</div></div></div>
    <div>Approved by:<br><div style="margin-top:10px;text-align:center;width:180px"><span style="display:block;margin-bottom:2px">${v(r.approved_by)}</span><div style="border-top:1px solid #000;text-align:center">Maintenance Supervisor</div></div></div>
  </div>
</div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  const buildFaultsJson = () => {
    const out: Record<string, string[]> = {
      general: [],
      mechanical: [],
      electrical: [],
      safety: [],
    };
    for (const g of FAULT_GROUPS) {
      out[g.key] = g.items.filter((i) => faultChecks[i.id]).map((i) => i.id);
    }
    return out;
  };

  const addPartNeeded = () => {
    setPartsNeeded((prev) => [...prev, ""]);
  };

  const removePartNeeded = () => {
    setPartsNeeded((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (viewOnly) return;
    if (!form.form_date) {
      toast.error("Date is required.");
      return;
    }

    const faults_json = buildFaultsJson();
    const hasFault =
      faults_json.general.length +
        faults_json.mechanical.length +
        faults_json.electrical.length +
        faults_json.safety.length >
      0;

    setSaving(true);
    try {
      const url = editId ? `/api/admin/repair-request/${editId}` : "/api/admin/repair-request";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          faults_json: hasFault ? faults_json : null,
          parts_needed: partsNeeded.map((s) => s.trim()),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Save failed.");
        return;
      }
      toast.success(data.message || (editId ? "Updated." : "Saved."));
      resetForm();
      setIsFormModalOpen(false);
      fetchList();
    } catch {
      toast.error("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const blob = [
        r.form_no,
        r.part_number,
        r.tool_description,
        r.control_number,
        r.service_priority,
        r.requester_name,
        formatAssessment(r),
        r.form_date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [rows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage]);

  const indexOfFirst = (currentPage - 1) * itemsPerPage;
  const indexOfLast = indexOfFirst + pageRows.length;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    const checkScrollbar = () => {
      if (scrollRef.current) {
        setHasScrollbar(scrollRef.current.scrollHeight > scrollRef.current.clientHeight);
      }
    };

    checkScrollbar();
    window.addEventListener("resize", checkScrollbar);
    return () => window.removeEventListener("resize", checkScrollbar);
  }, [loadingList, searchQuery, currentPage, totalPages, filteredRows.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".action-menu-btn") && !target.closest(".action-menu-dropdown")) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFault = (id: string) => {
    setFaultChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fieldClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100";

  const labelClass = "mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400";

  return (
    <div className="flex flex-col h-[calc(100vh-128px)] space-y-4 max-w-full overflow-hidden">
      <div className="flex flex-col gap-4 px-1 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Hammer className="size-6 text-primary" aria-hidden />
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Tools Repair
            </h2>
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Request for repair (tools / equipment / machinery). Use{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">Create request</span>{" "}
            to open the form. Saves to{" "}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">repair_request</code>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              await runSetup();
              fetchList();
            }}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Database className="size-4" />
            Ensure table
          </button>
          <button
            type="button"
            onClick={() => fetchList()}
            disabled={loadingList}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCw className={cn("size-4", loadingList && "animate-spin")} />
            Refresh list
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setViewOnly(false);
              setIsFormModalOpen(true);
            }}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Create request
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col min-h-0 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0 px-1">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Request for repair</h3>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Track and manage repair requests for tools / equipment / machinery.
            </p>
          </div>
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by no., part, description, priority…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/50 min-h-0">
          <div
            className={cn(
              "shrink-0 overflow-x-hidden border-b border-gray-200 dark:border-gray-800 bg-blue-50/95 dark:bg-blue-900 transition-[padding]",
              hasScrollbar ? "pr-[16px]" : "pr-0",
            )}
          >
            <table className="w-full border-collapse text-left text-sm table-fixed">
              <thead>
                <tr className="text-blue-900 dark:text-blue-200 whitespace-nowrap">
                  <th className="border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800 w-[12%]">
                    No.
                  </th>
                  <th className="border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800 w-[12%]">
                    Date
                  </th>
                  <th className="border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800 w-[12%]">
                    Part #
                  </th>
                  <th className="border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800 w-[18%]">
                    Description
                  </th>
                  <th className="border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800 w-[12%]">
                    Control #
                  </th>
                  <th className="border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800 w-[10%]">
                    Priority
                  </th>
                  <th className="border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800 w-[12%]">
                    Requester
                  </th>
                  <th className="border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800 w-[12%]">
                    Assessment
                  </th>
                  <th className="px-4 py-1.5 font-semibold text-center w-[8%]">Actions</th>
                </tr>
              </thead>
            </table>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-transparent border-b border-gray-200 dark:border-gray-800"
          >
            <table className="w-full border-collapse text-left text-sm table-fixed">
              <tbody>
                {loadingList ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-12 text-center text-gray-500">
                      <Loader2 className="mx-auto size-6 animate-spin" />
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-gray-500">
                      {setupDone
                        ? "No repair requests yet. Click Create request to add one."
                        : "Could not load data. Use “Ensure table” if the database is new."}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r) => (
                    <tr
                      key={r.id}
                      className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30 whitespace-nowrap group"
                    >
                      <td className="border-b border-r border-gray-100 px-4 py-1 text-gray-700 dark:border-gray-800 dark:text-gray-300 group-last:border-b-0 w-[12%]">
                        {r.form_no || "—"}
                      </td>
                      <td className="border-b border-r border-gray-100 px-4 py-1 text-gray-700 dark:border-gray-800 dark:text-gray-300 group-last:border-b-0 w-[12%]">
                        {typeof r.form_date === "string" ? r.form_date.slice(0, 10) : r.form_date}
                      </td>
                      <td className="border-b border-r border-gray-100 px-4 py-1 text-gray-700 dark:border-gray-800 dark:text-gray-300 group-last:border-b-0 w-[12%]">
                        {r.part_number || "—"}
                      </td>
                      <td
                        className="border-b border-r border-gray-100 px-4 py-1 text-gray-700 dark:border-gray-800 dark:text-gray-300 truncate group-last:border-b-0 w-[18%]"
                        title={r.tool_description || ""}
                      >
                        {r.tool_description || "—"}
                      </td>
                      <td className="border-b border-r border-gray-100 px-4 py-1 text-gray-700 dark:border-gray-800 dark:text-gray-300 group-last:border-b-0 w-[12%]">
                        {r.control_number || "—"}
                      </td>
                      <td className="border-b border-r border-gray-100 px-4 py-1 text-gray-700 dark:border-gray-800 dark:text-gray-300 group-last:border-b-0 w-[10%]">
                        {formatPriority(r.service_priority)}
                      </td>
                      <td
                        className="border-b border-r border-gray-100 px-4 py-1 text-gray-700 dark:border-gray-800 dark:text-gray-300 truncate group-last:border-b-0 w-[12%]"
                        title={r.requester_name || ""}
                      >
                        {r.requester_name || "—"}
                      </td>
                      <td
                        className="border-b border-gray-100 px-4 py-1 text-gray-500 dark:border-gray-800 dark:text-gray-400 truncate group-last:border-b-0 w-[12%]"
                        title={formatAssessment(r)}
                      >
                        {formatAssessment(r)}
                      </td>
                      <td className="border-b border-gray-100 px-2 py-1 text-center dark:border-gray-800 group-last:border-b-0 w-[8%]">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenuId(openActionMenuId === r.id ? null : r.id);
                            }}
                            className="action-menu-btn inline-flex size-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                            title="Actions"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                          {openActionMenuId === r.id && (
                            <div
                              className={cn(
                                "action-menu-dropdown absolute right-0 z-50 w-36 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800",
                                pageRows.length > 5 && index >= pageRows.length - 3
                                  ? "bottom-full mb-1"
                                  : "top-full mt-1",
                              )}
                            >
                              <div className="flex flex-col py-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionMenuId(null);
                                    startView(r);
                                  }}
                                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/60 dark:hover:text-gray-100 text-left"
                                >
                                  <Eye className="size-3.5 shrink-0" />
                                  <span>View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionMenuId(null);
                                    handlePrint(r);
                                  }}
                                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-green-50 hover:text-green-600 dark:text-gray-300 dark:hover:bg-green-900/30 dark:hover:text-green-400 text-left"
                                >
                                  <Printer className="size-3.5 shrink-0" />
                                  <span>Print</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionMenuId(null);
                                    startEdit(r);
                                  }}
                                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 text-left"
                                >
                                  <Pencil className="size-3.5 shrink-0" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionMenuId(null);
                                    setDeletingRow(r);
                                  }}
                                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-400 text-left"
                                >
                                  <Trash2 className="size-3.5 shrink-0" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 shrink-0 md:flex-row md:items-center md:justify-between z-10">
            <div className="text-center text-xs text-gray-500 md:text-left">
              Showing <span className="font-medium">{filteredRows.length ? indexOfFirst + 1 : 0}</span>{" "}
              to <span className="font-medium">{indexOfLast}</span> of{" "}
              <span className="font-medium">{filteredRows.length}</span>{" "}
              {searchQuery && "matching"} requests
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
              >
                Prev
              </button>

              <div className="flex items-center text-xs font-medium">
                Page {currentPage} of {totalPages}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {isFormModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => {
            setIsFormModalOpen(false);
            setViewOnly(false);
          }}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-[1312px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900"
            role="dialog"
            aria-modal="true"
            aria-labelledby="repair-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800 md:px-6">
              <h3
                id="repair-modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {viewOnly ? "View Request for Repair" : editId ? "Edit Request for Repair" : "New Request for Repair"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsFormModalOpen(false);
                  setViewOnly(false);
                }}
                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
                <fieldset disabled={viewOnly} className="space-y-4">
        <Section title="Transaction no. and Date">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className={labelClass}>Transaction No.</span>
              <input
                className={fieldClass}
                value={form.form_no}
                onChange={(e) => setForm((s) => ({ ...s, form_no: e.target.value }))}
                placeholder="e.g. 200000"
              />
            </div>
            <div>
              <span className={labelClass}>Date *</span>
              <input
                type="date"
                required
                className={fieldClass}
                value={form.form_date}
                onChange={(e) => setForm((s) => ({ ...s, form_date: e.target.value }))}
              />
            </div>
            <div className="hidden lg:block" />
            <div className="hidden lg:block" />
          </div>
        </Section>

        <Section title="Tools Detail">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <span className={labelClass}>Part number</span>
              <input
                className={fieldClass}
                value={form.part_number}
                onChange={(e) => handlePartNumberChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search part number..."
                autoComplete="off"
              />
              {showSuggestions && filteredItems.length > 0 && (
                <div className="absolute left-0 top-[calc(100%+4px)] z-[110] w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                  <div className="max-h-60 overflow-y-auto">
                    {filteredItems.map((item) => (
                      <button
                        key={item.PartNumber}
                        type="button"
                        onClick={() => {
                          handlePartNumberChange(item.PartNumber);
                          setShowSuggestions(false);
                        }}
                        className="flex w-full flex-col px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <span className="text-sm font-bold text-primary">{item.PartNumber}</span>
                        <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {item.Brand} {item.Brand && "•"} {item.PartDescription}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <span className={labelClass}>Brand / model</span>
              <input
                className={cn(fieldClass, "bg-gray-50 font-medium cursor-not-allowed")}
                value={form.brand_model}
                readOnly
              />
            </div>
            <div>
              <span className={labelClass}>Quantity</span>
              <input
                className={fieldClass}
                value={form.quantity}
                onChange={(e) => setForm((s) => ({ ...s, quantity: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <span className={labelClass}>Description</span>
              <input
                className={cn(fieldClass, "bg-gray-50 font-medium cursor-not-allowed")}
                value={form.tool_description}
                readOnly
              />
            </div>
            <div>
              <span className={labelClass}>Control number</span>
              <select
                className={fieldClass}
                value={form.control_number}
                onChange={(e) => setForm((s) => ({ ...s, control_number: e.target.value }))}
              >
                <option value="">
                  {!form.part_number
                    ? "Select part number first"
                    : availableControls.length === 0
                    ? "No items in inventory"
                    : "Select control number..."}
                </option>
                {availableControls.map((c) => (
                  <option key={c.ControlNumber} value={c.ControlNumber}>
                    {c.ControlNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        <Section title="Utilization, Service Priority and Job Order">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_auto_minmax(0,1fr)] lg:gap-x-6 lg:gap-y-4 lg:items-start">
            <div>
              <span className={labelClass}>Utilization</span>
              <div className="flex flex-col gap-2 pt-1 text-sm sm:flex-row sm:flex-wrap sm:gap-4">
                {(["site", "shop"] as const).map((v) => (
                  <label key={v} className="flex items-center gap-2 capitalize">
                    <input
                      type="radio"
                      name="utilization"
                      checked={form.utilization === v}
                      onChange={() => setForm((s) => ({ ...s, utilization: v }))}
                    />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <span className={labelClass}>Service Priority</span>
              <div className="flex flex-col gap-2 pt-1 text-sm sm:flex-row sm:flex-wrap sm:gap-4">
                {(["high", "medium", "low"] as const).map((v) => (
                  <label key={v} className="flex items-center gap-2 capitalize">
                    <input
                      type="radio"
                      name="priority"
                      checked={form.service_priority === v}
                      onChange={() => setForm((s) => ({ ...s, service_priority: v }))}
                    />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-3 lg:min-w-0">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className={labelClass}>Job Order Number</span>
                  <input
                    className={fieldClass}
                    value={form.jo_no}
                    onChange={(e) => setForm((s) => ({ ...s, jo_no: e.target.value }))}
                  />
                </div>
                <div>
                  <span className={labelClass}>Customer</span>
                  <input
                    className={fieldClass}
                    value={form.jo_customer}
                    onChange={(e) => setForm((s) => ({ ...s, jo_customer: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="hidden lg:block" aria-hidden="true" />
            {form.service_priority === "low" ? (
              <div className="lg:min-w-0">
                <span className={labelClass}>For low priority — set repair date</span>
                <input
                  type="date"
                  className={fieldClass}
                  value={form.low_repair_date}
                  onChange={(e) => setForm((s) => ({ ...s, low_repair_date: e.target.value }))}
                />
              </div>
            ) : (
              <div className="hidden lg:block" aria-hidden="true" />
            )}
            <div className="lg:min-w-0">
              <span className={labelClass}>Description</span>
              <input
                className={fieldClass}
                value={form.jo_desc}
                onChange={(e) => setForm((s) => ({ ...s, jo_desc: e.target.value }))}
              />
            </div>
          </div>
        </Section>

        <Section title="Faults">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-start lg:gap-4">
            {FAULT_GROUPS.map((g) => (
              <div key={g.key} className="min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {g.title}
                </p>
                <div className="flex flex-col gap-2">
                  {g.items.map((item) => (
                    <label
                      key={item.id}
                      className="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-1 py-0.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-900/80"
                    >
                      <input
                        type="checkbox"
                        checked={!!faultChecks[item.id]}
                        onChange={() => toggleFault(item.id)}
                        className="mt-0.5 shrink-0 rounded border-gray-300"
                      />
                      <span className="leading-snug">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <span className={labelClass}>Summary / Detailed Problems Encountered</span>
            <textarea
              rows={4}
              className={cn(fieldClass, "resize-y")}
              value={form.summary_problems}
              onChange={(e) => setForm((s) => ({ ...s, summary_problems: e.target.value }))}
            />
          </div>
        </Section>

        <Section title="User Details">
          <div className="grid gap-6 sm:grid-cols-2 sm:items-start">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <span className={labelClass}>Name:</span>
                <input
                  className={fieldClass}
                  value={form.requester_name}
                  onChange={(e) => searchPersonnel(e.target.value, "requester_name")}
                  onFocus={() => setActivePersonnelField("requester_name")}
                  onBlur={() => setTimeout(() => setActivePersonnelField(null), 200)}
                  autoComplete="off"
                />
                {activePersonnelField === "requester_name" && personnelSuggestions.length > 0 && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-[110] w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="max-h-60 overflow-y-auto">
                      {personnelSuggestions.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePersonnelSelect(p.EmployeeName, "requester_name")}
                          className="flex w-full flex-col px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <span className="text-sm font-bold text-primary">{p.EmployeeName}</span>
                          <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {p.Department} {p.Department && "•"} {p.Position}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <span className={labelClass}>Designation:</span>
                <input
                  className={fieldClass}
                  value={form.designation}
                  onChange={(e) => setForm((s) => ({ ...s, designation: e.target.value }))}
                />
              </div>
              <div>
                <span className={labelClass}>Bay/Section:</span>
                <input
                  className={fieldClass}
                  value={form.bay_section}
                  onChange={(e) => setForm((s) => ({ ...s, bay_section: e.target.value }))}
                />
              </div>
              <div className="relative">
                <span className={labelClass}>Foreman:</span>
                <input
                  className={fieldClass}
                  value={form.foreman}
                  onChange={(e) => searchPersonnel(e.target.value, "foreman")}
                  onFocus={() => setActivePersonnelField("foreman")}
                  onBlur={() => setTimeout(() => setActivePersonnelField(null), 200)}
                  autoComplete="off"
                />
                {activePersonnelField === "foreman" && personnelSuggestions.length > 0 && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-[110] w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="max-h-60 overflow-y-auto">
                      {personnelSuggestions.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePersonnelSelect(p.EmployeeName, "foreman")}
                          className="flex w-full flex-col px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <span className="text-sm font-bold text-primary">{p.EmployeeName}</span>
                          <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {p.Department} {p.Department && "•"} {p.Position}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="relative">
                <span className={labelClass}>Tool Keeper:</span>
                <input
                  className={fieldClass}
                  value={form.tool_keeper_name}
                  onChange={(e) => searchPersonnel(e.target.value, "tool_keeper_name")}
                  onFocus={() => setActivePersonnelField("tool_keeper_name")}
                  onBlur={() => setTimeout(() => setActivePersonnelField(null), 200)}
                  autoComplete="off"
                />
                {activePersonnelField === "tool_keeper_name" && personnelSuggestions.length > 0 && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-[110] w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="max-h-60 overflow-y-auto">
                      {personnelSuggestions.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePersonnelSelect(p.EmployeeName, "tool_keeper_name")}
                          className="flex w-full flex-col px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <span className="text-sm font-bold text-primary">{p.EmployeeName}</span>
                          <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {p.Department} {p.Department && "•"} {p.Position}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <span className={labelClass}>Maintenance Personnel:</span>
                <input
                  className={fieldClass}
                  value={form.accepted_by}
                  onChange={(e) => searchPersonnel(e.target.value, "accepted_by")}
                  onFocus={() => setActivePersonnelField("accepted_by")}
                  onBlur={() => setTimeout(() => setActivePersonnelField(null), 200)}
                  autoComplete="off"
                />
                {activePersonnelField === "accepted_by" && personnelSuggestions.length > 0 && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-[110] w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="max-h-60 overflow-y-auto">
                      {personnelSuggestions.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePersonnelSelect(p.EmployeeName, "accepted_by")}
                          className="flex w-full flex-col px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <span className="text-sm font-bold text-primary">{p.EmployeeName}</span>
                          <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {p.Department} {p.Department && "•"} {p.Position}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Section>

        <Section title="For Maintenance Technician">
          <div className="space-y-4">
            <div>
              <span className={labelClass}>Service Findings</span>
              <textarea
                rows={4}
                className={cn(fieldClass, "resize-y")}
                value={form.service_findings}
                onChange={(e) => setForm((s) => ({ ...s, service_findings: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
              <div className="flex min-w-0 flex-col gap-4 h-full">
                <span className={labelClass}>Corrective Action</span>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.corrective_reconditioned}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, corrective_reconditioned: e.target.checked }))
                    }
                    className="rounded border-gray-300"
                  />
                  Reconditioned / Repaired
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.corrective_parts_replaced}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, corrective_parts_replaced: e.target.checked }))
                    }
                    className="rounded border-gray-300"
                  />
                  Parts replaced
                </label>
                <div className="flex flex-1 flex-col">
                  <span className={labelClass}>Others, write a short summary</span>
                  <textarea
                    className={cn(fieldClass, "flex-1 resize-none")}
                    value={form.corrective_others}
                    onChange={(e) => setForm((s) => ({ ...s, corrective_others: e.target.value }))}
                  />
                </div>
              </div>
              <div className="min-w-0">
                <span className={labelClass}>Part(s) Needed</span>
                <div className="mb-2 flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={addPartNeeded}
                    className="flex size-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    title="Add part"
                  >
                    <Plus className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={removePartNeeded}
                    className="flex size-7 items-center justify-center rounded-md border border-red-100 bg-white text-red-600 shadow-sm transition-colors hover:bg-red-50 dark:border-red-900/30 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    title="Remove last part"
                  >
                    <Minus className="size-4" />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {partsNeeded.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 shrink-0 text-xs text-gray-500">{idx + 1}.</span>
                      <input
                        className={fieldClass}
                        value={val}
                        onChange={(e) => {
                          const next = [...partsNeeded];
                          next[idx] = e.target.value;
                          setPartsNeeded(next);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-4">
                <div>
                  <span className={labelClass}>Final Assessment</span>
                  <div className="mt-2 flex flex-col gap-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.final_repairable}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, final_repairable: e.target.checked }))
                        }
                        className="rounded border-gray-300"
                      />
                      Repairable
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.final_usable_parts_extraction}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            final_usable_parts_extraction: e.target.checked,
                          }))
                        }
                        className="rounded border-gray-300"
                      />
                      Usable parts extraction
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.final_disposal}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, final_disposal: e.target.checked }))
                        }
                        className="rounded border-gray-300"
                      />
                      Disposal
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.final_unit_replacement}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, final_unit_replacement: e.target.checked }))
                        }
                        className="rounded border-gray-300"
                      />
                      Unit replacement
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <div>
                    <span className={labelClass}>PR No.</span>
                    <input
                      className={fieldClass}
                      value={form.pr_no}
                      onChange={(e) => setForm((s) => ({ ...s, pr_no: e.target.value }))}
                    />
                  </div>
                  <div>
                    <span className={labelClass}>PR date</span>
                    <input
                      type="date"
                      className={fieldClass}
                      value={form.pr_date}
                      onChange={(e) => setForm((s) => ({ ...s, pr_date: e.target.value }))}
                    />
                  </div>
                  <div className="relative">
                    <span className={labelClass}>Requested by</span>
                    <input
                      className={fieldClass}
                      value={form.requested_by}
                      onChange={(e) => searchPersonnel(e.target.value, "requested_by")}
                      onFocus={() => setActivePersonnelField("requested_by")}
                      onBlur={() => setTimeout(() => setActivePersonnelField(null), 200)}
                      autoComplete="off"
                    />
                    {activePersonnelField === "requested_by" && personnelSuggestions.length > 0 && (
                      <div className="absolute left-0 top-[calc(100%+4px)] z-[110] w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                        <div className="max-h-60 overflow-y-auto">
                          {personnelSuggestions.map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handlePersonnelSelect(p.EmployeeName, "requested_by")}
                              className="flex w-full flex-col px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                              <span className="text-sm font-bold text-primary">{p.EmployeeName}</span>
                              <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                                {p.Department} {p.Department && "•"} {p.Position}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="relative">
                <span className={labelClass}>Technician</span>
                <input
                  className={fieldClass}
                  value={form.prepared_by}
                  onChange={(e) => searchPersonnel(e.target.value, "prepared_by")}
                  onFocus={() => setActivePersonnelField("prepared_by")}
                  onBlur={() => setTimeout(() => setActivePersonnelField(null), 200)}
                  autoComplete="off"
                />
                {activePersonnelField === "prepared_by" && personnelSuggestions.length > 0 && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-[110] w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="max-h-60 overflow-y-auto">
                      {personnelSuggestions.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePersonnelSelect(p.EmployeeName, "prepared_by")}
                          className="flex w-full flex-col px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <span className="text-sm font-bold text-primary">{p.EmployeeName}</span>
                          <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {p.Department} {p.Department && "•"} {p.Position}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <span className={labelClass}>Maintenance Foreman</span>
                <input
                  className={fieldClass}
                  value={form.inspected_by}
                  onChange={(e) => searchPersonnel(e.target.value, "inspected_by")}
                  onFocus={() => setActivePersonnelField("inspected_by")}
                  onBlur={() => setTimeout(() => setActivePersonnelField(null), 200)}
                  autoComplete="off"
                />
                {activePersonnelField === "inspected_by" && personnelSuggestions.length > 0 && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-[110] w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="max-h-60 overflow-y-auto">
                      {personnelSuggestions.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePersonnelSelect(p.EmployeeName, "inspected_by")}
                          className="flex w-full flex-col px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <span className="text-sm font-bold text-primary">{p.EmployeeName}</span>
                          <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {p.Department} {p.Department && "•"} {p.Position}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <span className={labelClass}>Maintenance Supervisor</span>
                <input
                  className={fieldClass}
                  value={form.approved_by}
                  onChange={(e) => searchPersonnel(e.target.value, "approved_by")}
                  onFocus={() => setActivePersonnelField("approved_by")}
                  onBlur={() => setTimeout(() => setActivePersonnelField(null), 200)}
                  autoComplete="off"
                />
                {activePersonnelField === "approved_by" && personnelSuggestions.length > 0 && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-[110] w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="max-h-60 overflow-y-auto">
                      {personnelSuggestions.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePersonnelSelect(p.EmployeeName, "approved_by")}
                          className="flex w-full flex-col px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <span className="text-sm font-bold text-primary">{p.EmployeeName}</span>
                          <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {p.Department} {p.Department && "•"} {p.Position}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Section>

                </fieldset>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/90 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/80 md:gap-3 md:px-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormModalOpen(false);
                    setViewOnly(false);
                  }}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  {viewOnly ? "Close" : "Cancel"}
                </button>

                {!viewOnly && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {editId ? "Save Changes" : "Save Request"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deletingRow && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setDeletingRow(null)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="size-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Delete request?
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                This will permanently delete{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {deletingRow.form_no || `ID ${deletingRow.id}`}
                </span>
                .
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingRow(null)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-70"
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
