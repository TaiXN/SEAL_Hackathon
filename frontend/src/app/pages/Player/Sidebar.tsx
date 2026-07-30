import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  LayoutDashboard,
  Users,
  LogOut,
  Hexagon,
  UploadCloud,
} from "lucide-react";
import { useAuthStore } from "../../stores/auth.store";
import { teamApi } from "../../lib/api/teamApi";
import {
  normalizeList,
  getCurrentTeamFromHistory,
  getTeamId,
  isLeaderTeam,
} from "../../lib/utils/teamHelpers";

export function Sidebar() {
  const navigate = useNavigate();
  const clearTokens = useAuthStore((state) => state.clearTokens);

  const [canSubmitProject, setCanSubmitProject] = useState(false);
  const [teamHistory, setTeamHistory] = useState<any[]>([]);
  const [activeTeamId, setActiveTeamId] = useState("");
  const [teamsOpen, setTeamsOpen] = useState(true);

  const fetchPlayerTeamRole = async () => {
    try {
      const response = await teamApi.getMyTeamsHistory();
      const history = normalizeList(response);
      setTeamHistory(history);

      const currentTeam = getCurrentTeamFromHistory(history);
      setActiveTeamId(getTeamId(currentTeam));

      setCanSubmitProject(Boolean(currentTeam && isLeaderTeam(currentTeam)));
    } catch (error) {
      console.warn("Không lấy được quyền team của player:", error);
      setTeamHistory([]);
      setActiveTeamId("");
      setCanSubmitProject(false);
    }
  };

  useEffect(() => {
    fetchPlayerTeamRole();

    const handler = () => {
      fetchPlayerTeamRole();
    };

    window.addEventListener("player-team-updated", handler);

    return () => {
      window.removeEventListener("player-team-updated", handler);
    };
  }, []);

  const handleLogout = () => {
    clearTokens();
    navigate("/login", { replace: true });
  };

  const handleSelectTeam = (team: any) => {
    const nextTeamId = getTeamId(team);
    if (!nextTeamId || nextTeamId === activeTeamId) return;

    localStorage.setItem("activeTeamId", nextTeamId);
    setActiveTeamId(nextTeamId);
    setCanSubmitProject(isLeaderTeam(team));
    window.dispatchEvent(new Event("player-team-updated"));
  };

  const getTeamName = (team: any) =>
    String(team?.teamName || team?.TeamName || team?.name || "Unnamed Team");

  return (
    <aside className="w-[280px] min-h-screen self-stretch bg-white border-r border-slate-200 flex flex-col shrink-0 relative z-30 shadow-[12px_0_30px_rgba(15,23,42,0.04)]">
      <div className="h-24 flex items-center px-7 shrink-0 border-b border-slate-100">
        <div className="w-11 h-11 rounded-xl bg-[#f26f21] text-white flex items-center justify-center mr-3 shrink-0 shadow-sm">
          <Hexagon className="w-6 h-6 fill-white" />
        </div>

        <div className="flex flex-col">
          <span className="font-extrabold text-xl tracking-tight text-slate-950 leading-none">
            FPT Hackathon
          </span>
          <span className="text-[10px] font-bold text-[#f26f21] mt-1 uppercase tracking-widest">
            {canSubmitProject ? "Team Leader" : "Team Member"}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-5">
        <NavLink
          to="/player"
          end
          className={({ isActive }) =>
            `flex items-center px-4 py-3.5 text-[15px] font-bold transition-all rounded-lg ${
              isActive
                ? "bg-[#f26f21] text-white shadow-sm"
                : "text-slate-500 hover:bg-orange-50 hover:text-[#c2410c]"
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mr-3" strokeWidth={2.5} />
          Dashboard
        </NavLink>

        <div>
          <div className="flex">
            <NavLink
              to="/player/team"
              onClick={() => setTeamsOpen(true)}
              className={({ isActive }) =>
                `flex min-w-0 flex-1 items-center px-4 py-3.5 text-[15px] font-bold transition-all rounded-l-lg ${
                  isActive
                    ? "bg-[#f26f21] text-white shadow-sm"
                    : "text-slate-500 hover:bg-orange-50 hover:text-[#c2410c]"
                }`
              }
            >
              <Users className="w-5 h-5 mr-3 shrink-0" strokeWidth={2.5} />
              <span className="truncate">My Team</span>
            </NavLink>

            {teamHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setTeamsOpen((open) => !open)}
                className="w-12 flex items-center justify-center text-slate-500 hover:bg-orange-50 hover:text-[#c2410c] transition-colors rounded-r-lg"
                aria-label={teamsOpen ? "Collapse teams" : "Expand teams"}
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    teamsOpen ? "rotate-180" : ""
                  }`}
                  strokeWidth={2.5}
                />
              </button>
            )}
          </div>

          {teamHistory.length > 0 && teamsOpen && (
            <div className="ml-8 mt-2 space-y-1 max-h-48 overflow-y-auto pr-1 border-l border-orange-100 pl-3">
              {teamHistory.map((team) => {
                const itemTeamId = getTeamId(team);
                const isActive = itemTeamId && itemTeamId === activeTeamId;

                return (
                  <button
                    type="button"
                    key={itemTeamId || getTeamName(team)}
                    onClick={() => handleSelectTeam(team)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-bold transition-colors rounded-md ${
                      isActive
                        ? "bg-[#0b7a3b] text-white"
                        : "text-slate-500 hover:bg-emerald-50 hover:text-[#0b7a3b]"
                    }`}
                    title={getTeamName(team)}
                  >
                    <span className="truncate">{getTeamName(team)}</span>
                    <span
                      className={`text-[9px] uppercase tracking-wider shrink-0 ${
                        isActive ? "text-white/70" : "text-gray-400"
                      }`}
                    >
                      {isLeaderTeam(team) ? "Lead" : "Mem"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {canSubmitProject && (
          <NavLink
            to="/player/submit"
            className={({ isActive }) =>
              `flex items-center px-4 py-3.5 text-[15px] font-bold transition-all rounded-lg ${
                isActive
                  ? "bg-[#f26f21] text-white shadow-sm"
                  : "text-slate-500 hover:bg-orange-50 hover:text-[#c2410c]"
              }`
            }
          >
            <UploadCloud className="w-5 h-5 mr-3" strokeWidth={2.5} />
            Submit Project
          </NavLink>
        )}
      </nav>

      <div className="shrink-0 px-4 pb-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3.5 text-[15px] font-bold text-[#e03131] hover:bg-red-50 transition-colors text-left rounded-lg"
        >
          <LogOut className="w-5 h-5 mr-3" strokeWidth={2.5} />
          Logout
        </button>
      </div>
    </aside>
  );
}
