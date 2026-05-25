import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import './DashboardLayout.css';

const DashboardLayout = ({ children, title = 'Dashboard' }) => {
  return (
    <div className="layout-wrapper">
      <Sidebar />
      <div className="layout-main">
        <Navbar title={title} />
        <main className="layout-content fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
