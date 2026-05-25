import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { usersAPI, progressAPI } from '../../api';
import { LoadingSpinner, EmptyState, ProgressBar } from '../../components/UI';

const MentorStudents = () => {
  const [students, setStudents] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const sRes = await usersAPI.getMentorStudents();
        const sList = sRes.data.data.students;
        setStudents(sList);

        // Fetch progress for each student
        const progressMap = {};
        await Promise.all(
          sList.map(async (s) => {
            try {
              const pRes = await progressAPI.getProgress({ student_id: s.id });
              progressMap[s.id] = pRes.data.data.progress;
            } catch {}
          })
        );
        setProgress(progressMap);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <DashboardLayout title="My Students"><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="My Students">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Students</h1>
          <p className="page-subtitle">Monitor learning progress for your assigned students</p>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="card">
          <EmptyState icon="🎓" title="No students assigned" description="Contact admin to assign students to your profile" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {students.map((s) => {
            const sp = progress[s.id] || [];
            const avgCompletion = sp.length ? Math.round(sp.reduce((acc, p) => acc + p.completion_percentage, 0) / sp.length) : 0;
            const avgScore = sp.length && sp.some((p) => p.avg_score)
              ? Math.round(sp.filter((p) => p.avg_score).reduce((acc, p) => acc + (p.avg_score || 0), 0) / sp.filter((p) => p.avg_score).length)
              : null;

            return (
              <div className="card card-hover" key={s.id}>
                <div className="flex items-start gap-4 mb-5" style={{ flexWrap: 'wrap' }}>
                  <div className="avatar avatar-lg" style={{ background: '#0066cc', flexShrink: 0 }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 style={{ fontWeight: 700, fontSize: 16 }}>{s.name}</h3>
                    <p style={{ fontSize: 13, color: '#666' }}>{s.email}</p>
                    <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                      Assigned: {new Date(s.assigned_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-6">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#0066cc' }}>{avgCompletion}%</div>
                      <div style={{ fontSize: 11, color: '#999' }}>Avg Completion</div>
                    </div>
                    {avgScore && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#28a745' }}>{avgScore}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>Avg Score</div>
                      </div>
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#17a2b8' }}>{sp.length}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>Skills</div>
                    </div>
                  </div>
                </div>

                {sp.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Skill Breakdown
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {sp.map((p) => (
                        <div key={p.skill_id}>
                          <div className="flex justify-between mb-1">
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{p.skill_name}</span>
                            <div className="flex gap-3">
                              {p.avg_score && <span style={{ fontSize: 12, color: '#28a745' }}>Score: {p.avg_score}/100</span>}
                              <span style={{ fontSize: 12, color: '#666' }}>{p.submitted_modules}/{p.total_modules} modules</span>
                            </div>
                          </div>
                          <ProgressBar value={p.completion_percentage} showLabel={false} size="sm"
                            color={p.completion_percentage >= 80 ? 'success' : p.completion_percentage >= 50 ? 'primary' : 'warning'} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MentorStudents;

