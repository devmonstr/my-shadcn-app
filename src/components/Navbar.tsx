// components/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/hooks/useSession';
import { NotificationBell } from './NotificationBell';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, handleLogout } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
              NVRS
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Home
              </Link>
              <Link
                href="/about"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/about')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                About
              </Link>
              <Link
                href="/community"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/community')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Community
              </Link>
              {isAuthenticated && (
                <Link
                  href="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/dashboard')
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="text-sm"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button className="text-sm">Login</Button>
              </Link>
            )}
          </div>
          <div className="flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="text-gray-500 hover:text-gray-700"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/')
                  ? 'border-indigo-500 text-indigo-700 bg-indigo-50'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/about')
                  ? 'border-indigo-500 text-indigo-700 bg-indigo-50'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/community"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive('/community')
                  ? 'border-indigo-500 text-indigo-700 bg-indigo-50'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Community
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/dashboard')
                      ? 'border-indigo-500 text-indigo-700 bg-indigo-50'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <div className="pl-3 pr-4 py-2 space-y-2">
                  <div className="flex items-center">
                    <NotificationBell />
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-sm w-full"
                  >
                    Logout
                  </Button>
                </div>
              </>
            )}
            {!isAuthenticated && (
              <Link
                href="/login"
                className="block pl-3 pr-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Button className="text-sm w-full">Login</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}