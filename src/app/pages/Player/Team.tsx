import { Link, UserPlus, User, CheckCircle2, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { ConfirmModal } from "../../components/leaderPage/ConfirmModal";
import { teamApi } from "../../lib/api/teamApi";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../../stores/auth.store";

const unwrapData = (value: any) => value?.data ?? value;

const getTeamId = (team: any) => {
  return team?.teamId || team?.teamID || team?.id || "";
};

const getMembers = (team: any): any[] => {
  return team?.members || team?.teamMembers || team?.players || [];
};

const getMemberPlayerId = (member: any) => {
  return (
    member?.playerId ||
    member?.PlayerId ||
    member?.playerID ||
    member?.PlayerID ||
    member?.memberPlayerId ||
    member?.MemberPlayerId ||
    member?.memberPlayerID ||
    member?.MemberPlayerID ||
    member?.memberId ||
    member?.MemberId ||
    member?.memberID ||
    member?.MemberID ||
    member?.userId ||
    member?.UserId ||
    member?.userID ||
    member?.UserID ||
    member?.player?.playerId ||
    member?.player?.PlayerId ||
    member?.player?.playerID ||
    member?.player?.PlayerID ||
    member?.id ||
    member?.ID ||
    ""
  );
};

const getMemberEmail = (member: any) => {
  return (
    member?.email ||
    member?.Email ||
    member?.player?.email ||
    member?.player?.Email ||
    ""
  );
};

const getMemberName = (member: any) => {
  return (
    member?.fullName ||
    member?.FullName ||
    member?.name ||
    member?.Name ||
    member?.playerName ||
    member?.PlayerName ||
    member?.email ||
    member?.Email ||
    member?.player?.fullName ||
    member?.player?.FullName ||
    member?.player?.name ||
    member?.player?.Name ||
    member?.player?.email ||
    member?.player?.Email ||
    ""
  );
};

const getMemberRole = (member: any) => {
  return member?.role || member?.teamRole || member?.position || "Member";
};

const isCurrentUserMember = (member: any) => {
  return (
    member?.isCurrentUser === true ||
    member?.isMe === true ||
    member?.currentUser === true
  );
};

const isLeaderTeam = (team: any) => {
  const rawRole = String(
    team?.role || team?.teamRole || team?.memberRole || team?.position || "",
  ).toLowerCase();

  return (
    team?.isLeader === true ||
    team?.isLeader === 1 ||
    team?.leader === true ||
    team?.isTeamLeader === true ||
    rawRole === "leader" ||
    rawRole === "team leader" ||
    rawRole === "teamleader"
  );
};

const getInitials = (name: string) => {
  const words = name.trim().split(" ").filter(Boolean);

  if (words.length === 0) return "?";

  return words
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const normalizeList = (value: any): any[] => {
  const data = unwrapData(value);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;

  return [];
};

const getCurrentTeamFromHistory = (history: any[]) => {
  return (
    history.find((item) => item?.isActive === true) ||
    history.find((item) => item?.status !== "Deleted") ||
    history[0] ||
    null
  );
};

const extractTeamIdFromJoinInput = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) return "";

  const parts = trimmed.split("/");
  const lastPart = parts[parts.length - 1];

  return lastPart || trimmed;
};

const getCurrentUserFromToken = (accessToken?: string | null) => {
  if (!accessToken) {
    return {
      displayName: "Bạn",
      email: "",
      playerId: "",
    };
  }

  try {
    const decoded: any = jwtDecode(accessToken);

    const displayName =
      decoded?.fullName ||
      decoded?.FullName ||
      decoded?.name ||
      decoded?.Name ||
      decoded?.email ||
      decoded?.Email ||
      "Bạn";

    const playerId =
      decoded?.playerId ||
      decoded?.PlayerId ||
      decoded?.playerID ||
      decoded?.PlayerID ||
      decoded?.sub ||
      "";

    return {
      displayName,
      email: decoded?.email || decoded?.Email || "",
      playerId,
    };
  } catch {
    return {
      displayName: "Bạn",
      email: "",
      playerId: "",
    };
  }
};

