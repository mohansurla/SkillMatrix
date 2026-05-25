import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { progressAPI, assignmentsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { StatCard, ProgressBar, LoadingSpinner, EmptyState, Badge } from '../../components/UI';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const statusVariant = { submitted: 'info', evaluated: 'success', pending: 'warning' };

const StudentDashboard = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, aRes] = await Promise.all([
          progressAPI.getProgress(),
          assignmentsAPI.getAll({ limit: 5 }),
        ]);
        setProgress(pRes.data.data.progress);
        setAssignments(aRes.data.data.assignments);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  const totalModules = progress.reduce((s, p) => s + p.total_modules, 0);
  const submitted = progress.reduce((s, p) => s + p.submitted_modules, 0);
  const avgScore = progress.length
    ? Math.round(progress.filter((p) => p.avg_score).reduce((s, p) => s + (p.avg_score || 0), 0) / (progress.filter((p) => p.avg_score).length || 1))
    : 0;
  const avgCompletion = progress.length
    ? Math.round(progress.reduce((s, p) => s + p.completion_percentage, 0) / progress.length)
    : 0;

  const chartData = {
    labels: progress.map((p) => p.skill_name),
    datasets: [
      {
        label: 'Completion %',
        data: progress.map((p) => p.completion_percentage),
        backgroundColor: 'rgba(108, 99, 255, 0.7)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Avg Score',
        data: progress.map((p) => p.avg_score || 0),
        backgroundColor: 'rgba(34, 211, 238, 0.7)',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 12 } } },
      tooltip: { backgroundColor: '#1c2030', titleColor: '#e2e8f0', bodyColor: '#94a3b8' },
    },
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' }, max: 100 },
    },
  };

  if (loading) return <DashboardLayout title="Dashboard"><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Dashboard">
      {/* Greeting */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Hello, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here&apos;s your learning progress overview</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4 mb-6">
        <StatCard icon="📚" label="Total Modules" value={totalModules} color="primary" />
        <StatCard icon="✅" label="Submitted" value={submitted} color="success" />
        <StatCard icon="⭐" label="Avg Score" value={avgScore ? `${avgScore}%` : 'N/A'} color="warning" />
        <StatCard icon="📈" label="Avg Completion" value={`${avgCompletion}%`} color="cyan" />
      </div>

      <div className="grid grid-2">
        {/* Skills Progress */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Skill Progress</span>
          </div>
          {progress.length === 0 ? (
            <EmptyState icon="🎯" title="No skills yet" description="Your mentor will assign skills and modules" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {progress.map((p) => (
                <div key={p.id}>
                  <div className="flex justify-between mb-2">
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{p.skill_name}</span>
                      <span className="badge badge-secondary" style={{ marginLeft: 8 }}>{p.category}</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#666' }}>
                      {p.submitted_modules}/{p.total_modules} modules
                    </span>
                  </div>
                  <ProgressBar value={p.completion_percentage} showLabel={false} />
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-muted">{p.completion_percentage}% complete</span>
                    {p.avg_score && <span className="text-sm text-success">Avg: {p.avg_score}/100</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Performance Chart</span>
          </div>
          {progress.length === 0 ? (
            <EmptyState icon="📊" title="No data yet" />
          ) : (
            <div style={{ height: 260 }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          )}
        </div>
      </div>

      {/* Recent Assignments */}
      <div className="card mt-6">
        <div className="card-header">
          <span className="card-title">Recent Submissions</span>
        </div>
        {assignments.length === 0 ? (
          <EmptyState icon="📝" title="No submissions yet" description="Submit your first assignment to get started" />
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
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>{a.title}</td>
                    <td className="text-muted">{a.module_title}</td>
                    <td className="text-muted">{a.skill_name}</td>
                    <td><Badge variant={statusVariant[a.status]}>{a.status}</Badge></td>
                    <td>{a.score != null ? `${a.score}/${a.max_score}` : '—'}</td>
                    <td className="text-muted">{new Date(a.submitted_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;

