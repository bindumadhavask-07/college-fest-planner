/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useFest } from '../context/FestContext';
import { BudgetItem } from '../types';
import { formatINR, formatCompactINR } from '../utils/formatters';
import {
  IndianRupee,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  PieChart as PieIcon,
  CheckCircle,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface BudgetModalProps {
  item: Partial<BudgetItem> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<BudgetItem, 'id'> & { id?: string }) => Promise<void>;
}

const BudgetModal: React.FC<BudgetModalProps> = ({ item, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<BudgetItem>>({
    title: '',
    category: 'Tech Infrastructure',
    allocatedAmount: 15000,
    spentAmount: 0,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        title: '',
        category: 'Tech Infrastructure',
        allocatedAmount: 15000,
        spentAmount: 0,
        notes: ''
      });
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;
    setIsSubmitting(true);
    try {
      await onSave({
        festId: '',
        title: formData.title.trim(),
        category: formData.category || 'Tech Infrastructure',
        allocatedAmount: Number(formData.allocatedAmount) || 0,
        spentAmount: Number(formData.spentAmount) || 0,
        notes: formData.notes?.trim() || '',
        ownerId: '',
        id: item?.id
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#101524] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <IndianRupee className="w-4 h-4 text-emerald-400" />
            <span>{item?.id ? 'Edit Budget Line Item' : 'New Budget Line Item'}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Line Item Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Hackathon Cloud Servers, Audio Rig Rental"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Budget Category
            </label>
            <select
              value={formData.category || 'Tech Infrastructure'}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="Tech Infrastructure">Tech Infrastructure & Software</option>
              <option value="Prize Pool">Prize Pool & Cash Awards</option>
              <option value="Celebrity & Artists">Celebrity & Guest Honorariums</option>
              <option value="Stage & AV Production">Stage & AV Production</option>
              <option value="Logistics & Hospitality">Logistics, Food & Travel</option>
              <option value="Marketing & PR">Marketing, Badges & Merch</option>
              <option value="Contingency & Emergency Buffer">Contingency Reserve</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Allocated (₹) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={formData.allocatedAmount ?? 0}
                onChange={e => setFormData({ ...formData, allocatedAmount: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Spent (₹)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={formData.spentAmount ?? 0}
                onChange={e => setFormData({ ...formData, spentAmount: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Vendor / Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Vendor details, quote references, payment milestone notes..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Budget Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const BudgetPlanner: React.FC = () => {
  const { activeFest, budgetItems, events, saveBudgetItem, deleteBudgetItem } = useFest();
  const [selectedItem, setSelectedItem] = useState<BudgetItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalSanctioned = activeFest.totalBudget || 150000;
  const totalAllocated = budgetItems.reduce((acc, b) => acc + (b.allocatedAmount || 0), 0);
  const totalSpent = budgetItems.reduce((acc, b) => acc + (b.spentAmount || 0), 0);
  const remainingTotal = totalSanctioned - totalSpent;
  const isOverBudget = totalSpent > totalSanctioned;

  // Chart data
  const chartData = useMemo(() => {
    return budgetItems.map(item => ({
      name: item.title.length > 15 ? item.title.slice(0, 13) + '...' : item.title,
      Allocated: item.allocatedAmount,
      Spent: item.spentAmount
    }));
  }, [budgetItems]);

  const handleEdit = (item: BudgetItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: BudgetItem) => {
    if (window.confirm(`Delete budget item "${item.title}"?`)) {
      await deleteBudgetItem(item.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-[#101524]">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            <span>Budget Planner & Financial Burn Rate</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track sanctioned college allocations, prize pools, stage production, and vendor disbursement.
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Line Item</span>
        </button>
      </div>

      {/* Over-Budget Alert Banner */}
      {isOverBudget && (
        <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-200 flex items-center space-x-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <div>
            <span className="font-bold">Over-Budget Warning: </span>
            <span>
              Total spending ({formatINR(totalSpent)}) has exceeded sanctioned fest allocation ({formatINR(totalSanctioned)}) by {formatINR(totalSpent - totalSanctioned)}. Reduce allocations or seek supplementary sponsorships.
            </span>
          </div>
        </div>
      )}

      {/* Financial Health Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-[#101524]/90 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Total Sanctioned</span>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {formatINR(totalSanctioned)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Approved by College Finance Dean
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-[#101524]/90 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Actual Spent</span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400">
            {formatINR(totalSpent)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex justify-between">
            <span>{Math.round((totalSpent / totalSanctioned) * 100)}% utilized</span>
            <span>Allocated: {formatINR(totalAllocated)}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-[#101524]/90 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Remaining Liquidity</span>
          <div className={`mt-2 text-2xl font-extrabold ${remainingTotal < 0 ? 'text-rose-400' : 'text-cyan-400'}`}>
            {formatINR(remainingTotal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {remainingTotal < 0 ? 'Deficit - Emergency action required' : 'Available for contingency reserve'}
          </p>
        </div>
      </div>

      {/* Visual Chart Comparison */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-[#101524]/90 shadow-xl">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">Line Item Comparison: Allocated vs Spent</h3>
          <p className="text-xs text-slate-400 mt-0.5">Identify departmental overruns in real-time</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                tickFormatter={(val) => `₹${val / 1000}k`}
              />
              <Tooltip
                formatter={(val: any) => [formatINR(Number(val)), 'Amount']}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="Allocated" fill="#6366F1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Spent" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Granular Line Items Table */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-[#101524]/90 shadow-xl">
        <h3 className="text-sm font-semibold text-white mb-4">Granular Line Item Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">Title & Category</th>
                <th className="pb-3 font-semibold">Allocated</th>
                <th className="pb-3 font-semibold">Spent</th>
                <th className="pb-3 font-semibold">Variance</th>
                <th className="pb-3 font-semibold">Vendor / Notes</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {budgetItems.map((item) => {
                const variance = item.allocatedAmount - item.spentAmount;
                const isItemOver = variance < 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3">
                      <span className="font-semibold text-white block">{item.title}</span>
                      <span className="text-[10px] text-slate-400">{item.category}</span>
                    </td>
                    <td className="py-3 font-medium text-slate-300">
                      {formatINR(item.allocatedAmount)}
                    </td>
                    <td className="py-3 font-medium text-emerald-400">
                      {formatINR(item.spentAmount)}
                    </td>
                    <td className="py-3 font-medium">
                      <span className={isItemOver ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {formatINR(variance)}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 max-w-xs truncate">
                      {item.notes || '—'}
                    </td>
                    <td className="py-3 text-right space-x-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1 text-slate-400 hover:text-white rounded"
                        title="Edit"
                        aria-label="Edit budget item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded"
                        title="Delete"
                        aria-label="Delete budget item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <BudgetModal
        isOpen={isModalOpen}
        item={selectedItem}
        onClose={() => setIsModalOpen(false)}
        onSave={saveBudgetItem}
      />
    </div>
  );
};