const sameValue = (a?: any, b?: any) => {
  if (!a || !b) return false;
  return String(a).toLowerCase() === String(b).toLowerCase();
};

const isSelfMember = (
  member: any,
  index: number,
  currentUserInfo: {
    displayName: string;
    email: string;
    playerId: string;
  },
  currentUserIsLeader: boolean,
) => {
  // Nếu account hiện tại là leader, tạm coi dòng đầu tiên là chính leader.
  // Vì backend hiện đang trả members thiếu fullName/playerId/isCurrentUser.
  if (currentUserIsLeader && index === 0) return true;

  return (
    isCurrentUserMember(member) ||
    sameValue(getMemberPlayerId(member), currentUserInfo.playerId) ||
    sameValue(getMemberEmail(member), currentUserInfo.email)
  );
};

const resolveMemberName = (
  member: any,
  index: number,
  isSelf: boolean,
  currentUserInfo: {
    displayName: string;
    email: string;
    playerId: string;
  },
) => {
  const rawName = String(getMemberName(member) || "").trim();

  const isMissingName =
    !rawName ||
    rawName === "Không có tên" ||
    rawName.toLowerCase() === "unknown" ||
    rawName.toLowerCase() === "null" ||
    rawName.toLowerCase() === "undefined";

  if (!isMissingName) return rawName;

  if (isSelf) {
    return currentUserInfo.displayName || currentUserInfo.email || "Bạn";
  }

  return `Member ${index + 1}`;
};

const resolveMemberRole = (
  member: any,
  index: number,
  currentUserIsLeader: boolean,
  isSelf: boolean,
) => {
  const rawRole = String(getMemberRole(member)).toLowerCase();

  if (
    rawRole === "leader" ||
    rawRole === "team leader" ||
    rawRole === "teamleader"
  ) {
    return "Team Leader";
  }

  if (currentUserIsLeader && index === 0) return "Team Leader";

  if (isSelf && currentUserIsLeader) return "Team Leader";

  return "Member";
};

