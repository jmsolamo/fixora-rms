"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
  tool_description: string | null;
  control_number: string | null;
  service_priority: string | null;
  requester_name: string | null;
  final_repairable: number;
  final_usable_parts_extraction: number;
  final_disposal: number;
  final_unit_replacement: number;
  created_at?: string;
};

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
      const res = await fetch("/api/admin/repair-request", {
        method: "POST",
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
      toast.success(data.message || "Saved.");
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const toggleFault = (id: string) => {
    setFaultChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fieldClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100";

  const labelClass = "mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400";

  return (
    <div className="flex max-w-full flex-col space-y-6 overflow-hidden pb-8">
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
              setIsFormModalOpen(true);
            }}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Create request
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Saved requests</h3>
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by no., part, description, priority…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/50">
                <tr>
                  <th className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">No.</th>
                  <th className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                  <th className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">Part #</th>
                  <th className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">Description</th>
                  <th className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">Control #</th>
                  <th className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">Priority</th>
                  <th className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">Requester</th>
                  <th className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">Assessment</th>
                </tr>
              </thead>
              <tbody>
                {loadingList ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-gray-500">
                      <Loader2 className="mx-auto size-6 animate-spin" />
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-gray-500">
                      {setupDone
                        ? "No repair requests yet. Click Create request to add one."
                        : "Could not load data. Use “Ensure table” if the database is new."}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-100 last:border-0 dark:border-gray-800/80"
                    >
                      <td className="px-3 py-2.5 text-gray-800 dark:text-gray-200">
                        {r.form_no || "—"}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-800 dark:text-gray-200">
                        {typeof r.form_date === "string"
                          ? r.form_date.slice(0, 10)
                          : r.form_date}
                      </td>
                      <td className="max-w-[120px] truncate px-3 py-2.5 text-gray-800 dark:text-gray-200">
                        {r.part_number || "—"}
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-2.5 text-gray-700 dark:text-gray-300">
                        {r.tool_description || "—"}
                      </td>
                      <td className="max-w-[120px] truncate px-3 py-2.5 text-gray-800 dark:text-gray-200">
                        {r.control_number || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-gray-800 dark:text-gray-200">
                        {formatPriority(r.service_priority)}
                      </td>
                      <td className="max-w-[140px] truncate px-3 py-2.5 text-gray-800 dark:text-gray-200">
                        {r.requester_name || "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2.5 text-gray-700 dark:text-gray-300">
                        {formatAssessment(r)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {filteredRows.length > itemsPerPage && (
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              Page {currentPage} of {totalPages} ({filteredRows.length} records)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 px-3 py-1 disabled:opacity-40 dark:border-gray-700"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-gray-200 px-3 py-1 disabled:opacity-40 dark:border-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {isFormModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setIsFormModalOpen(false)}
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
                New Request for Repair
              </h3>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
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
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
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

              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/90 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/80 md:gap-3 md:px-6">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
