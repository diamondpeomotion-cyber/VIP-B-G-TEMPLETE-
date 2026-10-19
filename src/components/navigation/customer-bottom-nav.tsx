'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, User, Clock } from 'lucide-react';

export function MobileBottomNav({ shopId }: { shopId: string }) {
  const pathname = usePathname();
  
  const nav = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/book', icon: Calendar, label: 'Book Now' },
    { href: '/bookings', icon: Clock, label: 'My Bookings' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#121214] border-t border-[#2a2a2d] md:hidden pb-safe">
      <div className="flex justify-around items-center h-16">
        {nav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-[#c5a059]' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium font-mono uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
