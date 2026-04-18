import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="text-xl font-bold tracking-tight mb-3">
              xe<span className="text-teal-600">go</span>
            </div>
            <p className="text-sm text-primary-subtle leading-relaxed">
              Nền tảng thuê xe tự lái uy tín, kết nối hàng nghìn xe chất lượng trên toàn quốc.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">Khám phá</h4>
            <ul className="space-y-2">
              {[['Tìm xe', '/cars'], ['Đăng xe của bạn', '/register'], ['Cách hoạt động', '/how-it-works']].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-primary-subtle hover:text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">Hỗ trợ</h4>
            <ul className="space-y-2">
              {[['Trung tâm trợ giúp', '/help'], ['Chính sách hủy', '/policy'], ['Liên hệ', '/contact']].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-primary-subtle hover:text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">Pháp lý</h4>
            <ul className="space-y-2">
              {[['Điều khoản sử dụng', '/terms'], ['Chính sách bảo mật', '/privacy']].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-primary-subtle hover:text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-primary-subtle">
            © 2026 XeGo. Bảo lưu mọi quyền.
          </p>
          <p className="text-xs text-primary-subtle">
            Làm với ♥ tại Việt Nam
          </p>
        </div>
      </div>
    </footer>
  )
}