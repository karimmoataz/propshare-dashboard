import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import authOptions from '../../api/auth/config';
import Header from '../../../components/Header';
import UsersSection from '../../../components/UsersSection';
import VerificationSection from '../../../components/VerificationSection';


export const revalidate = 0;

export default async function User() {
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
            <h2 className="main-title">Users</h2>
            
            <div className="dashboard-section">
              <h3 className="section-heading">User Management</h3>
              <UsersSection />
            </div>
            <div className="dashboard-section">
              <h3 className="section-heading">Verification Management</h3>
              <VerificationSection />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}