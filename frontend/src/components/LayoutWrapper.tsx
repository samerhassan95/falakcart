'use client';

import { usePathname } from 'next/navigation';
import AppLayout from './AppLayout';
import AdminLayout from './AdminLayout';

const publicRoutes = ['/login', '/register', '/welcome'];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Check if current route is public (no layout needed)
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Check if current route is admin
  const isAdminRoute = pathname.startsWith('/admin');
  
  // If public route, render children without layout
  if (isPublicRoute) {
    return <>{children}</>;
  }
  
  // If admin route, wrap with AdminLayout
  if (isAdminRoute) {
    return <AdminLayout>{children}</AdminLayout>;
  }
  
  // Otherwise, wrap with AppLayout
  return <AppLayout>{children}</AppLayout>;
}


