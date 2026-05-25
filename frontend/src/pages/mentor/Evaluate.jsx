import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { assignmentsAPI, evaluationsAPI } from '../../api';
import { LoadingSpinner, EmptyState, Badge, Pagination, ScoreCircle } from '../../components/UI';
import toast from 'react-hot-toast';

const statusVariant = { submitted: 'info', evaluated: 'success', pending: 'warning' };

const MentorEvaluate = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState('submitted');
  const [evalModal, setEvalModal] = useState(null); // assignment to evaluate
  const [evalForm, setEvalForm] = useState({ score: '', feedback: '' });
  const [evalErrors, setEvalErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await assignmentsAPI.getAll({ page, limit: 10, status: statusFilter || undefined });
      setAssignments(res.data.data.assignments);
      setPagination(res.data.data.pagination);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, statusFilter]); // eslint-disable-line

  const openEval = (a) => {
    setEvalModal(a);
    setEvalForm({ score: '', feedback: '' });
    setEvalErrors({});
  };

  const validateEval = () => {
    const e = {};
    if (evalForm.score === '') e.score = 'Score is required';
    else if (Number(evalForm.score) < 0 || Number(evalForm.score) > 100) e.score = 'Score must be 0-100';
    if (!evalForm.feedback.trim()) e.feedback = 'Feedback is required';
    setEvalErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleEvalSubmit = async (e) => {
    e.preventDefault();
    if (!validateEval()) return;
    setSubmitting(true);
    try {
      await evaluationsAPI.create({
        assignment_id: evalModal.id,
        score: Number(evalForm.score),
        feedback: evalForm.feedback,
      });
      toast.success('Evaluation submitted! Student has been notified. ✅');
      setEvalModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Evaluation failed');
    } finally { setSubmitting(false); }
  };

  return (
    <DashboardLayout title="Evaluate Submissions">
      <div className="page-header">
        <div>
          <h1 className="page-title">Evaluate Submissions</h1>
          <p className="page-subtitle">Review student work and provide scores with feedback</p>
        </div>
      </div>

      {/* Eval Modal */}
      {evalModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEvalModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Evaluate Assignment</h3>
              <button className="modal-close" onClick={() => setEvalModal(null)}>×</button>
            </div>

            {/* Submission info */}
            <div style={{ background: '#f8f8f8', borderRadius: '4px', padding: '14px', marginBottom: '18px' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{evalModal.title}</div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                by {evalModal.student_name} · {evalModal.module_title} · {evalModal.skill_name}
              </div>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{evalModal.description}</p>
              {evalModal.file_url && (
                <a href={evalModal.file_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, marginTop: 8, display: 'inline-block' }}>
                  🔗 View Submission
                </a>
              )}
            </div>

            <form onSubmit={handleEvalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} noValidate>
              <div className="form-group">
                <label className="form-label">Score (0–{evalModal.max_score || 100}) *</label>
                <input
                  type="number"
                  className={`form-input ${evalErrors.score ? 'error' : ''}`}
                  min="0"
                  max={evalModal.max_score || 100}
                  placeholder="e.g. 85"
                  value={evalForm.score}
                  onChange={(e) => setEvalForm({ ...evalForm, score: e.target.value })}
                  id="eval-score"
                />
                {evalErrors.score && <span className="form-error">{evalErrors.score}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Feedback *</label>
                <textarea
                  className={`form-textarea ${evalErrors.feedback ? 'error' : ''}`}
                  placeholder="Provide constructive feedback to help the student improve..."
                  value={evalForm.feedback}
                  onChange={(e) => setEvalForm({ ...evalForm, feedback: e.target.value })}
                  id="eval-feedback"
                  rows={5}
                />
                {evalErrors.feedback && <span className="form-error">{evalErrors.feedback}</span>}
              </div>

              <div className="flex gap-3 justify-between">
                <button type="button" className="btn btn-secondary" onClick={() => setEvalModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-success" id="submit-eval-btn" disabled={submitting}>
                  {submitting ? <span className="spinner spinner-sm" /> : '⭐'}
                  {submitting ? 'Submitting...' : 'Submit Evaluation'}
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

      <div className="card">
        {loading ? <LoadingSpinner /> : assignments.length === 0 ? (
          <EmptyState icon="✅" title="No submissions found" description="Students' assignments will appear here" />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Assignment</th>
                  <th>Module / Skill</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar avatar-sm" style={{ background: '#0066cc', flexShrink: 0 }}>
                          {a.student_name?.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{a.student_name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }} className="truncate">
                        {a.description?.substring(0, 50)}{a.description?.length > 50 ? '...' : ''}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{a.module_title}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{a.skill_name}</div>
                    </td>
                    <td><Badge variant={statusVariant[a.status]}>{a.status}</Badge></td>
                    <td>
                      {a.score != null ? <ScoreCircle score={a.score} max={a.max_score} /> : <span className="text-muted">—</span>}
                    </td>
                    <td className="text-muted">{new Date(a.submitted_at).toLocaleDateString()}</td>
                    <td>
                      {a.status === 'submitted' ? (
                        <button className="btn btn-primary btn-sm" onClick={() => openEval(a)} id={`eval-btn-${a.id}`}>
                          Evaluate
                        </button>
                      ) : (
                        <span className="text-sm text-muted">Evaluated</span>
                      )}
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

export default MentorEvaluate;

