import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { LayoutDashboard, Users, UploadCloud, Hexagon, Settings, LogOut } from "lucide-react";
import { SettingsModal } from "./Modals";

export function Layout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/team", icon: Users, label: "My Team" },
    { to: "/submit", icon: UploadCloud, label: "Submit Project" },
  ];

  return (
    <div className="flex h-screen w-full bg-background font-sans text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col relative z-20">
        {/* Logo/Brand Area */}
        <div className="h-16 flex flex-col justify-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Hexagon className="w-6 h-6 fill-primary" />
            <span>Hackathon</span>
          </div>
          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5 ml-8">Team Leader</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-radius-md transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        
        {/* User Profile - Hover Menu Area */}
        <div className="relative group p-4 border-t border-border mt-auto">
          {/* Hover Menu */}
          <div className="absolute bottom-full left-0 w-full px-4 hidden group-hover:block pb-2 animate-in slide-in-from-bottom-2 duration-200">
            <div className="bg-card border border-border shadow-lg rounded-radius-md flex flex-col p-1.5">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-radius-sm transition-colors w-full text-left"
              >
                <Settings className="w-4 h-4 text-muted-foreground" /> Settings
              </button>
              <div className="h-px bg-border my-1 mx-1"></div>
              <button
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-radius-sm transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3 py-2 rounded-radius-md hover:bg-sidebar-accent cursor-pointer transition-colors">
            <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
              NL
            </div>
            <div className="flex flex-col text-sm">
              <span className="font-semibold text-sidebar-foreground leading-none">Nguyen Quoc Lap</span>
              <span className="text-muted-foreground text-xs mt-1 font-medium">Team Leader</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 bg-background">
        <div className="h-full p-8 md:p-12 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Modals */}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}
