'use client';

import { usePathname } from 'next/navigation';
import AppLayout from './AppLayout';

const publicRoutes = ['/login', '/register', '/welcome'];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Check if current route is public (no layout needed)
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // If public route, render children without layout
  if (isPublicRoute) {
    return <>{children}</>;
  }
  
  // Otherwise, wrap with AppLayout
  return <AppLayout>{children}</AppLayout>;
}
