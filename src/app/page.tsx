import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <main className="main-content">
        <h1 className="title">
          Welcome to{' '}
          <span className="title-highlight">
            PropShare Admin
          </span>
        </h1>

        <div className="link-container">
          <Link
            href="/login"
            className="admin-link"
          >
            <h3 className="link-title">Admin Login &rarr;</h3>
            <p className="link-description">
              Access the admin dashboard to manage the platform.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}