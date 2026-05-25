import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { modulesAPI, skillsAPI, usersAPI } from '../../api';
import { LoadingSpinner, EmptyState, Badge, Pagination } from '../../components/UI';
import toast from 'react-hot-toast';

const AdminModules = () => {
  const [modules, setModules] = useState([]);
  const [skills, setSkills] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [skillFilter, setSkillFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', skill_id: '', mentor_id: '', max_score: 100 });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [mRes, sRes, meRes] = await Promise.all([
        modulesAPI.getAll({ page, limit: 10, skill_id: skillFilter || undefined }),
        skillsAPI.getAll({ limit: 100 }),
        usersAPI.getMentors(),
      ]);
      setModules(mRes.data.data.modules);
      setPagination(mRes.data.data.pagination);
      setSkills(sRes.data.data.skills);
      setMentors(meRes.data.data.mentors);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, skillFilter]); // eslint-disable-line

  const openCreate = () => {
    setForm({ title: '', description: '', skill_id: '', mentor_id: '', max_score: 100 });
    setModal('create');
  };

  const openEdit = (mod) => {
    setForm({ title: mod.title, description: mod.description || '', skill_id: mod.skill_id, mentor_id: mod.mentor_id || '', max_score: mod.max_score });
    setModal(mod);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, skill_id: Number(form.skill_id), mentor_id: form.mentor_id ? Number(form.mentor_id) : undefined, max_score: Number(form.max_score) };
      if (modal === 'create') {
        await modulesAPI.create(payload);
        toast.success('Module created!');
      } else {
        await modulesAPI.update(modal.id, payload);
        toast.success('Module updated!');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete module "${title}"?`)) return;
    try {
      await modulesAPI.delete(id);
      toast.success('Module deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <DashboardLayout title="Manage Modules">
      <div className="page-header">
        <div>
          <h1 className="page-title">Modules</h1>
          <p className="page-subtitle">Manage learning modules assigned to skills</p>
        </div>
        <button className="btn btn-primary" id="create-module-btn" onClick={openCreate}>+ Add Module</button>
      </div>

      {modal !== null && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{modal === 'create' ? 'Create Module' : 'Edit Module'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Module Title *</label>
                <input type="text" className="form-input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} id="module-title" placeholder="e.g. Advanced React Patterns" />
              </div>
              <div className="form-group">
                <label className="form-label">Skill *</label>
                <select className="form-select" required value={form.skill_id} onChange={(e) => setForm({ ...form, skill_id: e.target.value })} id="module-skill">
                  <option value="">Select skill</option>
                  {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assign Mentor</label>
                <select className="form-select" value={form.mentor_id} onChange={(e) => setForm({ ...form, mentor_id: e.target.value })} id="module-mentor">
                  <option value="">No mentor</option>
                  {mentors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} id="module-desc" placeholder="What will students learn?" />
              </div>
              <div className="form-group">
                <label className="form-label">Max Score</label>
                <input type="number" className="form-input" min="1" max="1000" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: e.target.value })} id="module-score" />
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

      {/* Skill filter */}
      <div className="filter-bar">
        <select className="form-select" style={{ width: 200 }} value={skillFilter} onChange={(e) => { setSkillFilter(e.target.value); setPage(1); }} id="modules-skill-filter">
          <option value="">All Skills</option>
          {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : modules.length === 0 ? (
          <EmptyState icon="📚" title="No modules yet" description="Create the first module using the button above" />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Module</th><th>Skill</th><th>Mentor</th><th>Max Score</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{m.title}</div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }} className="truncate">{m.description}</div>
                    </td>
                    <td><Badge variant="primary">{m.skill_name}</Badge></td>
                    <td className="text-muted">{m.mentor_name || '—'}</td>
                    <td>{m.max_score}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(m)} id={`edit-module-${m.id}`}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id, m.title)} id={`delete-module-${m.id}`}>Delete</button>
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

export default AdminModules;

