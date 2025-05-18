import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import authOptions from '../../../app/api/auth/config';
import Header from '../../../components/Header';
import UsersSection from '../../../components/UsersSection';
import PropertiesSection from '../../../components/PropertiesSection';
import VerificationSection from '../../../components/VerificationSection';
import PendingSharesProcessor from '../../../components/pendingShares';
import WithdrawalsSection from '../../../components/WithdrawalsSection';
import NotificationsSection from '../../../components/NotificationsSection';

export const revalidate = 0;

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }
  
  return (
    <div className="admin-dashboard">
      <Header userName={session.user.name || 'Guest'}/>
      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="dashboard-content">
            <h2 className="main-title">Admin Dashboard</h2>
            
            <div className="dashboard-section">
              <h3 className="section-heading">User Management</h3>
              <UsersSection />
            </div>

            <div className="dashboard-section">
              <h3 className="section-heading">Properties Management</h3>
              <PropertiesSection />
            </div>

            <div className="dashboard-section">
              <h3 className="section-heading">Pending Shares</h3>
              <PendingSharesProcessor />
            </div>

            <div className="dashboard-section">
              <h3 className="section-heading">Withdrawals</h3>
              <WithdrawalsSection />
            </div>

            <div className="dashboard-section">
              <h3 className="section-heading">Verification Management</h3>
              <VerificationSection />
            </div>

            <div className="dashboard-section">
              <h3 className="section-heading">Notifications Section</h3>
              <NotificationsSection />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}