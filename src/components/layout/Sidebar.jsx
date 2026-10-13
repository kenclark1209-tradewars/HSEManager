import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, AlertTriangle, Shield, Zap, FileText,
  Scale, Bot, Settings, ChevronLeft, ChevronRight, LogOut,
  CalendarDays, Tags, BarChart3, ClipboardList, Wallet,
  ShieldCheck, ChevronDown, ChevronUp, Activity, RefreshCw, ListChecks, Wrench, Inbox, BookOpen,
  GraduationCap, Siren, ShieldAlert, Brain, BookMarked, Bell, Grid3X3, ClipboardCheck, Hash, Gavel
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const NavItem = ({ item, collapsed, pendingCount = 0 }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path ||
    (item.path !== '/' && location.pathname.startsWith(item.path));
  const showBadge = item.badge && pendingCount > 0;

  return (
    <Link
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        isActive
          ? "bg-sidebar-accent text-sidebar-primary"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      <div className="relative shrink-0">
        <item.icon className="w-4 h-4" />
        {showBadge && collapsed && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </div>
      {!collapsed && (
        <span className="flex-1">{item.label}</span>
      )}
      {!collapsed && showBadge && (
        <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {pendingCount > 99 ? '99+' : pendingCount}
        </span>
      )}
    </Link>
  );
};

const NavGroup = ({ group, collapsed, pendingCount = 0 }) => {
  const location = useLocation();
  const hasActive = group.items.some(i =>
    location.pathname === i.path || (i.path !== '/' && location.pathname.startsWith(i.path))
  );
  const [open, setOpen] = useState(hasActive || true);
  const GroupIcon = group.icon;

  if (collapsed) {
  return (
    <div className="space-y-0.5">
      {group.items.map(item => <NavItem key={item.path} item={item} collapsed pendingCount={item.badge ? pendingCount : 0} />)}
    </div>
  );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
          "text-sidebar-foreground/40 hover:text-sidebar-foreground/70"
        )}
      >
        <div className="flex items-center gap-2">
          <GroupIcon className="w-3.5 h-3.5" />
          <span>{group.label}</span>
        </div>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="ml-2 mt-0.5 space-y-0.5 border-l border-sidebar-border/40 pl-2">
          {group.items.map(item => <NavItem key={item.path} item={item} collapsed={false} pendingCount={item.badge ? pendingCount : 0} />)}
        </div>
      )}
    </div>
  );
};

const NAV_STRUCTURE = [
  {
    type: 'item',
    path: '/', icon: LayoutDashboard, label: 'Bảng điều khiển',
  },
  {
    type: 'group',
    label: 'Vận hành',
    icon: Zap,
    items: [
      { path: '/incidents', icon: AlertTriangle, label: 'Sự cố' },
      { path: '/risks', icon: Shield, label: 'Rủi ro' },
      { path: '/actions', icon: Zap, label: 'Hành động' },
    ]
  },
  {
    type: 'group',
    label: 'Pháp Lý HSE',
    icon: BookMarked,
    items: [
      { path: '/legal/dashboard', icon: LayoutDashboard, label: 'Legal Dashboard' },
      { path: '/legal/categories', icon: Grid3X3, label: 'Ma trận 41 hạng mục' },
      { path: '/legal/registry', icon: BookMarked, label: 'Kho văn bản pháp luật' },
      { path: '/legal/clauses', icon: Hash, label: 'Điều khoản pháp luật' },
      { path: '/legal/alerts', icon: Bell, label: 'Cảnh báo pháp lý' },
      { path: '/legal/research', icon: Gavel, label: 'Nghiên cứu Pháp luật AI' },
    ]
  },
  {
    type: 'group',
    label: 'Thư Viện Tài Liệu',
    icon: FileText,
    items: [
      { path: '/library/sops', icon: FileText, label: 'SOP Library' },
      { path: '/library/checklists', icon: ListChecks, label: 'Checklist Library' },
      { path: '/library/forms', icon: ClipboardCheck, label: 'Form Library' },
      { path: '/regulations', icon: Scale, label: 'Quy định (cũ)' },
      { path: '/training', icon: GraduationCap, label: 'Đào tạo' },
      { path: '/emergency', icon: Siren, label: 'Ứng phó khẩn cấp' },
    ]
  },
  {
    type: 'group',
    label: 'Kế Hoạch',
    icon: CalendarDays,
    items: [
      { path: '/pdca', icon: RefreshCw, label: 'PDCA' },
      { path: '/checklists', icon: ListChecks, label: 'Checklist thực hiện' },
    ]
  },
  {
    type: 'group',
    label: 'Quản lý',
    icon: BarChart3,
    items: [
      { path: '/reports', icon: BarChart3, label: 'Báo cáo' },
      { path: '/inspections', icon: ClipboardList, label: 'Kiểm tra' },
      { path: '/budget', icon: Wallet, label: 'Ngân sách' },
      { path: '/compliance', icon: ShieldCheck, label: 'Tuân thủ' },
      { path: '/compliance-tracker', icon: ShieldCheck, label: 'Theo dõi Hạn & Bằng chứng' },
    ]
  },
  {
    type: 'group',
    label: 'AI Manager',
    icon: Bot,
    items: [
      { path: '/ai', icon: Bot, label: 'AI Assistant' },
      { path: '/ai/role', icon: Bot, label: 'AI theo Vai trò' },
      { path: '/ai/monitor', icon: Activity, label: 'KPI Monitor' },
      { path: '/ai/tools', icon: Wrench, label: 'Tool Definitions' },
      { path: '/ai/queue', icon: Inbox, label: 'Hàng đợi duyệt', badge: true },
      { path: '/ai/knowledge', icon: BookOpen, label: 'Kho tri thức' },
      { path: '/ai/insights', icon: Brain, label: 'AI Insights' },
      { path: '/audit-log', icon: ShieldAlert, label: 'Nhật ký kiểm toán' },
    ]
  },
  {
    type: 'item',
    path: '/settings', icon: Settings, label: 'Cài đặt',
  },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { data: pendingQueue = [] } = useQuery({
    queryKey: ['ai-queue-pending-count'],
    queryFn: () => base44.entities.AIActionQueue.filter({ status: 'PENDING' }),
    refetchInterval: 30000,
  });
  const pendingCount = pendingQueue.length;

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col z-40 transition-all duration-300 border-r border-sidebar-border",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-base leading-none">HSE Manager</span>
              <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">ISO 45001</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center mx-auto">
            <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
        {NAV_STRUCTURE.map((node, i) => {
          if (node.type === 'item') {
            return <NavItem key={node.path} item={node} collapsed={collapsed} />;
          }
          return <NavGroup key={i} group={node} collapsed={collapsed} pendingCount={pendingCount} />;
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border space-y-1 shrink-0">
        <button
          onClick={() => base44.auth.logout()}
          title={collapsed ? 'Đăng xuất' : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground w-full transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>{t('logout')}</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}