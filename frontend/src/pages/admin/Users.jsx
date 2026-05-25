import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { usersAPI, authAPI } from '../../api';
import { LoadingSpinner, EmptyState, Badge, Pagination } from '../../components/UI';
import toast from 'react-hot-toast';

const roleVariant = { student: 'primary', mentor: 'info', admin: 'danger' };

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [roleFilter, setRoleFilter] = useState('');
  const [assignModal, setAssignModal] = useState(null);
  const [assignForm, setAssignForm] = useState({ mentor_id: '', student_id: '' });
  const [assigning, setAssigning] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [uRes, mRes] = await Promise.all([
        usersAPI.getAll({ page, limit: 10, role: roleFilter || undefined }),
        usersAPI.getMentors(),
      ]);
      setUsers(uRes.data.data.users);
      setPagination(uRes.data.data.pagination);
      setMentors(mRes.data.data.mentors);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, roleFilter]); // eslint-disable-line

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssigning(true);
    try {
      await usersAPI.assignMentor({ mentor_id: Number(assignForm.mentor_id), student_id: Number(assignForm.student_id) });
      toast.success('Mentor assigned successfully!');
      setAssignModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally { setAssigning(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await authAPI.register(createForm);
      toast.success('User created successfully!');
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', role: 'student' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Creation failed');
    } finally { setCreating(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await usersAPI.delete(id);
      toast.success('User deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const students = users.filter((u) => u.role === 'student');

  return (
    <DashboardLayout title="Manage Users">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage all platform users and mentor assignments</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => setAssignModal({})}>
            🔗 Assign Mentor
          </button>
          <button className="btn btn-primary" id="create-user-btn" onClick={() => setShowCreateModal(true)}>
            + Create User
          </button>
        </div>
      </div>

      {/* Assign Mentor Modal */}
      {assignModal !== null && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setAssignModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Assign Mentor to Student</h3>
              <button className="modal-close" onClick={() => setAssignModal(null)}>×</button>
            </div>
            <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Select Student</label>
                <select className="form-select" value={assignForm.student_id} onChange={(e) => setAssignForm({ ...assignForm, student_id: e.target.value })} required id="assign-student">
                  <option value="">Choose a student</option>
                  {students.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assign Mentor</label>
                <select className="form-select" value={assignForm.mentor_id} onChange={(e) => setAssignForm({ ...assignForm, mentor_id: e.target.value })} required id="assign-mentor">
                  <option value="">Choose a mentor</option>
                  {mentors.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
                </select>
              </div>
              <div className="flex gap-3 justify-between">
                <button type="button" className="btn btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={assigning}>
                  {assigning ? <span className="spinner spinner-sm" /> : '✓'} Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Create User</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} id="create-name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" required value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} id="create-email" />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" required minLength={6} value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} id="create-password" />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} id="create-role">
                  <option value="student">Student</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 justify-between">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <span className="spinner spinner-sm" /> : '+'} Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <div className="tabs">
          {['', 'student', 'mentor', 'admin'].map((r) => (
            <button key={r} className={`tab-btn ${roleFilter === r ? 'active' : ''}`} onClick={() => { setRoleFilter(r); setPage(1); }}>
              {r === '' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : users.length === 0 ? (
          <EmptyState icon="👥" title="No users found" />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar avatar-sm" style={{ background: '#0066cc', flexShrink: 0 }}>{u.name?.charAt(0)}</div>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{u.name}</span>
                      </div>
                    </td>
                    <td className="text-muted">{u.email}</td>
                    <td><Badge variant={roleVariant[u.role]}>{u.role}</Badge></td>
                    <td className="text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id, u.name)} id={`delete-user-${u.id}`}>
                        Delete
                      </button>
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

export default AdminUsers;

