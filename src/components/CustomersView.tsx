import React from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  MessageSquare,
  FileSpreadsheet, 
  Sparkles
} from "lucide-react";
import { Customer, Loan } from "../types";

interface CustomersViewProps {
  customers: Customer[];
  loans: Loan[];
  onAddCustomer: (name: string) => Promise<boolean>;
  onEditCustomer: (id: string, name: string) => Promise<boolean>;
  onDeleteCustomer: (id: string, permanent: boolean) => Promise<boolean>;
  onBulkDelete: (ids: string[], permanent: boolean) => Promise<number>;
  userEmail: string;
}

export default function CustomersView({
  customers,
  loans,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onBulkDelete,
  userEmail
}: CustomersViewProps) {
  // States
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
  
  // Form fields
  const [name, setName] = React.useState("");
  
  // Expandable details state
  const [expandedCustomerId, setExpandedCustomerId] = React.useState<string | null>(null);

  // Filter lists
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Bulk selector handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCustomers.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  // CSV Exporter client-side
  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) return;
    
    // Header
    const headers = ["ID", "Name", "Registration Date"];
    const rows = filteredCustomers.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customer_records_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Add form
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    const ok = await onAddCustomer(name);
    if (ok) {
      setName("");
      setShowAddModal(false);
    }
  };

  // Submit Edit form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !name) return;

    const ok = await onEditCustomer(editingCustomer.id, name);
    if (ok) {
      setEditingCustomer(null);
      setShowEditModal(false);
    }
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setShowEditModal(true);
  };

  const openAddModal = () => {
    setName("");
    setShowAddModal(true);
  };

  // Hard Delete vs Soft Delete toggle action
  const handleDeleteTrigger = async (id: string, name: string) => {
    const isPermanent = window.confirm(`Move "${name}" to the Trash Bin? You can restore this record anytime from the Settings -> Trash Bin.`);
    if (isPermanent) {
      await onDeleteCustomer(id, false);
    }
  };

  // Bulk Delete Trigger
  const handleBulkDeleteTrigger = async () => {
    if (selectedIds.length === 0) return;
    const isPermanent = window.confirm(`Are you sure you want to move ${selectedIds.length} selected customers to the Trash Bin?`);
    if (isPermanent) {
      const deletedCount = await onBulkDelete(selectedIds, false);
      alert(`Successfully moved ${deletedCount} customers to Trash Bin.`);
      setSelectedIds([]);
    }
  };

  // Get active and historic loans for expanded customer
  const getLoansForCustomer = (custId: string) => {
    return loans.filter(l => l.customerId === custId && !l.isDeleted);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Search and Commands header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Customers</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Manage your customer database and view their loan history.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            disabled={filteredCustomers.length === 0}
            className="px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 border cursor-pointer hover:bg-slate-50 transition-colors border-slate-200 bg-white text-slate-700"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Toolbar Filter Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search Searchbar */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none transition-all bg-white border-slate-200 text-slate-900 focus:border-emerald-500 focus:shadow-sm"
          />
        </div>

        {/* Bulk Action indicator */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-semibold text-slate-500">
              {selectedIds.length} Selected:
            </span>
            <button
              onClick={handleBulkDeleteTrigger}
              className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/15 border border-red-500/30 text-red-500 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Trash Selected</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Customers List */}
      <div className="border rounded-2xl overflow-hidden shadow-sm bg-white border-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs uppercase font-mono tracking-wider border-b bg-slate-50 border-slate-200 text-slate-500">
                <th className="py-4 px-5 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredCustomers.length > 0 && selectedIds.length === filteredCustomers.length}
                    onChange={handleSelectAll}
                    className="rounded cursor-pointer accent-emerald-500"
                  />
                </th>
                <th className="py-4 px-4 font-semibold">Customer Name</th>
                <th className="py-4 px-4 font-semibold text-center">Active Dues</th>
                <th className="py-4 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs text-slate-400 font-mono">
                    No active customers match description search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const cLoans = getLoansForCustomer(cust.id);
                  const activeCount = cLoans.filter(l => l.status !== "closed").length;
                  const totalOutstanding = cLoans.reduce((acc, current) => acc + current.balance, 0);
                  const isExpanded = expandedCustomerId === cust.id;

                  return (
                    <React.Fragment key={cust.id}>
                      <tr className={`text-xs transition-colors hover:bg-slate-50/40 ${
                        isExpanded ? "bg-emerald-500/[0.01]" : ""
                      }`}>
                        <td className="py-4 px-5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(cust.id)}
                            onChange={(e) => handleSelectOne(cust.id, e.target.checked)}
                            className="rounded cursor-pointer accent-emerald-500"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold text-sm">
                              {cust.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <button
                                onClick={() => setExpandedCustomerId(isExpanded ? null : cust.id)}
                                className="font-bold text-[13px] hover:text-emerald-500 text-left hover:underline block text-slate-700"
                              >
                                {cust.name}
                              </button>
                              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                Ref: #{cust.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="inline-block text-center">
                            <span className={`px-2 py-0.5 font-bold rounded-full font-mono text-[10px] ${
                              activeCount > 0 
                                ? "bg-orange-500/10 text-orange-500" 
                                : "bg-slate-100 text-slate-400"
                            }`}>
                              {activeCount} Active Dues
                            </span>
                            {activeCount > 0 && (
                              <p className="text-[11px] font-bold font-mono text-emerald-500 mt-1">
                                ₹{totalOutstanding} Outstanding
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(cust)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4 text-slate-500" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteTrigger(cust.id, cust.name)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable History Drawer Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={4} className="px-8 py-5 border-b text-xs bg-slate-50/50">
                            <div className="space-y-4 animate-fade-in">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-[13px] text-emerald-500 flex items-center gap-1.5">
                                  <Sparkles className="w-4.5 h-4.5" />
                                  Borrower's History: {cust.name}
                                </h4>
                                <span className="font-mono text-[10px] text-slate-400">Total Loans Granted: {cLoans.length}</span>
                              </div>

                              {cLoans.length === 0 ? (
                                <div className="p-3 text-slate-400 font-mono text-[11px]">
                                  This client does not have any recorded loan disbursements.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {cLoans.map((loan) => (
                                    <div
                                      key={loan.id}
                                      className="p-4 rounded-xl border flex flex-col justify-between bg-white border-slate-200"
                                    >
                                      <div>
                                        <div className="flex justify-between items-center mb-2">
                                          <span className="font-mono font-bold text-[10px] uppercase bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded">
                                            {loan.type.replace(/_/g, " ")}
                                          </span>
                                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] font-mono uppercase ${
                                            loan.status === "active" 
                                              ? "bg-blue-500/10 text-blue-500" 
                                              : loan.status === "closed"
                                                ? "bg-slate-500/10 text-slate-400"
                                                : "bg-red-500/10 text-red-500"
                                          }`}>
                                            {loan.status}
                                          </span>
                                        </div>

                                        <p className="text-sm font-extrabold font-mono text-slate-800 mt-1">
                                          ₹{loan.amount} Principal
                                        </p>
                                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                          Rate: {loan.interestRate}% | Int: ₹{loan.totalProfit.toFixed(0)}
                                        </p>
                                      </div>

                                      <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center text-[11px] font-mono">
                                        <span className="text-slate-400">Balance:</span>
                                        <span className="font-bold text-emerald-500">₹{loan.balance}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl border shadow-xl bg-white border-slate-200 text-slate-900">
            <h3 className="text-lg font-bold">Register New Customer</h3>
            
            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 block font-mono">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="Arun Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 bg-slate-50 border-slate-200"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
                >
                  Confirm Addition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl border shadow-xl bg-white border-slate-200 text-slate-900">
            <h3 className="text-lg font-bold">Edit Customer details</h3>
            <p className="text-xs text-slate-400 mt-1">Ref: {editingCustomer.id}</p>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 block font-mono">Customer Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-emerald-500 bg-slate-50 border-slate-200"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
