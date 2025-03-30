import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import authOptions from '../../../app/api/auth/config';
import Header from '../../../components/Header';
import UsersSection from '../../../components/UsersSection';
import PropertiesSection from '../../../components/PropertiesSection';

export default async function AdminDashboard() {
  // Check if user is authenticated and is admin
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
        <Header userName={session.user.name || 'Guest'}/>
        <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
          <h2 className="text-xl font-semibold mb-4">Admin Dashboard</h2>
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-4 my-5">
                <div>
                    <h3 className="mb-1">User Management</h3>
                    <UsersSection />
                </div>
            </div>
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-4 my-5">
                <h3 className="mb-1">Properties Management</h3>
                <PropertiesSection />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}