import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  Truck,
  Send,
  Search,
  Building,
  DollarSign,
  Calendar,
  Layers,
  ShieldCheck,
  Package,
  QrCode,
  X,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { approvalsAPI } from '../api';

export default function PurchaseOrders({ onNavigateToTab }) {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [previewPo, setPreviewPo] = useState(null);
  const [downloadingPo, setDownloadingPo] = useState(null);
  const [updatingPo, setUpdatingPo] = useState(null);

  const fetchPOs = async () => {
    try {
      setLoading(true);
      const data = await approvalsAPI.getAllPOs();
      setPos(data);
    } catch (err) {
      console.error('Failed to load POs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  const handleDownloadPDF = async (poNumber) => {
    setDownloadingPo(poNumber);
    try {
      await approvalsAPI.downloadPDF(poNumber);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      // Fallback direct link
      window.open(approvalsAPI.getDownloadUrl(poNumber), '_blank');
    } finally {
      setDownloadingPo(null);
    }
  };

  const handleStatusTransition = async (poNumber, newStatus) => {
    setUpdatingPo(poNumber);
    try {
      await approvalsAPI.updatePOStatus(poNumber, newStatus);
      fetchPOs();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingPo(null);
    }
  };

  const filteredPOs = pos.filter((po) => {
    const matchesSearch =
      po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Acknowledged':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'Sent':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <FileText className="w-3.5 h-3.5" /> NetSuite PO Register &amp; Lifecycle
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Purchase Orders &amp; 3-Way Match
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Track authorized PO lifecycle (Sent $\to$ In Transit $\to$ Delivered) and download ReportLab ERP documentation.
          </p>
        </div>

        <button
          onClick={() => onNavigateToTab('new_pr')}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer self-start md:self-auto"
        >
          Create New PR <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Issued POs</span>
          <div className="text-2xl font-bold text-white">{pos.length}</div>
        </div>
        <div className="glass-card rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Authorized Amount</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            ${pos.reduce((acc, p) => acc + p.total_amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">In Transit (Acknowledged)</span>
          <div className="text-2xl font-bold text-blue-400">
            {pos.filter((p) => p.status === 'Acknowledged').length}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">3-Way Match Verified</span>
          <div className="text-2xl font-bold text-cyan-400">
            {pos.filter((p) => p.status === 'Delivered').length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by PO# or Supplier name..."
            className="w-full bg-slate-900 border border-slate-750 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs w-full sm:w-auto overflow-x-auto">
          {['All', 'Sent', 'Acknowledged', 'Delivered'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* PO Register Table */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700/80 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                <th className="py-3 px-3.5">PO Number</th>
                <th className="py-3 px-3.5">Vendor / Supplier</th>
                <th className="py-3 px-3.5">Total Amount</th>
                <th className="py-3 px-3.5">Issue Date</th>
                <th className="py-3 px-3.5">Lifecycle Status</th>
                <th className="py-3 px-3.5 text-center">Lifecycle Advancement</th>
                <th className="py-3 px-3.5 text-right">PDF Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No purchase orders found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* PO Number */}
                    <td className="py-3.5 px-3.5 font-mono font-bold text-blue-400">
                      {po.po_number}
                    </td>

                    {/* Vendor */}
                    <td className="py-3.5 px-3.5">
                      <div className="font-semibold text-white">{po.vendor?.name || 'Primary Vendor'}</div>
                      <div className="text-[10px] text-slate-400">{po.vendor?.pricing_tier}</div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-3.5 font-mono font-bold text-white text-sm">
                      ${po.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Issue Date */}
                    <td className="py-3.5 px-3.5 text-slate-300">
                      {new Date(po.created_at).toLocaleDateString()}
                    </td>

                    {/* Lifecycle Status */}
                    <td className="py-3.5 px-3.5">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${getStatusBadge(po.status)}`}>
                        {po.status === 'Sent' && 'Sent to Vendor'}
                        {po.status === 'Acknowledged' && 'In Transit'}
                        {po.status === 'Delivered' && '3-Way Match Verified'}
                      </span>
                    </td>

                    {/* Status Transition Controls */}
                    <td className="py-3.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {po.status === 'Sent' && (
                          <button
                            type="button"
                            disabled={updatingPo === po.po_number}
                            onClick={() => handleStatusTransition(po.po_number, 'Acknowledged')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Truck className="w-3 h-3" />
                            Mark In-Transit
                          </button>
                        )}

                        {po.status === 'Acknowledged' && (
                          <button
                            type="button"
                            disabled={updatingPo === po.po_number}
                            onClick={() => handleStatusTransition(po.po_number, 'Delivered')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Verify 3-Way Match
                          </button>
                        )}

                        {po.status === 'Delivered' && (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> 3-Way Match Closed
                          </span>
                        )}
                      </div>
                    </td>

                    {/* PDF Actions */}
                    <td className="py-3.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewPo(po)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Preview Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={downloadingPo === po.po_number}
                          onClick={() => handleDownloadPDF(po.po_number)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Document Preview Modal */}
      {previewPo && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 md:p-8 max-w-2xl w-full space-y-6 border-slate-700 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  NetSuite ERP Purchase Order Document
                </h3>
                <span className="font-mono text-xs text-blue-400 font-bold">{previewPo.po_number}</span>
              </div>
              <button
                onClick={() => setPreviewPo(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Body */}
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-5 text-xs text-slate-300">
              {/* Document Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xl font-extrabold text-white">
                    ProcureIQ <span className="text-blue-400">ERP</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">NetSuite Autonomous Procurement Engine</p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-white text-base">{previewPo.po_number}</div>
                  <div className="text-slate-400 text-[11px]">Issue Date: {new Date(previewPo.created_at).toLocaleDateString()}</div>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(previewPo.status)}`}>
                      {previewPo.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vendor & Ship-To Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-1">
                  <div className="font-bold text-slate-200 uppercase text-[10px]">Vendor / Supplier</div>
                  <div className="font-bold text-white text-sm">{previewPo.vendor?.name}</div>
                  <div>Tier: {previewPo.vendor?.pricing_tier}</div>
                  <div>Email: {previewPo.vendor?.contact_email}</div>
                  <div>Phone: {previewPo.vendor?.phone}</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-1">
                  <div className="font-bold text-slate-200 uppercase text-[10px]">Ship-To / Department</div>
                  <div className="font-bold text-white text-sm">ProcureIQ Global Facilities</div>
                  <div>Delivery SLA: {previewPo.vendor?.avg_delivery_days} Business Days</div>
                  <div>Status: 3-Way Match Verification Active</div>
                </div>
              </div>

              {/* Amount Box */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">Total Purchase Order Value</div>
                  <div className="text-xs text-slate-300">Commercial terms Net-30</div>
                </div>
                <div className="text-xl font-mono font-extrabold text-emerald-400">
                  ${previewPo.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Barcode & Compliance */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800">
                <span>Certified under NetSuite Automated Procurement Protocol</span>
                <span className="font-mono">{previewPo.po_number} // VERIFIED</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreviewPo(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPDF(previewPo.po_number)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download ReportLab PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
