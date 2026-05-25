import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { skillsAPI } from '../../api';
import { LoadingSpinner, EmptyState, Badge, Pagination } from '../../components/UI';
import toast from 'react-hot-toast';

const CATEGORIES = ['Programming', 'Frontend', 'Backend', 'Database', 'Data', 'Design', 'DevOps', 'Other'];

const AdminSkills = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modal, setModal] = useState(null); // null | 'create' | skill object for edit
  const [form, setForm] = useState({ name: '', description: '', category: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await skillsAPI.getAll({ page, limit: 10 });
      setSkills(res.data.data.skills);
      setPagination(res.data.data.pagination);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]); // eslint-disable-line

  const openCreate = () => {
    setForm({ name: '', description: '', category: '' });
    setModal('create');
  };

  const openEdit = (skill) => {
    setForm({ name: skill.name, description: skill.description || '', category: skill.category || '' });
    setModal(skill);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        await skillsAPI.create(form);
        toast.success('Skill created!');
      } else {
        await skillsAPI.update(modal.id, form);
        toast.success('Skill updated!');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete skill "${name}"?`)) return;
    try {
      await skillsAPI.delete(id);
      toast.success('Skill deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <DashboardLayout title="Manage Skills">
      <div className="page-header">
        <div>
          <h1 className="page-title">Skills</h1>
          <p className="page-subtitle">Manage skill categories for the platform</p>
        </div>
        <button className="btn btn-primary" id="create-skill-btn" onClick={openCreate}>+ Add Skill</button>
      </div>

      {modal !== null && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{modal === 'create' ? 'Add New Skill' : 'Edit Skill'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Skill Name *</label>
                <input type="text" className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} id="skill-name" placeholder="e.g. Machine Learning" />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-select" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} id="skill-category">
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} id="skill-desc" placeholder="Brief description of this skill" />
              </div>
              <div className="flex gap-3 justify-between">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner spinner-sm" /> : '💾'} {modal === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? <LoadingSpinner /> : skills.length === 0 ? (
          <EmptyState icon="🎯" title="No skills yet" description="Create the first skill using the button above" />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Skill</th><th>Category</th><th>Description</th><th>Created By</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {skills.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</td>
                    <td><Badge variant="primary">{s.category}</Badge></td>
                    <td style={{ maxWidth: 200, color: '#666', fontSize: 12 }} className="truncate">{s.description || '—'}</td>
                    <td className="text-muted">{s.created_by_name || 'System'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)} id={`edit-skill-${s.id}`}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id, s.name)} id={`delete-skill-${s.id}`}>Delete</button>
                      </div>
                    </td>
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

export default AdminSkills;

