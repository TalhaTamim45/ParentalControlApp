import React from 'react';
import { 
  Shield, 
  Home, 
  MapPin, 
  Smartphone, 
  Activity, 
  Clock, 
  Lock, 
  Bell, 
  Globe, 
  HardDrive, 
  Settings, 
  Terminal,
  LogOut,
  ChevronRight
} from 'lucide-react';

export type NavTab = 
  | 'home' 
  | 'location' 
  | 'screen' 
  | 'activity' 
  | 'screentime' 
  | 'rules' 
  | 'notifications' 
  | 'geofences' 
  | 'devices' 
  | 'diagnostics' 
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onLogout: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  isOpen,
  onCloseMobile
}) => {
  const mainNavItems = [
    { id: 'home' as NavTab, label: 'Home Overview', icon: Home, implemented: true },
    { id: 'location' as NavTab, label: 'Live Location', icon: MapPin, implemented: true },
    { id: 'screen' as NavTab, label: 'Screen View', icon: Smartphone, implemented: false },
    { id: 'activity' as NavTab, label: 'App Activity', icon: Activity, implemented: false },
    { id: 'screentime' as NavTab, label: 'Screen Time', icon: Clock, implemented: false },
    { id: 'rules' as NavTab, label: 'App Rules', icon: Lock, implemented: true },
    { id: 'notifications' as NavTab, label: 'Notifications', icon: Bell, implemented: true },
    { id: 'geofences' as NavTab, label: 'Geofences', icon: Globe, implemented: false },
    { id: 'devices' as NavTab, label: 'Devices List', icon: HardDrive, implemented: true },
  ];

  const secondaryNavItems = [
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings, implemented: false },
    { id: 'diagnostics' as NavTab, label: 'Developer Diagnostics', icon: Terminal, implemented: true },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
              <Shield className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight text-base">PARENT SHIELD</h1>
              <p className="text-[11px] font-medium text-slate-400">Personal Parental Control</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* Primary Nav */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Main Menu
            </div>
            <nav className="space-y-1">
              {mainNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onCloseMobile();
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group
                      ${isActive 
                        ? 'bg-blue-50 text-blue-600 shadow-xs' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span>{item.label}</span>
                    </div>
                    {!item.implemented && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-400 rounded-md">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Secondary Nav */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              System & Diagnostics
            </div>
            <nav className="space-y-1">
              {secondaryNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onCloseMobile();
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group
                      ${isActive 
                        ? 'bg-blue-50 text-blue-600 shadow-xs' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span>{item.label}</span>
                    </div>
                    {!item.implemented && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-400 rounded-md">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
              <span>Sign Out</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </aside>
    </>
  );
};
