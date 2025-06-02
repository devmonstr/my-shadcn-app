// components/Navbar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu } from 'lucide-react';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const publicKey = sessionStorage.getItem('public_key');
      setIsLoggedIn(!!publicKey);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('public_key');
    setIsLoggedIn(false);
    router.push('/login');
  };

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/community', label: 'Community' },
    ...(isLoggedIn ? [{ href: '/dashboard', label: 'Dashboard' }] : [{ href: '/login', label: 'Login' }]),
  ];

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
          <h1>NVRS NIP-05</h1>
        </Link>

        {/* NavigationMenu for larger screens */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="flex space-x-4">
            {navItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink asChild>
                  <Link
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === item.href
                        ? 'text-blue-600 font-semibold'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    {item.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
            {isLoggedIn && (
              <NavigationMenuItem>
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        {/* DropdownMenu for smaller screens */}
        <div className="flex md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="animate-in slide-in-from-top-2 fade-in-20">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={`w-full ${
                      pathname === item.href ? 'text-blue-600 font-semibold' : 'text-gray-600'
                    }`}
                  >
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              {isLoggedIn && (
                <DropdownMenuItem>
                  <button className="w-full text-left text-red-600" onClick={handleLogout}>
                    Logout
                  </button>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}