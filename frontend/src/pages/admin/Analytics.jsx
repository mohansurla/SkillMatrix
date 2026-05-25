import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { progressAPI, skillsAPI } from '../../api';
import { LoadingSpinner, EmptyState, ProgressBar } from '../../components/UI';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const AdminAnalytics = () => {
  const [rankings, setRankings] = useState([]);
  const [progress, setProgress] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [rRes, pRes, sRes] = await Promise.all([
        progressAPI.getRankings({ skill_id: selectedSkill || undefined }),
        progressAPI.getProgress(),
        skillsAPI.getAll(),
      ]);
      setRankings(rRes.data.data.rankings);
      setProgress(pRes.data.data.progress);
      setSkills(sRes.data.data.skills);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [selectedSkill]); // eslint-disable-line

  const rankChartData = {
    labels: rankings.slice(0, 8).map((r) => r.name),
    datasets: [
      {
        label: 'Avg Score',
        data: rankings.slice(0, 8).map((r) => r.avg_score),
        backgroundColor: 'rgba(108, 99, 255, 0.7)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Avg Completion %',
        data: rankings.slice(0, 8).map((r) => r.avg_completion),
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

  return (
    <DashboardLayout title="Analytics">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Deep-dive into student performance and skill mastery</p>
        </div>
        <select
          className="form-select"
          style={{ width: 200 }}
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          id="analytics-skill-filter"
        >
          <option value="">All Skills</option>
          {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Rankings chart */}
          <div className="card mb-6">
            <div className="card-header">
              <span className="card-title">Student Rankings – Score & Completion</span>
              <span style={{ fontSize: 12, color: '#999' }}>Top 8 students</span>
            </div>
            {rankings.length === 0 ? <EmptyState icon="📊" title="No data yet" /> : (
              <div style={{ height: 300 }}>
                <Bar data={rankChartData} options={chartOptions} />
              </div>
            )}
          </div>

          {/* Rankings table */}
          <div className="card mb-6">
            <div className="card-header">
              <span className="card-title">🏆 Skill Rankings</span>
            </div>
            {rankings.length === 0 ? (
              <EmptyState icon="🏆" title="No rankings available" />
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Student</th>
                      <th>Avg Score</th>
                      <th>Avg Completion</th>
                      <th>Evaluations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <span style={{ fontWeight: 700, color: r.rank <= 3 ? '#856404' : '#666' }}>
                            {r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : `#${r.rank}`}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="avatar avatar-sm" style={{ background: '#0066cc', flexShrink: 0 }}>
                              {r.name?.charAt(0)}
                            </div>
                            <span style={{ fontWeight: 500, fontSize: 13 }}>{r.name}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontWeight: 700,
                            color: r.avg_score >= 85 ? '#28a745' : r.avg_score >= 70 ? '#17a2b8' : '#856404'
                          }}>
                            {r.avg_score || '—'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div style={{ flex: 1, minWidth: 80 }}>
                              <ProgressBar value={r.avg_completion} showLabel={false} size="sm" color={r.avg_completion >= 70 ? 'success' : 'primary'} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#666', minWidth: 35 }}>{r.avg_completion}%</span>
                          </div>
                        </td>
                        <td className="text-muted">{r.evaluated_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* All student progress */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">All Students Progress</span>
            </div>
            {progress.length === 0 ? (
              <EmptyState icon="📈" title="No progress data" />
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Skill</th>
                      <th>Category</th>
                      <th>Progress</th>
                      <th>Modules</th>
                      <th>Avg Score</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 500, fontSize: 13 }}>{p.student_name}</td>
                        <td>{p.skill_name}</td>
                        <td className="text-muted">{p.category}</td>
                        <td style={{ minWidth: 140 }}>
                          <div className="flex items-center gap-2">
                            <div style={{ flex: 1 }}>
                              <ProgressBar value={p.completion_percentage} showLabel={false} size="sm"
                                color={p.completion_percentage >= 80 ? 'success' : p.completion_percentage >= 50 ? 'primary' : 'warning'} />
                            </div>
                            <span style={{ fontSize: 12, minWidth: 35, fontWeight: 600 }}>{p.completion_percentage}%</span>
                          </div>
                        </td>
                        <td className="text-muted">{p.submitted_modules}/{p.total_modules}</td>
                        <td>
                          {p.avg_score ? (
                            <span style={{ color: p.avg_score >= 85 ? '#28a745' : '#333', fontWeight: 600 }}>
                              {p.avg_score}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="text-muted">{new Date(p.last_updated).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminAnalytics;

