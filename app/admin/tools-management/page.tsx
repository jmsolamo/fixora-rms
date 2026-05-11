"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, Package, Search } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function ToolsManagementPage() {
  const [items, setItems] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasScrollbar, setHasScrollbar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

  useEffect(() => {
    fetchItems();
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setStatus({ type: "error", message: "Please upload a valid Excel file (.xlsx or .xls)" });
      return;
    }

    setUploading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/items/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: "success", message: `Successfully imported ${data.count} items.` });
        setCurrentPage(1); // Reset to first page
        fetchItems(); // Refresh the list
      } else {
        setStatus({ type: "error", message: data.error || "Failed to import items." });
      }
    } catch (error) {
      setStatus({ type: "error", message: "An unexpected error occurred during upload." });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const colWidths = {
    id: "w-[4%]",
    part: "w-[14%]",
    desc: "w-[28%]",
    brand: "w-[10%]",
    oem: "w-[10%]",
    unit: "w-[6%]",
    type: "w-[10%]",
    extra: "w-[12%]",
    onhand: "w-[6%]",
  };

  return (
    <div className="flex flex-col h-[calc(100vh-128px)] space-y-4 max-w-full overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0 px-1">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Tools Management</h2>
          <p className="hidden text-xs text-muted-foreground sm:block">Manage and track your tool inventory.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
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
        </div>
      </div>

      {status && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border p-3 text-sm shrink-0",
            status.type === "success" 
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400"
          )}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="size-5 shrink-0" />
          ) : (
            <AlertCircle className="size-5 shrink-0" />
          )}
          <p className="flex-1 leading-tight">{status.message}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
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
                      <th className={cn("border-r border-gray-200 px-4 py-2.5 font-semibold dark:border-gray-800", colWidths.id)}>ID</th>
                      <th className={cn("border-r border-gray-200 px-4 py-2.5 font-semibold dark:border-gray-800", colWidths.part)}>Part Number</th>
                      <th className={cn("border-r border-gray-200 px-4 py-2.5 font-semibold dark:border-gray-800", colWidths.desc)}>Description</th>
                      <th className={cn("border-r border-gray-200 px-4 py-2.5 font-semibold dark:border-gray-800", colWidths.brand)}>Brand</th>
                      <th className={cn("border-r border-gray-200 px-4 py-2.5 font-semibold dark:border-gray-800", colWidths.oem)}>OEM</th>
                      <th className={cn("border-r border-gray-200 px-4 py-2.5 font-semibold text-center dark:border-gray-800", colWidths.unit)}>Unit</th>
                      <th className={cn("border-r border-gray-200 px-4 py-2.5 font-semibold dark:border-gray-800", colWidths.type)}>Type</th>
                      <th className={cn("border-r border-gray-200 px-4 py-2.5 font-semibold dark:border-gray-800", colWidths.extra)}>Extra Info</th>
                      <th className={cn("px-4 py-2.5 font-semibold text-center", colWidths.onhand)}>On Hand</th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Scrollable Body Table - Vertical scrollbar only shows if needed */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-transparent border-b border-gray-200 dark:border-gray-800"
              >
                <table className="w-full border-collapse text-left text-sm table-fixed">
                  <tbody>
                    {currentItems.map((item) => (
                      <tr key={item.ID} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30 whitespace-nowrap group">
                        <td className={cn("border-b border-r border-gray-100 px-4 py-2 text-gray-500 dark:border-gray-800 dark:text-gray-400 group-last:border-b-0", colWidths.id)}>
                          {item.ID}
                        </td>
                        <td className={cn("border-b border-r border-gray-100 px-4 py-2 font-medium text-gray-900 dark:border-gray-800 dark:text-white group-last:border-b-0", colWidths.part)}>
                          {item.PartNumber}
                        </td>
                        <td className={cn("border-b border-r border-gray-100 px-4 py-2 text-gray-900 dark:border-gray-800 dark:text-white truncate group-last:border-b-0", colWidths.desc)} title={item.PartDescription}>
                          {item.PartDescription}
                        </td>
                        <td className={cn("border-b border-r border-gray-100 px-4 py-2 dark:border-gray-800 group-last:border-b-0", colWidths.brand)}>
                          {item.Brand}
                        </td>
                        <td className={cn("border-b border-r border-gray-100 px-4 py-2 dark:border-gray-800 group-last:border-b-0", colWidths.oem)}>
                          {item.OEM}
                        </td>
                        <td className={cn("border-b border-r border-gray-100 px-4 py-2 text-center dark:border-gray-800 group-last:border-b-0", colWidths.unit)}>
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            {item.Unit}
                          </span>
                        </td>
                        <td className={cn("border-b border-r border-gray-100 px-4 py-2 dark:border-gray-800 group-last:border-b-0", colWidths.type)}>
                          {item.TType}
                        </td>
                        <td className={cn("border-b border-r border-gray-100 px-4 py-2 text-gray-500 dark:border-gray-800 dark:text-gray-400 truncate group-last:border-b-0", colWidths.extra)} title={item.ExtraDescription}>
                          {item.ExtraDescription || "-"}
                        </td>
                        <td className={cn("border-b border-gray-100 px-4 py-2 text-center dark:border-gray-800 group-last:border-b-0", colWidths.onhand)}>
                          <span className={cn(
                            "font-bold",
                            item.Onhand <= 5 ? "text-red-500" : "text-green-500"
                          )}>
                            {item.Onhand}
                          </span>
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
      )}
    </div>
  );
}
