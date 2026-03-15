import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, History, Building2,
  FlaskConical, LogOut, Activity, ChevronRight, BedDouble
} from 'lucide-react';
import { cn } from '../../utils';
import { useApp } from '../../context/AppContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cases/new', icon: PlusCircle, label: 'Novo Caso' },
  { to: '/history', icon: History, label: 'Histórico' },
  { to: '/hospitals', icon: Building2, label: 'Hospitais' },
  { to: '/nir', icon: BedDouble, label: 'NIR / Leitos' },
  { to: '/simulation', icon: FlaskConical, label: 'Simulação' },
];

export function Sidebar() {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-16 lg:w-60 flex flex-col bg-slate-950 border-r border-slate-800/60 h-screen sticky top-0 z-30 flex-shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-3 lg:px-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Activity size={16} className="text-white" />
          </div>
          <div className="hidden lg:block min-w-0">
            <p className="font-display font-bold text-slate-100 text-sm leading-tight">SIREME</p>
            <p className="font-body text-slate-500 text-[10px] leading-tight truncate">Regulação Médica</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-lg px-2 lg:px-3 py-2.5 text-sm font-medium font-body transition-all group',
              isActive
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={cn('flex-shrink-0', isActive ? 'text-blue-400' : '')} />
                <span className="hidden lg:block flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="hidden lg:block text-blue-500/60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-2 lg:p-3 border-t border-slate-800/60 space-y-2">
        {user && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40">
            <div className="w-7 h-7 rounded-full bg-blue-600/80 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold font-display">{user.initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-slate-200 text-xs font-medium font-body truncate">{user.name}</p>
              <p className="text-slate-500 text-[10px] font-body truncate">{user.crm ?? user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-body"
        >
          <LogOut size={16} />
          <span className="hidden lg:block">Sair</span>
        </button>
      </div>
    </aside>
  );
}
