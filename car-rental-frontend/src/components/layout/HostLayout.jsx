import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, LayoutDashboard, Car, FileText, Calendar } from 'lucide-react'
import Navbar from './Navbar'

export default function HostLayout({ children }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menuItems = [
    { path: '/host', icon: LayoutDashboard, label: 'Tổng quan' },
    { path: '/host/cars', icon: Car, label: 'Xe của tôi' },
    { path: '/host/bookings', icon: FileText, label: 'Đơn đặt' },
    { path: '/host/calendar', icon: Calendar, label: 'Lịch trình' },
  ]

  // Fix lỗi sáng 2 menu cùng lúc
  const isActive = (path) => {
    if (path === '/host') return location.pathname === '/host'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-soft">
      {/* 1. Gọi Global Navbar ở trên cùng */}
      <Navbar />

      {/* 2. Layout chia 2 cột cho Dashboard */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Sidebar (Cố định trên Desktop, Trượt ra trên Mobile) */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border pt-16 md:pt-8 px-4
                     transition-transform duration-300 md:relative md:translate-x-0 md:bg-transparent md:border-none md:block
                     ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="sticky top-24 space-y-2">
            {/* Nút đóng Sidebar trên Mobile */}
            <div className="flex justify-end mb-4 md:hidden">
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="p-2 bg-surface-soft rounded-lg text-primary hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Danh sách Menu */}
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
                             ${active 
                                ? 'bg-teal-50 text-teal-700 shadow-sm' 
                                : 'text-primary-muted hover:text-primary hover:bg-surface'
                             }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </aside>

        {/* Lớp nền đen che màn hình khi mở Sidebar trên Mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 3. Nội dung chính của trang */}
        <main className="flex-1 min-w-0 py-6 px-4 md:px-8">
          
          {/* Nút mở menu phụ cho Mobile (Vì Navbar đã lấy mất nút Hamburger) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden flex items-center gap-2 mb-6 text-sm font-medium text-primary bg-surface border border-border px-4 py-2 rounded-lg hover:text-teal-600 hover:border-teal-200 transition-colors shadow-sm"
          >
            <Menu className="w-4 h-4" /> Menu Quản lý
          </button>

          <div className="animate-fade-in">
            {children}
          </div>
        </main>
        
      </div>
    </div>
  )
}