import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FaTachometerAlt, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { logout } from '@/lib/api';

const Navbar: React.FC = () => {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <FaTachometerAlt className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {session?.user && (
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <FaUser className="h-4 w-4" />
                <span>{session.user.username}</span>
                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                  {session.user.role}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
            >
              <FaSignOutAlt className="mr-2 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;