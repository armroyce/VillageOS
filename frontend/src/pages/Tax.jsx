import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import PermissionGate from '../components/PermissionGate';
import toast from 'react-hot-toast';

const today = new Date().toISOString().split('T')[0];

function AssignTaxForm({ onDone }) {
  const { t } = useTranslation();
  const [families, setFamilies] = useState([]);
  const [wards, setWards] = useState([]);
  const [form, setForm] = useState({
    description: '', type: 'house_tax', amount: '', due_date: today,
    selection: 'all', ward_numbers: [], family_ids: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/families?limit=500').then((res) => {
      const data = res.data.data || [];
      setFamilies(data);
      const uniqueWards = [...new Set(data.map((f) => f.ward_number).filter(Boolean))].sort();
      setWards(uniqueWards);
    });
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function toggleWard(ward) {
    setForm((prev) => ({
      ...prev,
      ward_numbers: prev.ward_numbers.includes(ward)
        ? prev.ward_numbers.filter((w) => w !== ward)
        : [...prev.ward_numbers, ward],
    }));
  }

  function toggleFamily(id) {
    setForm((prev) => ({
      ...prev,
      family_ids: prev.family_ids.includes(id)
        ? prev.family_ids.filter((f) => f !== id)
        : [...prev.family_ids, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.description || !form.amount) { toast.error('Description and amount required'); return; }
    setSaving(true);
    try {
      const payload = {
        type: form.type, amount: form.amount,
        description: form.description, due_date: form.due_date,
        select_all: form.selection === 'all',
        ward_numbers: form.selection === 'ward' ? form.ward_numbers : [],
        family_ids: form.selection === 'family' ? form.family_ids : [],
      };
      const res = await api.post('/tax/assign', payload);
      toast.success(`Assigned to ${res.data.data.assigned} families`);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error');
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Description / Label</label>
          <input className="input" placeholder="e.g. House Tax 2026" value={form.description} onChange={set('description')} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('amount')} (₹)</label>
          <input type="number" className="input" placeholder="Amount" value={form.amount} onChange={set('amount')} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('type')}</label>
          <select className="input" value={form.type} onChange={set('type')}>
            <option value="house_tax">{t('house_tax')}</option>
            <option value="festival">{t('festival')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input type="date" className="input" value={form.due_date} onChange={set('due_date')} />
        </div>
      </div>

      {/* Selection mode */}
      <div>
        <label className="block text-sm font-medium mb-2">Apply To</label>
        <div className="flex gap-3">
          {[['all', 'All Families'], ['ward', 'Select Ward(s)'], ['family', 'Select Specific Families']].map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="selection" value={val} checked={form.selection === val} onChange={set('selection')} />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Ward selection */}
      {form.selection === 'ward' && (
        <div>
          <label className="block text-sm font-medium mb-2">Select Wards</label>
          {wards.length === 0 ? <p className="text-slate-400 text-sm">No wards found</p> : (
            <div className="flex flex-wrap gap-2">
              {wards.map((w) => (
                <button key={w} type="button"
                  onClick={() => toggleWard(w)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${form.ward_numbers.includes(w) ? 'bg-primary text-white border-primary' : 'border-slate-300 text-slate-600'}`}>
                  Ward {w}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Family selection */}
      {form.selection === 'family' && (
        <div>
          <label className="block text-sm font-medium mb-2">Select Families ({form.family_ids.length} selected)</label>
          <div className="max-h-48 overflow-y-auto border rounded-lg divide-y text-sm">
            {families.map((f) => (
              <label key={f.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={form.family_ids.includes(f.id)} onChange={() => toggleFamily(f.id)} />
                <span className="flex-1">{f.family_head_name}</span>
                <span className="text-slate-400">Ward {f.ward_number || '—'}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Assigning...' : 'Assign Tax'}</button>
        <button type="button" className="btn-secondary" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}

function AssignmentStatusModal({ assignment, onClose }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/tax/assignments/${encodeURIComponent(assignment.description)}/status`)
      .then((res) => { setRows(res.data.data || []); setLoading(false); });
  }, [assignment.description]);

  const paid = rows.filter((r) => r.status === 'paid');
  const pending = rows.filter((r) => r.status === 'pending');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-lg">{assignment.description}</h2>
            <p className="text-sm text-slate-500">{t(assignment.type)} · ₹{parseFloat(assignment.amount).toFixed(0)} per family</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>
        <div className="flex gap-4 px-5 py-3 bg-slate-50 border-b text-sm">
          <span className="text-green-600 font-semibold">✓ Paid: {paid.length}</span>
          <span className="text-red-500 font-semibold">✗ Pending: {pending.length}</span>
          <span className="text-slate-500">Total: {rows.length}</span>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? <p className="p-4 text-slate-400">{t('loading')}</p> : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Family</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Ward</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Phone</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={`border-b ${r.status === 'pending' ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-2">{r.family?.family_head_name || '—'}</td>
                    <td className="px-4 py-2 text-slate-500">{r.family?.ward_number || '—'}</td>
                    <td className="px-4 py-2 text-slate-500">{r.family?.phone_number || '—'}</td>
                    <td className="px-4 py-2">
                      {r.status === 'paid'
                        ? <span className="badge-green">Paid</span>
                        : <span className="badge-red">Pending</span>}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-400">{r.receipt_number || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Tax() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [summary, setSummary] = useState([]);
  const [dues, setDues] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState('records');
  const [loading, setLoading] = useState(true);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState(null);

  async function load(page = 1) {
    setLoading(true);
    try {
      const [taxRes, sumRes, duesRes, assignRes] = await Promise.all([
        api.get('/tax', { params: { page } }),
        api.get('/tax/summary'),
        api.get('/tax/dues'),
        api.get('/tax/assignments'),
      ]);
      setData(taxRes.data.data);
      setPagination(taxRes.data.pagination || { page: 1, pages: 1 });
      setSummary(sumRes.data.data);
      setDues(duesRes.data.data);
      setAssignments(assignRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const columns = [
    { key: 'family', label: 'Family', render: (r) => r.family?.family_head_name || '—' },
    { key: 'description', label: 'Description', render: (r) => r.description || '—' },
    { key: 'type', label: t('type'), render: (r) => <span className={r.type === 'house_tax' ? 'badge-green' : 'badge-yellow'}>{t(r.type)}</span> },
    { key: 'amount', label: t('amount'), render: (r) => `₹${parseFloat(r.amount).toFixed(0)}` },
    { key: 'status', label: t('status'), render: (r) => r.status === 'paid' ? <span className="badge-green">Paid</span> : <span className="badge-red">Pending</span> },
    { key: 'collectedAt', label: t('date'), render: (r) => new Date(r.collectedAt || r.collected_at).toLocaleDateString() },
    { key: 'receipt_number', label: t('receipt'), render: (r) => r.receipt_number ? <Link to={`/tax/receipt/${r.id}`} className="text-primary text-xs hover:underline">{r.receipt_number}</Link> : '—' },
  ];

  const dueColumns = [
    { key: 'family_head_name', label: t('family_head') },
    { key: 'ward_number', label: t('ward') },
    { key: 'phone_number', label: 'Phone', render: (r) => r.phone_number || '—' },
    { key: 'address', label: t('address') },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('tax')}</h1>
        <PermissionGate permission="TAX_CREATE">
          <div className="flex gap-2">
            <button onClick={() => { setShowAssignForm(true); setActiveTab('assign'); }} className="btn-secondary text-sm">+ Assign Tax</button>
            <Link to="/tax/collect" className="btn-primary text-sm">+ {t('collect_tax')}</Link>
          </div>
        </PermissionGate>
      </div>

      {/* Summary cards */}
      <div className="flex gap-3 flex-wrap">
        {summary.map((s, i) => (
          <div key={i} className="card py-3 px-5 flex-1 min-w-[150px]">
            <p className="text-xs text-slate-500">{t(s.type)} / {t(s.status)}</p>
            <p className="text-xl font-bold text-primary">₹{parseFloat(s.total).toFixed(0)}</p>
            <p className="text-xs text-slate-400">{s.count} records</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          ['records', 'Records'],
          ['assignments', `Assignments (${assignments.length})`],
          ['dues', `${t('dues')} (${dues.length})`],
        ].map(([tab, label]) => (
          <button key={tab} onClick={() => { setActiveTab(tab); setShowAssignForm(false); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Assign Tax Form */}
      {showAssignForm && (
        <div className="card">
          <h2 className="font-semibold mb-4">Assign Tax to Families</h2>
          <AssignTaxForm onDone={() => { setShowAssignForm(false); setActiveTab('assignments'); load(); }} />
        </div>
      )}

      {/* Tab content */}
      {!showAssignForm && (
        <div className="card">
          {loading ? <p className="text-slate-400 text-sm">{t('loading')}</p> : (
            <>
              {activeTab === 'records' && (
                <>
                  <Table columns={columns} data={data} />
                  <Pagination page={pagination.page} pages={pagination.pages} onPageChange={load} />
                </>
              )}
              {activeTab === 'assignments' && (
                assignments.length === 0 ? (
                  <p className="text-slate-400 text-sm py-4 text-center">No tax assignments yet. Click "Assign Tax" to create one.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b">
                      <th className="text-left py-2 font-medium text-slate-600">Description</th>
                      <th className="text-left py-2 font-medium text-slate-600">Type</th>
                      <th className="text-left py-2 font-medium text-slate-600">Amount</th>
                      <th className="text-left py-2 font-medium text-slate-600">Total</th>
                      <th className="text-left py-2 font-medium text-slate-600">Paid</th>
                      <th className="text-left py-2 font-medium text-slate-600">Pending</th>
                      <th />
                    </tr></thead>
                    <tbody>
                      {assignments.map((a, i) => (
                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 font-medium">{a.description}</td>
                          <td className="py-2"><span className={a.type === 'house_tax' ? 'badge-green' : 'badge-yellow'}>{t(a.type)}</span></td>
                          <td className="py-2">₹{parseFloat(a.amount).toFixed(0)}</td>
                          <td className="py-2">{a.total}</td>
                          <td className="py-2 text-green-600 font-semibold">{a.paid_count}</td>
                          <td className="py-2 text-red-500 font-semibold">{a.pending_count}</td>
                          <td className="py-2">
                            <button onClick={() => setViewingAssignment(a)} className="text-primary text-xs hover:underline">View Status →</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
              {activeTab === 'dues' && <Table columns={dueColumns} data={dues} />}
            </>
          )}
        </div>
      )}

      {/* Assignment status modal */}
      {viewingAssignment && (
        <AssignmentStatusModal assignment={viewingAssignment} onClose={() => setViewingAssignment(null)} />
      )}
    </div>
  );
}
