import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import authOptions from '../../../app/api/auth/config';
import Header from '../../../components/Header';
import PropertiesSection from '../../../components/PropertiesSection';
import PendingSharesProcessor from '../../../components/pendingShares';


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
            <h2 className="main-title">Properties</h2>
            <div className="dashboard-section">
              <h3 className="section-heading">Properties Management</h3>
              <PropertiesSection />
            </div>
            <div className="dashboard-section">
              <h3 className="section-heading">Pending Shares</h3>
              <PendingSharesProcessor />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}