export function Team() {
  const [team, setTeam] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const [teamName, setTeamName] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const [joinInput, setJoinInput] = useState("");
  const [isJoiningTeam, setIsJoiningTeam] = useState(false);

  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUserInfo = getCurrentUserFromToken(accessToken);

  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "",
    onConfirm: () => {},
  });

  const fetchMyTeam = async () => {
    try {
      setIsLoading(true);

      const historyResponse = await teamApi.getMyTeamsHistory();
      const teamHistory = normalizeList(historyResponse);
      const currentTeam = getCurrentTeamFromHistory(teamHistory);

      if (!currentTeam) {
        setTeam(null);
        return;
      }

      const currentTeamId = getTeamId(currentTeam);

      if (!currentTeamId) {
        setTeam(currentTeam);
        return;
      }

      try {
        const membersResponse = await teamApi.getTeamMembers(currentTeamId);
        const members = normalizeList(membersResponse);

        console.log("TEAM HISTORY:", teamHistory);
        console.log("CURRENT TEAM:", currentTeam);
        console.log("TEAM MEMBERS RAW:", membersResponse);
        console.log("TEAM MEMBERS NORMALIZED:", members);

        setTeam({
          ...currentTeam,
          members,
        });
      } catch (memberError) {
        console.warn(
          "Không lấy được members, vẫn render team history:",
          memberError,
        );
        setTeam(currentTeam);
      }
    } catch (error: any) {
      console.error("Load my team failed:", error);

      Swal.fire({
        icon: "error",
        title: "Không tải được team",
        text:
          error.response?.data?.message ||
          error.response?.data ||
          "Không thể lấy thông tin team hiện tại.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTeam();
  }, []);

  const teamId = getTeamId(team);
  const teamMembers = getMembers(team);
  const maxMembers = Number(team?.maxMembers || team?.maxMember || 5);
  const emptySlots = Math.max(0, maxMembers - teamMembers.length);
  const currentUserIsLeader = isLeaderTeam(team);

  const inviteLink =
    team?.inviteLink ||
    team?.joinLink ||
    team?.link ||
    (teamId ? `${window.location.origin}/team/join/${teamId}` : "");

  const handleCopy = async () => {
    if (!inviteLink) {
      Swal.fire({
        icon: "warning",
        title: "Chưa có link mời",
        text: "Backend chưa trả invite link hoặc teamId.",
      });
      return;
    }

    await navigator.clipboard.writeText(inviteLink);

    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu tên team",
        text: "Vui lòng nhập tên team trước khi tạo.",
      });
      return;
    }

    try {
      setIsCreatingTeam(true);

      console.log("Tạo team với payload:", {
        teamName: teamName.trim(),
      });

      await teamApi.createTeam({
        teamName: teamName.trim(),
      });

      Swal.fire({
        icon: "success",
        title: "Tạo team thành công",
        text: "Bạn hiện là Team Leader. Hãy qua Dashboard để chọn Event / Track / Topic.",
      });

      setTeamName("");
      await fetchMyTeam();

      window.dispatchEvent(new Event("player-team-updated"));
    } catch (error: any) {
      console.error("Create team failed full error:", error);
      console.error("Create team status:", error.response?.status);
      console.error("Create team response data:", error.response?.data);

      const rawError = error.response?.data;

      const errorMessage =
        typeof rawError === "string"
          ? rawError
          : rawError?.message || rawError?.title || rawError?.errors
            ? JSON.stringify(rawError?.errors || rawError, null, 2)
            : "Backend từ chối tạo team.";

      Swal.fire({
        icon: "error",
        title: "Không tạo được team",
        html: `<pre style="white-space:pre-wrap;text-align:left;font-size:12px">${errorMessage}</pre>`,
      });
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleJoinTeam = async () => {
    const teamIdToJoin = extractTeamIdFromJoinInput(joinInput);

    if (!teamIdToJoin) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu teamId hoặc link mời",
        text: "Vui lòng nhập teamId hoặc paste link mời của team.",
      });
      return;
    }

    try {
      setIsJoiningTeam(true);

      await teamApi.joinViaLink(teamIdToJoin);

      Swal.fire({
        icon: "success",
        title: "Join team thành công",
        text: "Bạn đã tham gia team với vai trò Team Member.",
      });

      setJoinInput("");
      await fetchMyTeam();

      window.dispatchEvent(new Event("player-team-updated"));
    } catch (error: any) {
      console.error("Join team failed:", error);

      Swal.fire({
        icon: "error",
        title: "Không join được team",
        text:
          error.response?.data?.message ||
          error.response?.data ||
          "Backend từ chối thao tác join team.",
      });
    } finally {
      setIsJoiningTeam(false);
    }
  };

  const confirmRemoveMember = async (memberPlayerId: string) => {
    try {
      if (!teamId) {
        Swal.fire(
          "Thiếu teamId",
          "Không xác định được team hiện tại.",
          "error",
        );
        return;
      }

      if (!memberPlayerId) {
        Swal.fire(
          "Thiếu memberPlayerId",
          "Không xác định được member cần xóa.",
          "error",
        );
        return;
      }

      await teamApi.kickMember(teamId, memberPlayerId);

      setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      await fetchMyTeam();

      Swal.fire({
        icon: "success",
        title: "Đã kick member",
        text: "Member đã được xóa khỏi team.",
      });
    } catch (error: any) {
      console.error("Kick member failed:", error);

      Swal.fire({
        icon: "error",
        title: "Không thể kick member",
        text:
          error.response?.data?.message ||
          error.response?.data ||
          "Backend từ chối thao tác này.",
      });
    }
  };

  const handleRemoveMember = (memberPlayerId: string, memberName: string) => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Kick Team Member",
      description: `Bạn có chắc muốn kick ${memberName} khỏi team không?`,
      confirmText: "Kick Member",
      onConfirm: () => {
        void confirmRemoveMember(memberPlayerId);
      },
    });
  };

  const confirmLeaveTeam = async () => {
    try {
      if (!teamId) {
        Swal.fire(
          "Thiếu teamId",
          "Không xác định được team hiện tại.",
          "error",
        );
        return;
      }

      await teamApi.leaveTeam(teamId);

      setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      setTeam(null);

      window.dispatchEvent(new Event("player-team-updated"));

      Swal.fire({
        icon: "success",
        title: "Đã rời team",
        text: "Bạn đã rời khỏi team hiện tại.",
      });
    } catch (error: any) {
      console.error("Leave team failed:", error);

      Swal.fire({
        icon: "error",
        title: "Không thể rời team",
        text:
          error.response?.data?.message ||
          error.response?.data ||
          "Backend từ chối thao tác rời team.",
      });
    }
  };

  const handleLeaveTeam = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Leave Team",
      description: "Bạn có chắc muốn rời khỏi team này không?",
      confirmText: "Leave Team",
      onConfirm: () => {
        void confirmLeaveTeam();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-500 max-w-4xl">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            My Team
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Đang tải thông tin team...
          </p>
        </header>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="animate-in fade-in duration-500 max-w-5xl">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            My Team
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Bạn chưa có team. Bạn có thể tạo team mới để trở thành Team Leader,
            hoặc join team có sẵn với vai trò Team Member.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white border border-gray-200 rounded-radius-lg p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Create a new team
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Người tạo team sẽ trở thành Team Leader. Sau đó bạn mới có quyền
                chọn Event / Track / Topic và Submit Project.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                Team name
              </label>

              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Ví dụ: Tech Wizards"
                className="w-full px-4 py-3 border border-gray-200 rounded-radius-md outline-none focus:border-black"
              />
            </div>

            <button
              type="button"
              onClick={handleCreateTeam}
              disabled={isCreatingTeam}
              className="w-full px-6 py-3 bg-black text-white rounded-radius-md font-bold disabled:opacity-50"
            >
              {isCreatingTeam ? "Đang tạo team..." : "+ Create Team"}
            </button>

            <p className="text-xs text-gray-500 leading-relaxed">
              Sau khi tạo team thành công, Sidebar sẽ hiện thêm nút Submit
              Project vì lúc này bạn là Team Leader.
            </p>
          </section>

          <section className="bg-white border border-gray-200 rounded-radius-lg p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Join existing team
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Join team bằng teamId hoặc link mời. Người join team sẽ là Team
                Member.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                Team invite link / teamId
              </label>

              <input
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                placeholder="Paste invite link hoặc teamId"
                className="w-full px-4 py-3 border border-gray-200 rounded-radius-md outline-none focus:border-black"
              />
            </div>

            <button
              type="button"
              onClick={handleJoinTeam}
              disabled={isJoiningTeam}
              className="w-full px-6 py-3 bg-white text-black border border-black rounded-radius-md font-bold disabled:opacity-50 hover:bg-gray-50"
            >
              {isJoiningTeam ? "Đang join team..." : "Join Team"}
            </button>

            <p className="text-xs text-gray-500 leading-relaxed">
              Sau khi join team, bạn vẫn là Team Member nên Sidebar sẽ không
              hiện Submit Project.
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          My Team
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Quản lý team hiện tại của bạn.
        </p>
      </header>

      <div className="space-y-8">
        <section className="bg-card border border-border rounded-radius-lg p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
          <div className="flex-1 w-full space-y-2">
            <label
              htmlFor="invite-link"
              className="text-sm font-medium text-foreground"
            >
              Invite teammates
            </label>

            <div className="flex w-full">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Link className="w-4 h-4 text-muted-foreground" />
                </div>

                <input
                  type="text"
                  id="invite-link"
                  className="bg-input-background border-none text-foreground text-sm rounded-l-radius-md block w-full pl-10 p-3 outline-none focus:ring-2 focus:ring-ring focus:ring-inset"
                  value={inviteLink || "Backend chưa trả invite link"}
                  readOnly
                />
              </div>

              <button
                onClick={handleCopy}
                className="bg-primary text-primary-foreground px-4 py-3 text-sm font-medium rounded-r-radius-md hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
              >
                {isCopied ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {isCopied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            <p className="text-xs text-muted-foreground font-medium">
              Note: link này dùng teamId để member join. Nếu backend trả
              inviteLink riêng thì UI sẽ ưu tiên dùng link backend.
            </p>
          </div>
        </section>

        {!currentUserIsLeader && (
          <section className="bg-white border border-border rounded-radius-lg p-6 shadow-sm flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-lg text-foreground">
                Team Member Mode
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Bạn đang là member của team này. Bạn không thể kick thành viên
                khác, nhưng có thể tự rời team.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLeaveTeam}
              className="px-4 py-3 text-sm font-bold text-red-600 border border-red-200 rounded-radius-md hover:bg-red-50 transition-colors whitespace-nowrap"
            >
              Leave Team
            </button>
          </section>
        )}

        <section className="bg-card border border-border rounded-radius-lg overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
            <div>
              <h2 className="font-bold text-lg">Team Roster</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {team?.teamName || team?.name || "Team hiện tại"}
              </p>
            </div>

            <span className="text-sm font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
              {teamMembers.length} / {maxMembers} Members
            </span>
          </div>

          <div className="divide-y divide-border">
            {teamMembers.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground font-medium">
                Backend chưa trả danh sách member.
              </div>
            ) : (
              teamMembers.map((member: any, index: number) => {
                const self = isSelfMember(
                  member,
                  index,
                  currentUserInfo,
                  currentUserIsLeader,
                );

                const memberPlayerId = String(getMemberPlayerId(member) || "");

                const memberName = resolveMemberName(
                  member,
                  index,
                  self,
                  currentUserInfo,
                );

                const memberRole = resolveMemberRole(
                  member,
                  index,
                  currentUserIsLeader,
                  self,
                );

                const canKickThisMember =
                  currentUserIsLeader && !self && Boolean(memberPlayerId);

                return (
                  <div
                    key={memberPlayerId || `${memberName}-${index}`}
                    className="p-4 sm:p-6 flex items-center justify-between hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                        {getInitials(memberName)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-lg">
                            {memberName}
                          </span>

                          {self && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sidebar-accent text-sidebar-accent-foreground border border-border">
                              You
                            </span>
                          )}
                        </div>

                        <span
                          className={`text-sm font-medium ${
                            memberRole === "Team Leader"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {memberRole}
                        </span>
                      </div>
                    </div>

                    {self ? (
                      currentUserIsLeader ? (
                        <span className="text-sm font-medium text-muted-foreground px-3 py-2">
                          Leader
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleLeaveTeam}
                          className="text-sm font-medium text-red-600 hover:bg-red-50 transition-colors px-3 py-2 rounded-radius-md"
                        >
                          Leave Team
                        </button>
                      )
                    ) : canKickThisMember ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveMember(memberPlayerId, memberName)
                        }
                        className="text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors px-3 py-2 rounded-radius-md"
                      >
                        Kick
                      </button>
                    ) : currentUserIsLeader && !memberPlayerId ? (
                      <span className="text-sm font-medium text-muted-foreground px-3 py-2">
                        Cannot kick
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground px-3 py-2">
                        Member
                      </span>
                    )}
                  </div>
                );
              })
            )}

            {Array.from({ length: emptySlots }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="p-4 sm:p-6 flex items-center justify-between bg-muted/5 border-dashed border-t border-border/50"
              >
                <div className="flex items-center gap-4 opacity-50">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground/50">
                    <User className="w-5 h-5" />
                  </div>

                  <div>
                    <span className="font-medium text-muted-foreground italic">
                      Empty Slot
                    </span>
                    <p className="text-sm text-muted-foreground/70">
                      Waiting for member to join...
                    </p>
                  </div>
                </div>

                {currentUserIsLeader ? (
                  <button
                    onClick={handleCopy}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite
                  </button>
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    Waiting
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() =>
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        description={confirmModalConfig.description}
        confirmText={confirmModalConfig.confirmText}
        isDestructive
      />
    </div>
  );
}
