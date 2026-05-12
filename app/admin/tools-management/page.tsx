"use client";
import { toast } from "react-toastify";

import { useState, useEffect, useMemo, useRef } from "react";
import { FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, Package, Search, Pencil, Trash2, X, Save, Wrench, BarChart3, RefreshCw, Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "tools" | "inventory";

type ToolItem = {
  ID: number;
  PartNumber: string;
  PartDescription: string;
  Unit: string;
  Brand: string;
  OEM: string;
  TType: string;
  ExtraDescription: string;
  Onhand: number;
};

type InventoryItem = {
  id: number;
  ControlNumber: string;
  PartNumber: string;
  PartDescription: string;
};

export default function ToolsManagementPage() {
  const [items, setItems] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("tools");
  const [hasScrollbar, setHasScrollbar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Edit modal state
  const [editingItem, setEditingItem] = useState<ToolItem | null>(null);
  const [editForm, setEditForm] = useState<Partial<ToolItem>>({});
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deletingItem, setDeletingItem] = useState<ToolItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add Stock confirmation state
  const [addingStockItem, setAddingStockItem] = useState<ToolItem | null>(null);
  const [addingStock, setAddingStock] = useState(false);

  // Edit confirmation state
  const [confirmEditPrompt, setConfirmEditPrompt] = useState(false);

  // Actions menu state
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  // Inventory tab state
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [invSearch, setInvSearch] = useState("");
  const [invPage, setInvPage] = useState(1);
  const [invHasScrollbar, setInvHasScrollbar] = useState(false);
  const invScrollRef = useRef<HTMLDivElement>(null);

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/admin/items");
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    setInvLoading(true);
    try {
      const response = await fetch("/api/admin/inventory");
      if (response.ok) {
        const data = await response.json();
        setInventoryItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setInvLoading(false);
    }
  };

  const handleGenerateInventory = async () => {
    setGenerating(true);
    
    try {
      const response = await fetch("/api/admin/inventory", { method: "POST" });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        fetchInventory();
      } else {
        toast.error(data.error || "Failed to generate inventory.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchInventory();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.action-menu-btn') && !target.closest('.action-menu-dropdown')) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check if scrollbar is present for alignment
  useEffect(() => {
    const checkScrollbar = () => {
      if (scrollRef.current) {
        setHasScrollbar(scrollRef.current.scrollHeight > scrollRef.current.clientHeight);
      }
    };

    checkScrollbar();
    window.addEventListener("resize", checkScrollbar);
    return () => window.removeEventListener("resize", checkScrollbar);
  }, [items, currentPage, searchQuery, loading]);

  // Check scrollbar for inventory tab
  useEffect(() => {
    const checkInvScrollbar = () => {
      if (invScrollRef.current) {
        setInvHasScrollbar(invScrollRef.current.scrollHeight > invScrollRef.current.clientHeight);
      }
    };
    checkInvScrollbar();
    window.addEventListener("resize", checkInvScrollbar);
    return () => window.removeEventListener("resize", checkInvScrollbar);
  }, [inventoryItems, invPage, invSearch, activeTab]);

  // Filter logic
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter((item) => 
      item.PartNumber?.toLowerCase().includes(query) ||
      item.PartDescription?.toLowerCase().includes(query) ||
      item.Brand?.toLowerCase().includes(query) ||
      item.OEM?.toLowerCase().includes(query) ||
      item.Unit?.toLowerCase().includes(query) ||
      item.TType?.toLowerCase().includes(query) ||
      item.ExtraDescription?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Pagination logic based on filtered items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Inventory filter + pagination
  const filteredInvItems = useMemo(() => {
    if (!invSearch.trim()) return inventoryItems;
    const q = invSearch.toLowerCase();
    return inventoryItems.filter((inv) =>
      inv.ControlNumber?.toLowerCase().includes(q) ||
      inv.PartNumber?.toLowerCase().includes(q) ||
      inv.PartDescription?.toLowerCase().includes(q)
    );
  }, [inventoryItems, invSearch]);

  const invIndexOfLast = invPage * itemsPerPage;
  const invIndexOfFirst = invIndexOfLast - itemsPerPage;
  const currentInvItems = filteredInvItems.slice(invIndexOfFirst, invIndexOfLast);
  const invTotalPages = Math.ceil(filteredInvItems.length / itemsPerPage);

  useEffect(() => {
    setInvPage(1);
  }, [invSearch]);

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
      const response = await fetch("/api/admin/items/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Successfully imported ${data.count} items.`);
        setCurrentPage(1); // Reset to first page
        fetchItems(); // Refresh the list
      } else {
        toast.error(data.error || "Failed to import items.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred during upload.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // --- Edit handlers ---
  const openEditModal = (item: ToolItem) => {
    setEditingItem(item);
    setEditForm({ ...item });
  };

  const closeEditModal = () => {
    setEditingItem(null);
    setEditForm({});
    setSaving(false);
    setConfirmEditPrompt(false);
  };

  const confirmEditSave = async () => {
    if (!editingItem) return;
    setSaving(true);
    
    setConfirmEditPrompt(false);

    try {
      const response = await fetch(`/api/admin/items/${editingItem.ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Item #${editingItem.ID} updated successfully.`);
        closeEditModal();
        fetchItems();
      } else {
        toast.error(data.error || "Failed to update item.");
        setSaving(false);
      }
    } catch {
      toast.error("An unexpected error occurred.");
      setSaving(false);
    }
  };

  // --- Add Stock Handlers ---
  const handleAddStockConfirm = async () => {
    if (!addingStockItem) return;
    setAddingStock(true);
    
    try {
      const response = await fetch("/api/admin/inventory/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ PartNumber: addingStockItem.PartNumber, PartDescription: addingStockItem.PartDescription }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        fetchItems();
        fetchInventory();
        setAddingStockItem(null);
      } else {
        toast.error(data.error || "Failed to add stock.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setAddingStock(false);
    }
  };

  const openDeleteConfirm = (item: ToolItem) => {
    setDeletingItem(item);
  };

  const closeDeleteConfirm = () => {
    setDeletingItem(null);
    setDeleting(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    

    try {
      const response = await fetch(`/api/admin/items/${deletingItem.ID}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Item #${deletingItem.ID} deleted successfully.`);
        closeDeleteConfirm();
        fetchItems();
      } else {
        toast.error(data.error || "Failed to delete item.");
        setDeleting(false);
      }
    } catch {
      toast.error("An unexpected error occurred.");
      setDeleting(false);
    }
  };

  const colWidths = {
    id: "w-[4%]",
    part: "w-[13%]",
    desc: "w-[24%]",
    brand: "w-[9%]",
    oem: "w-[9%]",
    unit: "w-[6%]",
    type: "w-[9%]",
    extra: "w-[10%]",
    stock: "w-[8%]",
    actions: "w-[8%]",
  };

  // Inventory computed data
  const inventoryStats = useMemo(() => {
    const totalItems = items.length;
    const totalStock = items.reduce((sum, i) => sum + (i.Onhand || 0), 0);
    const lowStock = items.filter((i) => i.Onhand > 0 && i.Onhand <= 5);
    const outOfStock = items.filter((i) => i.Onhand <= 0);
    const inStock = items.filter((i) => i.Onhand > 5);
    const brands = [...new Set(items.map((i) => i.Brand).filter(Boolean))];
    return { totalItems, totalStock, lowStock, outOfStock, inStock, brands };
  }, [items]);

  return (
    <div className="flex flex-col h-[calc(100vh-128px)] space-y-4 max-w-full overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0 px-1">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Tools Management</h2>
          <p className="hidden text-xs text-muted-foreground sm:block">Manage and track your tool inventory.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === "tools" ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 sm:w-64"
                />
              </div>

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
            </>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 sm:w-64"
                />
              </div>
              <button
                onClick={handleGenerateInventory}
                disabled={generating}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90",
                  generating && "pointer-events-none opacity-70"
                )}
              >
                {generating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                <span className="whitespace-nowrap">{generating ? "Generating..." : "Generate Inventory"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex shrink-0 gap-1 border-b border-gray-200 px-1 dark:border-gray-800">
        {([
          { key: "tools" as TabKey, label: "Tools", icon: Wrench },
          { key: "inventory" as TabKey, label: "Inventory", icon: BarChart3 },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
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

      

      {(activeTab === "tools" ? loading : invLoading) ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : activeTab === "tools" ? (
        <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/50 min-h-0">
          {filteredItems.length > 0 ? (
            <>
              {/* Separate Header Table - Dynamic padding based on scrollbar presence */}
              <div className={cn(
                "shrink-0 overflow-x-hidden border-b border-gray-200 dark:border-gray-800 bg-blue-50/95 dark:bg-blue-900 transition-[padding]",
                hasScrollbar ? "pr-[16px]" : "pr-0"
              )}>
                <table className="w-full border-collapse text-left text-sm table-fixed">
                  <thead>
                    <tr className="text-blue-900 dark:text-blue-200 whitespace-nowrap">
                      <th className={cn("border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800", colWidths.id)}>ID</th>
                      <th className={cn("border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800", colWidths.part)}>Part Number</th>
                      <th className={cn("border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800", colWidths.desc)}>Description</th>
                      <th className={cn("border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800", colWidths.brand)}>Brand</th>
                      <th className={cn("border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800", colWidths.oem)}>OEM</th>
                      <th className={cn("border-r border-gray-200 px-4 py-1.5 font-semibold text-center dark:border-gray-800", colWidths.unit)}>Unit</th>
                      <th className={cn("border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800", colWidths.type)}>Type</th>
                      <th className={cn("border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800", colWidths.extra)}>Extra Info</th>
                      <th className={cn("border-r border-gray-200 px-4 py-1.5 font-semibold text-center dark:border-gray-800", colWidths.stock)}>Stock</th>
                      <th className={cn("px-4 py-1.5 font-semibold text-center", colWidths.actions)}>Actions</th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Scrollable Body Table */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-transparent border-b border-gray-200 dark:border-gray-800"
              >
                <table className="w-full border-collapse text-left text-sm table-fixed">
                  <tbody>
                    {currentItems.map((item, index) => (
                      <tr key={item.ID} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30 whitespace-nowrap group">
                        <td className={cn("border-b border-r border-gray-100 px-4 py-1 text-gray-500 dark:border-gray-800 dark:text-gray-400 group-last:border-b-0", colWidths.id)}>
                          {item.ID}
                        </td>
                        <td className={cn("border-b border-r border-gray-100 px-4 py-1 font-medium text-gray-900 dark:border-gray-800 dark:text-white group-last:border-b-0", colWidths.part)}>
                          {item.PartNumber}
                        </td>
                        <td className={cn("border-b border-r border-gray-100 px-4 py-1 text-gray-900 dark:border-gray-800 dark:text-white truncate group-last:border-b-0", colWidths.desc)} title={item.PartDescription}>
                          {item.PartDescription}
                        </td>
                        <td className={cn("border-b border-r border-gray-100 px-4 py-1 dark:border-gray-800 group-last:border-b-0", colWidths.brand)}>
                          {item.Brand}
                        </td>
                        <td className={cn("border-b border-r border-gray-100 px-4 py-1 dark:border-gray-800 group-last:border-b-0", colWidths.oem)}>
                          {item.OEM}
                        </td>
                        <td className={cn("border-b border-r border-gray-100 px-4 py-1 text-center dark:border-gray-800 group-last:border-b-0", colWidths.unit)}>
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            {item.Unit}
                          </span>
                        </td>
                        <td className={cn("border-b border-r border-gray-100 px-4 py-1 dark:border-gray-800 group-last:border-b-0", colWidths.type)}>
                          {item.TType}
                        </td>
                        <td className={cn("border-b border-r border-gray-100 px-4 py-1 text-gray-500 dark:border-gray-800 dark:text-gray-400 truncate group-last:border-b-0", colWidths.extra)} title={item.ExtraDescription}>
                          {item.ExtraDescription || "-"}
                        </td>
                        <td className={cn("border-b border-r border-gray-100 px-4 py-1 text-center dark:border-gray-800 group-last:border-b-0", colWidths.stock)}>
                          <span className={cn(
                            "font-bold text-sm",
                            item.Onhand <= 5 ? "text-red-500" : "text-green-500"
                          )}>
                            {item.Onhand}
                          </span>
                        </td>
                        <td className={cn("border-b border-gray-100 px-2 py-1 text-center dark:border-gray-800 group-last:border-b-0", colWidths.actions)}>
                          <div className="relative inline-block text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(openActionMenuId === item.ID ? null : item.ID);
                              }}
                              className="action-menu-btn inline-flex size-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                              title="Actions"
                            >
                              <MoreHorizontal className="size-4" />
                            </button>
                            {openActionMenuId === item.ID && (
                              <div className={cn(
                                "action-menu-dropdown absolute right-0 z-50 w-36 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800",
                                currentItems.length > 5 && index >= currentItems.length - 3 ? "bottom-full mb-1" : "top-full mt-1"
                              )}>
                                <div className="flex flex-col py-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionMenuId(null);
                                      setAddingStockItem(item);
                                    }}
                                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-green-50 hover:text-green-600 dark:text-gray-300 dark:hover:bg-green-900/30 dark:hover:text-green-400 text-left"
                                  >
                                    <Plus className="size-3.5 shrink-0" />
                                    <span>Add Stock</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionMenuId(null);
                                      openEditModal(item);
                                    }}
                                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 text-left"
                                  >
                                    <Pencil className="size-3.5 shrink-0" />
                                    <span>Edit Item</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionMenuId(null);
                                      openDeleteConfirm(item);
                                    }}
                                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-400 text-left"
                                  >
                                    <Trash2 className="size-3.5 shrink-0" />
                                    <span>Delete Item</span>
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

              {/* Footer Section */}
              <div className="flex flex-col gap-4 border-t border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 shrink-0 md:flex-row md:items-center md:justify-between z-10">
                <div className="text-center text-xs text-gray-500 md:text-left">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredItems.length)}</span> of <span className="font-medium">{filteredItems.length}</span> {searchQuery && "matching"} items
                </div>
                
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
                  >
                    Prev
                  </button>
                  
                  <div className="hidden items-center gap-1 sm:flex">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5 && currentPage > 3) {
                        pageNum = currentPage - 3 + i;
                        if (pageNum + 5 > totalPages) pageNum = totalPages - 4 + i;
                      }
                      if (pageNum <= 0 || pageNum > totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={cn(
                            "min-w-[28px] rounded-lg px-2 py-1 text-xs font-medium transition-all",
                            currentPage === pageNum
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center text-xs font-medium sm:hidden">
                    Page {currentPage} of {totalPages}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800/50">
                {searchQuery ? <Search className="size-6 text-gray-400" /> : <Package className="size-6 text-gray-400" />}
              </div>
              <h3 className="mt-4 text-base font-semibold">
                {searchQuery ? "No matches found" : "No tools found"}
              </h3>
              <p className="mt-2 text-xs text-gray-500">
                {searchQuery 
                  ? `We couldn't find anything matching "${searchQuery}".`
                  : "Your inventory is currently empty. Start by importing an Excel file."}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ── Inventory Tab ── */
        <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/50 min-h-0">
          {inventoryItems.length > 0 ? (
            <>
              {/* Header */}
              <div className={cn(
                "shrink-0 overflow-x-hidden border-b border-gray-200 dark:border-gray-800 bg-indigo-50/95 dark:bg-indigo-900 transition-[padding]",
                invHasScrollbar ? "pr-[16px]" : "pr-0"
              )}>
                <table className="w-full border-collapse text-left text-sm table-fixed">
                  <thead>
                    <tr className="text-indigo-900 dark:text-indigo-200 whitespace-nowrap">
                      <th className="border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800 w-[8%]">ID</th>
                      <th className="border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800 w-[30%]">Control Number</th>
                      <th className="border-r border-gray-200 px-4 py-1.5 font-semibold dark:border-gray-800 w-[22%]">Part Number</th>
                      <th className="px-4 py-1.5 font-semibold w-[40%]">Description</th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Scrollable Body */}
              <div
                ref={invScrollRef}
                className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-transparent border-b border-gray-200 dark:border-gray-800"
              >
                <table className="w-full border-collapse text-left text-sm table-fixed">
                  <tbody>
                    {currentInvItems.map((inv) => (
                      <tr key={inv.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30 whitespace-nowrap group">
                        <td className="border-b border-r border-gray-100 px-4 py-1 text-gray-500 dark:border-gray-800 dark:text-gray-400 group-last:border-b-0 w-[8%]">{inv.id}</td>
                        <td className="border-b border-r border-gray-100 px-4 py-1 font-mono font-medium text-gray-900 dark:border-gray-800 dark:text-white group-last:border-b-0 w-[30%]">{inv.ControlNumber}</td>
                        <td className="border-b border-r border-gray-100 px-4 py-1 text-gray-700 dark:border-gray-800 dark:text-gray-300 group-last:border-b-0 w-[22%]">{inv.PartNumber}</td>
                        <td className="border-b border-gray-100 px-4 py-1 text-gray-700 dark:border-gray-800 dark:text-gray-300 truncate group-last:border-b-0 w-[40%]" title={inv.PartDescription}>{inv.PartDescription}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="flex flex-col gap-4 border-t border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 shrink-0 md:flex-row md:items-center md:justify-between z-10">
                <div className="text-center text-xs text-gray-500 md:text-left">
                  Showing <span className="font-medium">{invIndexOfFirst + 1}</span> to <span className="font-medium">{Math.min(invIndexOfLast, filteredInvItems.length)}</span> of <span className="font-medium">{filteredInvItems.length}</span> {invSearch && "matching"} items
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setInvPage(invPage - 1)}
                    disabled={invPage === 1}
                    className="flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
                  >
                    Prev
                  </button>
                  <div className="hidden items-center gap-1 sm:flex">
                    {Array.from({ length: Math.min(5, invTotalPages) }, (_, i) => {
                      let p = i + 1;
                      if (invTotalPages > 5 && invPage > 3) {
                        p = invPage - 3 + i;
                        if (p + 5 > invTotalPages) p = invTotalPages - 4 + i;
                      }
                      if (p <= 0 || p > invTotalPages) return null;
                      return (
                        <button key={p} onClick={() => setInvPage(p)} className={cn("min-w-[28px] rounded-lg px-2 py-1 text-xs font-medium transition-all", invPage === p ? "bg-primary text-primary-foreground shadow-sm" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800")}>{p}</button>
                      );
                    })}
                  </div>
                  <div className="flex items-center text-xs font-medium sm:hidden">Page {invPage} of {invTotalPages}</div>
                  <button
                    onClick={() => setInvPage(invPage + 1)}
                    disabled={invPage === invTotalPages}
                    className="flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800/50">
                <Package className="size-6 text-gray-400" />
              </div>
              <h3 className="mt-4 text-base font-semibold">No inventory generated</h3>
              <p className="mt-2 text-xs text-gray-500 max-w-sm">
                Click &quot;Generate Inventory&quot; above to create individual stock entries from your tools.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={closeEditModal}>
          <div
            className="relative mx-4 w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closeEditModal} className="absolute right-4 top-4 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
              <X className="size-5" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Tool</h3>
            <p className="mt-1 text-xs text-gray-500">Editing item #{editingItem.ID}</p>

            <div className="mt-5 grid grid-cols-2 gap-4">
              {([
                { key: "PartNumber", label: "Part Number", required: true },
                { key: "Brand", label: "Brand" },
                { key: "PartDescription", label: "Description", required: true, full: true },
                { key: "OEM", label: "OEM" },
                { key: "Unit", label: "Unit" },
                { key: "TType", label: "Type" },
                { key: "Onhand", label: "On Hand", type: "number" },
                { key: "ExtraDescription", label: "Extra Info", full: true },
              ] as { key: keyof ToolItem; label: string; required?: boolean; full?: boolean; type?: string }[]).map((field) => (
                <div key={field.key} className={field.full ? "col-span-2" : ""}>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={field.type || "text"}
                    value={editForm[field.key] ?? ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value,
                      }))
                    }
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeEditModal}
                className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => setConfirmEditPrompt(true)}
                disabled={saving}
                className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Edit Modal ── */}
      {confirmEditPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setConfirmEditPrompt(false)}>
          <div
            className="relative mx-4 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <AlertCircle className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Save Changes</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to save changes to <span className="font-medium text-gray-700 dark:text-gray-300">{editForm.PartNumber}</span>?
              </p>
            </div>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setConfirmEditPrompt(false)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmEditSave}
                className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Stock Confirmation Modal ── */}
      {addingStockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setAddingStockItem(null)}>
          <div
            className="relative mx-4 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Plus className="size-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Add Stock</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to add 1 unit of stock to <span className="font-medium text-gray-700 dark:text-gray-300">{addingStockItem.PartNumber}</span>? This will generate a new inventory record.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setAddingStockItem(null)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStockConfirm}
                disabled={addingStock}
                className="flex h-9 items-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-70"
              >
                {addingStock ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                {addingStock ? "Adding..." : "Confirm Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={closeDeleteConfirm}>
          <div
            className="relative mx-4 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="size-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Delete Tool</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete <span className="font-medium text-gray-700 dark:text-gray-300">{deletingItem.PartNumber}</span>? This action cannot be undone.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={closeDeleteConfirm}
                className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-70"
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
