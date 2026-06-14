import { NavLink } from "react-router";
import { LayoutDashboard, Users, Settings, Briefcase, LogOut, Hexagon, Upload, ChevronDown, X } from "lucide-react";
import { useState } from "react";

export function Sidebar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);

  return (
    <>
      <aside className="w-[280px] bg-white border-r border-gray-200 flex flex-col h-full shrink-0 relative z-30">
        {/* Brand */}
        <div className="h-24 flex items-center px-8 shrink-0">
          <Hexagon className="w-7 h-7 text-black fill-black mr-3 shrink-0" />
          <div className="flex flex-col">
            <span className="font-extrabold text-2xl tracking-tighter text-black leading-none">Hackathon</span>
            <span className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Team Member</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 mt-4">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center px-4 py-3.5 text-[15px] font-bold transition-all ${
                isActive
                  ? "bg-black text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5 mr-3" strokeWidth={2.5} />
            Dashboard
          </NavLink>
          <NavLink
            to="/team"
            className={({ isActive }) =>
              `flex items-center px-4 py-3.5 text-[15px] font-bold transition-all ${
                isActive
                  ? "bg-black text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <Users className="w-5 h-5 mr-3" strokeWidth={2.5} />
            My Team
          </NavLink>
        </nav>

        {/* User Profile Footer */}
        <div className="relative group shrink-0 px-4 pb-4">
          {/* Hover Menu Popup */}
          <div className="absolute bottom-[calc(100%-8px)] left-4 right-4 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-75 ease-out z-40">
            <div className="bg-white border border-gray-200 shadow-xl py-2">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-full flex items-center px-5 py-3 text-[14px] font-bold text-gray-700 hover:bg-gray-100 hover:text-black transition-colors text-left"
              >
                <Settings className="w-4 h-4 mr-3" strokeWidth={2.5} />
                Settings
              </button>
              <div className="h-px bg-gray-200 my-1"></div>
              <button className="w-full flex items-center px-5 py-3 text-[14px] font-bold text-[#e03131] hover:bg-red-50 transition-colors text-left">
                <LogOut className="w-4 h-4 mr-3" strokeWidth={2.5} />
                Logout
              </button>
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex items-center gap-4 px-4 py-4 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                NH
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-gray-900 truncate">Nguyen Huynh...</p>
              <p className="text-[12px] text-gray-500 font-semibold truncate mt-0.5">Team Member</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-[640px] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex items-start justify-between shrink-0">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Personal Information</h2>
                <p className="text-[13px] font-semibold text-gray-500 mt-1">Update your profile details and settings here</p>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-8 space-y-8 overflow-y-auto">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold">
                    NH
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">Profile picture</p>
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2.5 text-[13px] font-bold text-gray-700 bg-white border-2 border-gray-200 hover:border-black transition-colors">
                      Upload new
                    </button>
                    <button className="px-4 py-2.5 text-[13px] font-bold text-[#e03131] bg-red-50 hover:bg-red-100 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[13px] font-bold text-gray-900 mb-2">First Name</label>
                    <input type="text" defaultValue="Nguyen Huynh" className="w-full border-2 border-gray-200 px-4 py-3.5 text-[13px] font-semibold text-gray-900 outline-none focus:border-black transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-gray-900 mb-2">Last Name</label>
                    <input type="text" defaultValue="Hoang Uyen" className="w-full border-2 border-gray-200 px-4 py-3.5 text-[13px] font-semibold text-gray-900 outline-none focus:border-black transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[13px] font-bold text-gray-900 mb-2">Email Address</label>
                    <input type="email" defaultValue="nguyen.uyen@example.com" className="w-full border-2 border-gray-200 px-4 py-3.5 text-[13px] font-semibold text-gray-900 outline-none focus:border-black transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-gray-900 mb-2">Phone Number</label>
                    <input type="tel" defaultValue="+84 123 456 789" className="w-full border-2 border-gray-200 px-4 py-3.5 text-[13px] font-semibold text-gray-900 outline-none focus:border-black transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[13px] font-bold text-gray-900 mb-2">Role</label>
                    <input type="text" defaultValue="Frontend Developer" className="w-full border-2 border-gray-200 px-4 py-3.5 text-[13px] font-semibold text-gray-900 outline-none focus:border-black transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-gray-900 mb-2">Location</label>
                    <input type="text" defaultValue="Ho Chi Minh City, Vietnam" className="w-full border-2 border-gray-200 px-4 py-3.5 text-[13px] font-semibold text-gray-900 outline-none focus:border-black transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-gray-900 mb-2">Bio</label>
                  <textarea rows={4} defaultValue="Passionate frontend developer focused on building intuitive user interfaces." className="w-full border-2 border-gray-200 px-4 py-3.5 text-[13px] font-semibold text-gray-900 outline-none focus:border-black transition-colors resize-none" />
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-3.5 text-[13px] font-bold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-3.5 text-[13px] font-bold text-white bg-black hover:bg-gray-800 transition-colors">
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Modal */}
      {isPortfolioOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-[520px] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-extrabold text-gray-900">Portfolio & Profiles</h2>
              <button onClick={() => setIsPortfolioOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto">
              <div>
                <label className="block text-[13px] font-bold text-gray-900 mb-2">Resume / CV</label>
                <div className="border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors p-8 flex flex-col items-center justify-center cursor-pointer group">
                  <div className="w-12 h-12 bg-white flex items-center justify-center shadow-sm mb-3 group-hover:scale-105 transition-transform border border-gray-100">
                    <Upload className="w-5 h-5 text-black" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">Click to upload or drag and drop</span>
                  <span className="text-xs font-semibold text-gray-500 mt-1">PDF, DOCX (Max 5MB)</span>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-900 mb-2">GitHub Profile</label>
                <input type="text" placeholder="https://github.com/username" className="w-full border-2 border-gray-200 px-4 py-3.5 text-[13px] font-semibold text-gray-900 outline-none focus:border-black placeholder:text-gray-400 transition-colors" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-900 mb-2">LinkedIn Profile</label>
                <input type="text" placeholder="https://linkedin.com/in/username" className="w-full border-2 border-gray-200 px-4 py-3.5 text-[13px] font-semibold text-gray-900 outline-none focus:border-black placeholder:text-gray-400 transition-colors" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-900 mb-2">Personal Website</label>
                <input type="text" placeholder="https://your-website.com" className="w-full border-2 border-gray-200 px-4 py-3.5 text-[13px] font-semibold text-gray-900 outline-none focus:border-black placeholder:text-gray-400 transition-colors" />
              </div>
            </div>
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsPortfolioOpen(false)} className="px-6 py-3.5 text-[13px] font-bold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={() => setIsPortfolioOpen(false)} className="px-6 py-3.5 text-[13px] font-bold text-white bg-black hover:bg-gray-800 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
