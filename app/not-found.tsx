import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-4">
        <p className="text-sm font-medium text-yellow-500">404</p>
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="text-gray-400">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded bg-yellow-500 px-5 text-sm font-semibold text-gray-950 hover:bg-yellow-400"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
