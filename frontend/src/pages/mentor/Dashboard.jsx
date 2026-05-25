import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { assignmentsAPI, usersAPI, progressAPI } from '../../api';
import { StatCard, LoadingSpinner, EmptyState, Badge, ProgressBar } from '../../components/UI';

const MentorDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, sRes] = await Promise.all([
          assignmentsAPI.getAll({ limit: 5, status: 'submitted' }),
          usersAPI.getMentorStudents(),
        ]);
        setAssignments(aRes.data.data.assignments);
        setStudents(sRes.data.data.students);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  const totalStudents = students.length;
  const pendingEvals = assignments.length;

  if (loading) return <DashboardLayout title="Mentor Dashboard"><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Mentor Dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mentor Dashboard</h1>
          <p className="page-subtitle">Manage your students and evaluate submissions</p>
        </div>
      </div>

      <div className="grid grid-4 mb-6">
        <StatCard icon="🎓" label="My Students" value={totalStudents} color="primary" />
        <StatCard icon="⏳" label="Pending Reviews" value={pendingEvals} color="warning" />
        <StatCard icon="📚" label="Total Modules" value="—" color="info" />
        <StatCard icon="⭐" label="Avg Score Given" value="—" color="success" />
      </div>

      <div className="grid grid-2">
        {/* My Students */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">My Students ({totalStudents})</span>
          </div>
          {students.length === 0 ? (
            <EmptyState icon="🎓" title="No students assigned" description="Contact admin to assign students to you" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {students.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3" style={{ background: '#f8f8f8', borderRadius: '4px' }}>
                  <div className="avatar avatar-md" style={{ background: '#0066cc', flexShrink: 0 }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{s.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending evaluations */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pending Reviews</span>
            <Badge variant="warning">{pendingEvals}</Badge>
          </div>
          {assignments.length === 0 ? (
            <EmptyState icon="✅" title="All caught up!" description="No pending evaluations" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {assignments.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3" style={{ background: '#f8f8f8', borderRadius: '4px', border: '1px solid #eee' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>by {a.student_name} · {a.module_title}</div>
                  </div>
                  <Badge variant="warning">pending</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MentorDashboard;

