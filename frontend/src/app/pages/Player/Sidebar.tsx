import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
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
    <aside className="w-[280px] bg-white border-r border-gray-200 flex flex-col h-full shrink-0 relative z-30">
      <div className="h-24 flex items-center px-8 shrink-0">
        <Hexagon className="w-7 h-7 text-black fill-black mr-3 shrink-0" />

        <div className="flex flex-col">
          <span className="font-extrabold text-2xl tracking-tighter text-black leading-none">
            Hackathon
          </span>
          <span className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
            {canSubmitProject ? "Team Leader" : "Team Member"}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        <NavLink
          to="/player"
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
          to="/player/team"
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

        {canSubmitProject && (
          <NavLink
            to="/player/submit"
            className={({ isActive }) =>
              `flex items-center px-4 py-3.5 text-[15px] font-bold transition-all ${
                isActive
                  ? "bg-black text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <UploadCloud className="w-5 h-5 mr-3" strokeWidth={2.5} />
            Submit Project
          </NavLink>
        )}
      </nav>

      {teamHistory.length > 0 && (
        <div className="px-4 pb-4">
          <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Teams
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {teamHistory.map((team) => {
              const itemTeamId = getTeamId(team);
              const isActive = itemTeamId && itemTeamId === activeTeamId;

              return (
                <button
                  type="button"
                  key={itemTeamId || getTeamName(team)}
                  onClick={() => handleSelectTeam(team)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-bold transition-colors ${
                    isActive
                      ? "bg-black text-white"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
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
        </div>
      )}

      <div className="shrink-0 px-4 pb-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3.5 text-[15px] font-bold text-[#e03131] hover:bg-red-50 transition-colors text-left"
        >
          <LogOut className="w-5 h-5 mr-3" strokeWidth={2.5} />
          Logout
        </button>
      </div>
    </aside>
  );
}
