"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { 
  FileSpreadsheet, 
  Loader2, 
  Users, 
  Search, 
  Upload, 
  Filter,
  ArrowUpDown,
  UserPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Building2,
  X,
  Save,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

type PersonnelItem = {
  ID: number;
  EmployeeCode: string;
  EmployeeName: string;
  Department: string;
  Position: string;
};

type DepartmentItem = {
  ID: number;
  DepartmentName: string;
};

type TabKey = "list" | "departments";

export default function PersonnelManagementPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("list");
  
  // Personnel state
  const [items, setItems] = useState<PersonnelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Department state
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [deptSearch, setDeptSearch] = useState("");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PersonnelItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<PersonnelItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    EmployeeCode: "",
    EmployeeName: "",
    Department: "",
    Position: ""
  });

  // Actions menu state
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  // Scroll and layout state
  const [hasScrollbar, setHasScrollbar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const colWidths = {
    id: "w-[8%]",
    code: "w-[15%]",
    name: "w-[32%]",
    dept: "w-[20%]",
    pos: "w-[20%]",
    actions: "w-[5%]"
  };

  const deptColWidths = {
    id: "w-[10%]",
    name: "w-[80%]",
    actions: "w-[10%]"
  };

  const fetchPersonnel = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/personnel");
      const data = await response.json();
      if (response.ok) {
        setItems(data);
      } else {
        toast.error(data.error || "Failed to fetch personnel.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    setLoadingDepts(true);
    try {
      const response = await fetch("/api/admin/departments");
      const data = await response.json();
      if (response.ok) {
        setDepartments(data);
      } else {
        toast.error(data.error || "Failed to fetch departments.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoadingDepts(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
    fetchDepartments();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".action-menu-btn") && !target.closest(".action-menu-dropdown")) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const checkScrollbar = () => {
      if (scrollRef.current) {
        const hasVScroll = scrollRef.current.scrollHeight > scrollRef.current.clientHeight;
        setHasScrollbar(hasVScroll);
      }
    };

    const observer = new ResizeObserver(checkScrollbar);
    if (scrollRef.current) observer.observe(scrollRef.current);
    checkScrollbar();

    return () => observer.disconnect();
  }, [items, departments, loading, loadingDepts, activeTab]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/personnel/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Successfully imported ${data.count} personnel records.`);
        setCurrentPage(1);
        fetchPersonnel();
      } else {
        toast.error(data.error || "Failed to import personnel.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred during upload.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  const handleAddEmployee = async () => {
    if (!formData.EmployeeCode || !formData.EmployeeName) {
      toast.error("Employee Code and Name are required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        setIsAddModalOpen(false);
        setFormData({ EmployeeCode: "", EmployeeName: "", Department: "", Position: "" });
        fetchPersonnel();
      } else {
        toast.error(data.error || "Failed to add employee");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!editingItem) return;
    if (!formData.EmployeeCode || !formData.EmployeeName) {
      toast.error("Employee Code and Name are required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/personnel/${editingItem.ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        setEditingItem(null);
        fetchPersonnel();
      } else {
        toast.error(data.error || "Failed to update employee");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deletingItem) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/personnel/${deletingItem.ID}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        setDeletingItem(null);
        fetchPersonnel();
      } else {
        toast.error(data.error || "Failed to delete record");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (item: PersonnelItem) => {
    setEditingItem(item);
    setFormData({
      EmployeeCode: item.EmployeeCode,
      EmployeeName: item.EmployeeName,
      Department: item.Department || "",
      Position: item.Position || ""
    });
    setOpenActionMenuId(null);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.EmployeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.EmployeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.Department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.Position.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const filteredDepts = useMemo(() => {
    return departments.filter((d) =>
      d.DepartmentName.toLowerCase().includes(deptSearch.toLowerCase())
    );
  }, [departments, deptSearch]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="flex flex-col h-[calc(100vh-128px)] space-y-4 max-w-full overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0 px-1">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Personnel Management</h2>
          <p className="hidden text-xs text-muted-foreground sm:block">Manage employee records and organizational structure.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === "list" ? "Search personnel..." : "Search departments..."}
              value={activeTab === "list" ? searchQuery : deptSearch}
              onChange={(e) => {
                if (activeTab === "list") {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                } else {
                  setDeptSearch(e.target.value);
                }
              }}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 sm:w-64"
            />
          </div>

          {activeTab === "list" ? (
            <>
              <label
                className={cn(
                  "flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  uploading && "pointer-events-none opacity-70"
                )}
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="size-4" />
                )}
                <span className="whitespace-nowrap">{uploading ? "Importing..." : "Import Excel"}</span>
                <input
                  type="file"
                  className="sr-only"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>

              <button 
                onClick={() => {
                  setFormData({ EmployeeCode: "", EmployeeName: "", Department: "", Position: "" });
                  setIsAddModalOpen(true);
                }}
                className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
              >
                <UserPlus className="size-4" />
                <span className="whitespace-nowrap">Add Employee</span>
              </button>
            </>
          ) : (
            <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90">
              <Building2 className="size-4" />
              <span className="whitespace-nowrap">Add Department</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex shrink-0 gap-1 border-b border-gray-200 px-1 dark:border-gray-800">
        {[
          { key: "list" as TabKey, label: "Employee List", icon: Users },
          { key: "departments" as TabKey, label: "Departments", icon: Building2 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setOpenActionMenuId(null);
            }}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors -mb-px",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {(activeTab === "list" ? loading : loadingDepts) ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/50 min-h-0">
          {activeTab === "list" ? (
            filteredItems.length > 0 ? (
              <>
                <div className={cn(
                  "shrink-0 overflow-x-hidden border-b border-gray-200 dark:border-gray-800 bg-blue-50/95 dark:bg-blue-900 transition-[padding]",
                  hasScrollbar ? "pr-[16px]" : "pr-0"
                )}>
                  <table className="w-full border-collapse text-left text-sm table-fixed">
                    <thead>
                      <tr className="text-blue-900 dark:text-blue-200 whitespace-nowrap">
                        <th className={cn("border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800", colWidths.id)}>ID</th>
                        <th className={cn("border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800", colWidths.code)}>Code</th>
                        <th className={cn("border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800", colWidths.name)}>Name</th>
                        <th className={cn("border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800", colWidths.dept)}>Department</th>
                        <th className={cn("border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800", colWidths.pos)}>Position</th>
                        <th className={cn("px-4 py-1.5 font-semibold text-center", colWidths.actions)}>Actions</th>
                      </tr>
                    </thead>
                  </table>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-transparent border-b border-gray-200 dark:border-gray-800">
                  <table className="w-full border-collapse text-left text-sm table-fixed">
                    <tbody>
                      {currentItems.map((person, index) => (
                        <tr key={person.ID} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30 whitespace-nowrap group">
                          <td className={cn("border-b border-r border-gray-100 px-4 py-1 text-gray-500 dark:border-gray-800 dark:text-gray-400 group-last:border-b-0", colWidths.id)}>{person.ID}</td>
                          <td className={cn("border-b border-r border-gray-100 px-4 py-1 font-mono text-xs font-semibold text-gray-900 dark:border-gray-800 dark:text-gray-200 group-last:border-b-0 uppercase tracking-wider", colWidths.code)}>{person.EmployeeCode}</td>
                          <td className={cn("border-b border-r border-gray-100 px-4 py-1 font-medium text-gray-900 dark:border-gray-800 dark:text-white group-last:border-b-0 truncate", colWidths.name)} title={person.EmployeeName}>{person.EmployeeName}</td>
                          <td className={cn("border-b border-r border-gray-100 px-4 py-1 dark:border-gray-800 group-last:border-b-0", colWidths.dept)}>
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400">
                              {person.Department || "N/A"}
                            </span>
                          </td>
                          <td className={cn("border-b border-r border-gray-100 px-4 py-1 text-gray-600 dark:border-gray-800 dark:text-gray-300 group-last:border-b-0 truncate", colWidths.pos)} title={person.Position}>{person.Position || "N/A"}</td>
                          <td className={cn("border-b border-gray-100 px-2 py-1 text-center dark:border-gray-800 group-last:border-b-0", colWidths.actions)}>
                            <div className="relative inline-block text-left">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenuId(openActionMenuId === person.ID ? null : person.ID);
                                }}
                                className="action-menu-btn inline-flex size-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                              >
                                <MoreHorizontal className="size-4" />
                              </button>
                              {openActionMenuId === person.ID && (
                                <div className={cn(
                                  "action-menu-dropdown absolute right-0 z-50 w-36 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800",
                                  currentItems.length > 5 && index >= currentItems.length - 3 ? "bottom-full mb-1" : "top-full mt-1"
                                )}>
                                  <div className="flex flex-col py-1">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); openEditModal(person); }}
                                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 text-left"
                                    >
                                      <Pencil className="size-3.5 shrink-0" />
                                      <span>Edit Employee</span>
                                    </button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setDeletingItem(person); setOpenActionMenuId(null); }}
                                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-400 text-left"
                                    >
                                      <Trash2 className="size-3.5 shrink-0" />
                                      <span>Delete Record</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-4 border-t border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 shrink-0 md:flex-row md:items-center md:justify-between z-10">
                  <div className="text-center text-xs text-gray-500 md:text-left">
                    Showing <span className="font-medium text-gray-700 dark:text-gray-300">{indexOfFirstItem + 1}</span> to <span className="font-medium text-gray-700 dark:text-gray-300">{Math.min(indexOfLastItem, filteredItems.length)}</span> of <span className="font-medium text-gray-700 dark:text-gray-300">{filteredItems.length}</span> records
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-300">Prev</button>
                    <div className="hidden items-center gap-1 sm:flex">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5 && currentPage > 3) {
                          pageNum = currentPage - 2 + i;
                          if (pageNum + 4 > totalPages) pageNum = totalPages - 4 + i;
                        }
                        if (pageNum <= 0 || pageNum > totalPages) return null;
                        return (
                          <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={cn("min-w-[28px] rounded-lg px-2 py-1 text-xs font-medium transition-all", currentPage === pageNum ? "bg-primary text-primary-foreground shadow-sm" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800")}>{pageNum}</button>
                        );
                      })}
                    </div>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-300">Next</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <Users className="size-12 text-gray-300 mb-4" />
                <h3 className="mt-4 text-base font-semibold">No personnel found</h3>
              </div>
            )
          ) : (
            /* ── Department Tab ── */
            filteredDepts.length > 0 ? (
              <>
                <div className={cn(
                  "shrink-0 overflow-x-hidden border-b border-gray-200 dark:border-gray-800 bg-indigo-50/95 dark:bg-indigo-900 transition-[padding]",
                  hasScrollbar ? "pr-[16px]" : "pr-0"
                )}>
                  <table className="w-full border-collapse text-left text-sm table-fixed">
                    <thead>
                      <tr className="text-indigo-900 dark:text-indigo-200 whitespace-nowrap">
                        <th className={cn("border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800", deptColWidths.id)}>ID</th>
                        <th className={cn("border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800", deptColWidths.name)}>Department Name</th>
                        <th className={cn("px-4 py-1.5 font-semibold text-center", deptColWidths.actions)}>Actions</th>
                      </tr>
                    </thead>
                  </table>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-transparent border-b border-gray-200 dark:border-gray-800">
                  <table className="w-full border-collapse text-left text-sm table-fixed">
                    <tbody>
                      {filteredDepts.map((dept) => (
                        <tr key={dept.ID} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30 whitespace-nowrap group">
                          <td className={cn("border-b border-r border-gray-100 px-4 py-1 text-gray-500 dark:border-gray-800 dark:text-gray-400 group-last:border-b-0", deptColWidths.id)}>{dept.ID}</td>
                          <td className={cn("border-b border-r border-gray-100 px-4 py-1 font-medium text-gray-900 dark:border-gray-800 dark:text-white group-last:border-b-0", deptColWidths.name)}>{dept.DepartmentName}</td>
                          <td className={cn("border-b border-gray-100 px-2 py-1 text-center dark:border-gray-800 group-last:border-b-0", deptColWidths.actions)}>
                            <div className="relative inline-block text-left">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenuId(openActionMenuId === dept.ID ? null : dept.ID);
                                }}
                                className="action-menu-btn inline-flex size-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                              >
                                <MoreHorizontal className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <Building2 className="size-12 text-gray-300 mb-4" />
                <h3 className="mt-4 text-base font-semibold">No departments found</h3>
              </div>
            )
          )}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Add / Edit Employee Modal */}
      {(isAddModalOpen || editingItem) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl transition-all dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {editingItem ? <Pencil className="size-5 text-primary" /> : <UserPlus className="size-5 text-primary" />}
                {editingItem ? "Edit Employee" : "Add New Employee"}
              </h3>
              <button 
                onClick={() => { setIsAddModalOpen(false); setEditingItem(null); }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Employee Code</label>
                <input
                  type="text"
                  placeholder="EMP-XXXX"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none ring-primary/20 transition-all focus:border-primary focus:bg-white focus:ring-4 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  value={formData.EmployeeCode}
                  onChange={(e) => setFormData({ ...formData, EmployeeCode: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter employee name"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none ring-primary/20 transition-all focus:border-primary focus:bg-white focus:ring-4 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  value={formData.EmployeeName}
                  onChange={(e) => setFormData({ ...formData, EmployeeName: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Department</label>
                <select
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none ring-primary/20 transition-all focus:border-primary focus:bg-white focus:ring-4 dark:border-gray-800 dark:bg-gray-950 dark:text-white appearance-none"
                  value={formData.Department}
                  onChange={(e) => setFormData({ ...formData, Department: e.target.value })}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.ID} value={d.DepartmentName}>{d.DepartmentName}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Position</label>
                <input
                  type="text"
                  placeholder="e.g. Supervisor, Operator"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none ring-primary/20 transition-all focus:border-primary focus:bg-white focus:ring-4 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  value={formData.Position}
                  onChange={(e) => setFormData({ ...formData, Position: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
              <button 
                onClick={() => { setIsAddModalOpen(false); setEditingItem(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={editingItem ? handleUpdateEmployee : handleAddEmployee}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-primary/25 disabled:opacity-70"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {editingItem ? "Update Employee" : "Save Employee"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/20">
                <AlertCircle className="size-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">Confirm Deletion</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">{deletingItem.EmployeeName}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex border-t border-gray-100 dark:border-gray-800">
              <button 
                onClick={() => setDeletingItem(null)}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEmployee}
                disabled={saving}
                className="flex-1 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
