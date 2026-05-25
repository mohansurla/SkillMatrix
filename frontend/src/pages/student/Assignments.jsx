import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { assignmentsAPI, modulesAPI } from '../../api';
import { LoadingSpinner, EmptyState, Badge, Pagination, ScoreCircle } from '../../components/UI';
import toast from 'react-hot-toast';

const statusVariant = { submitted: 'info', evaluated: 'success', pending: 'warning' };

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ module_id: '', title: '', description: '', file_url: '' });
  const [formErrors, setFormErrors] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await assignmentsAPI.getAll({ page, limit: 10, status: statusFilter || undefined });
      setAssignments(res.data.data.assignments);
      setPagination(res.data.data.pagination);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, statusFilter]); // eslint-disable-line

  useEffect(() => {
    modulesAPI.getAll({ limit: 100 }).then((r) => setModules(r.data.data.modules)).catch(() => {});
  }, []);

  const validate = () => {
    const e = {};
    if (!form.module_id) e.module_id = 'Please select a module';
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await assignmentsAPI.create({ ...form, module_id: Number(form.module_id) });
      toast.success('Assignment submitted successfully! 🎉');
      setShowForm(false);
      setForm({ module_id: '', title: '', description: '', file_url: '' });
      load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed';
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  return (
    <DashboardLayout title="My Assignments">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Assignments</h1>
          <p className="page-subtitle">Submit and track your module assignments</p>
        </div>
        <button className="btn btn-primary" id="new-assignment-btn" onClick={() => setShowForm(true)}>
          + New Submission
        </button>
      </div>

      {/* Submission Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Submit Assignment</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} noValidate>
              <div className="form-group">
                <label className="form-label">Module *</label>
                <select
                  className={`form-select ${formErrors.module_id ? 'error' : ''}`}
                  value={form.module_id}
                  onChange={(e) => setForm({ ...form, module_id: e.target.value })}
                  id="assignment-module"
                >
                  <option value="">Select a module</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>{m.title} — {m.skill_name}</option>
                  ))}
                </select>
                {formErrors.module_id && <span className="form-error">{formErrors.module_id}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Assignment Title *</label>
                <input
                  type="text"
                  className={`form-input ${formErrors.title ? 'error' : ''}`}
                  placeholder="e.g. JavaScript Closures Exercise"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  id="assignment-title"
                />
                {formErrors.title && <span className="form-error">{formErrors.title}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Description / Work Done *</label>
                <textarea
                  className={`form-textarea ${formErrors.description ? 'error' : ''}`}
                  placeholder="Describe what you implemented, learned, and any challenges..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  id="assignment-description"
                  rows={5}
                />
                {formErrors.description && <span className="form-error">{formErrors.description}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Submission URL (optional)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://github.com/your/repo"
                  value={form.file_url}
                  onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                  id="assignment-url"
                />
                <span className="form-hint">GitHub repo, Google Drive, or any URL</span>
              </div>

              <div className="flex gap-3 justify-between">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="submit-assignment-btn" disabled={submitting}>
                  {submitting ? <span className="spinner spinner-sm" /> : '📤'}
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <div className="tabs">
          {['', 'submitted', 'evaluated'].map((s) => (
            <button
              key={s}
              className={`tab-btn ${statusFilter === s ? 'active' : ''}`}
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="card">
        {loading ? <LoadingSpinner /> : assignments.length === 0 ? (
          <EmptyState icon="📝" title="No assignments found" description="Submit your first assignment using the button above" />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Module</th>
                  <th>Skill</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Feedback</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }} className="truncate" title={a.description}>
                        {a.description?.substring(0, 60)}{a.description?.length > 60 ? '...' : ''}
                      </div>
                    </td>
                    <td className="text-muted">{a.module_title}</td>
                    <td className="text-muted">{a.skill_name}</td>
                    <td><Badge variant={statusVariant[a.status]}>{a.status}</Badge></td>
                    <td>
                      {a.score != null ? <ScoreCircle score={a.score} max={a.max_score} /> : <span className="text-muted">—</span>}
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      {a.feedback ? (
                        <span style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }} title={a.feedback}>
                          {a.feedback.substring(0, 50)}{a.feedback.length > 50 ? '...' : ''}
                        </span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className="text-muted">{new Date(a.submitted_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pages={pagination.pages} onPageChange={setPage} />
      </div>
    </DashboardLayout>
  );
};

export default StudentAssignments;

