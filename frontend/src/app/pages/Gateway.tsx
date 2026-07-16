import { Hexagon, LogOut, Users, UserPlus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuthStore } from "../stores/auth.store";

export function Gateway() {
  const navigate = useNavigate();
  const clearTokens = useAuthStore((state) => state.clearTokens);

  const handleLogout = () => {
    clearTokens();
    navigate("/login");
  };

  const handleJoinTeam = async () => {
    const { value: inviteLink } = await Swal.fire({
      title: "Join an Existing Team",
      input: "text",
      inputLabel: "Enter the invitation link provided by your Team Leader",
      inputPlaceholder: "https://seal.cosplane.io.vn/invite/...",
      showCancelButton: true,
      confirmButtonText: "Join Team",
      confirmButtonColor: "#2563eb",
    });

    if (inviteLink) {
      // Gọi API join team ở đây, tạm thời cho Navigate tới dashboard player
      Swal.fire("Success", "You have joined the team!", "success").then(() => {
        navigate("/player");
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Hexagon className="w-8 h-8 text-blue-600" strokeWidth={2.5} />
          <span className="font-black text-xl tracking-tight">
            SEAL Hackathon
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-16 animate-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
            Welcome to the Arena
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            You are successfully authenticated. How would you like to start your
            journey?
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl justify-center">
          {/* Create Team Card */}
          <div className="flex-1 bg-white rounded-3xl border border-slate-200 p-10 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 group flex flex-col">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Users size={32} />
            </div>
            <h2 className="text-2xl font-black mb-3 text-slate-800">
              Create a New Team
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed mb-10 flex-1">
              Become a Team Leader, choose your preferred track, and invite
              other talented participants to join you.
            </p>
            <button
              onClick={() => navigate("/player")}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
            >
              Start Leading <ArrowRight size={18} />
            </button>
          </div>

          {/* Join Team Card */}
          <div className="flex-1 bg-white rounded-3xl border border-slate-200 p-10 hover:shadow-2xl hover:border-amber-200 transition-all duration-300 group flex flex-col">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <UserPlus size={32} />
            </div>
            <h2 className="text-2xl font-black mb-3 text-slate-800">
              Join an Existing Team
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed mb-10 flex-1">
              Received an invitation link from a Team Leader? Click below to
              enter the code and join forces with them.
            </p>
            <button
              onClick={handleJoinTeam}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-4 px-6 rounded-xl hover:bg-slate-800 transition-colors shadow-md shadow-slate-200"
            >
              Enter Invite Code <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
