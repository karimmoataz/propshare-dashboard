import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '../../app/api/auth/[...nextauth]/route';
import LoginForm from '../../components/auth/LoginForm';
import Image from 'next/image';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  
  if (session && session.user.role === 'admin') {
    redirect('/admin/dashboard');
  }
  
  return (
    <div className="bg-white min-h-screen w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(189,231,249,0.3)] to-transparent to-30%"></div>
        <div className="mx-auto justify-center flex relative">
          <Image
            src="/logo.png" 
            alt="Logo" 
            width={300}
            height={150}
            className="object-contain my-10"
          />
        </div>
        <div className="my-5 justify-center text-center">
          <h2 className="text-2xl font-bold text-black mb-3">
            Sign in to your Account
          </h2>
          <p className="text-base text-gray-700">
            Enter your email and password to log in
          </p>
        </div>
        <LoginForm />
    </div>
);
}