import { Link, UserPlus, User, CheckCircle2, Copy, Edit2 } from "lucide-react";
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
    member?.student?.studentId ||
    member?.student?.StudentID ||
    member?.student?.id ||
    member?.account?.accountId ||
    member?.account?.id ||
    member?.studentId ||
    member?.studentID ||
    member?.StudentID ||
    member?.playerId ||
    member?.PlayerId ||
    member?.playerID ||
    member?.PlayerID ||
    member?.memberPlayerId ||
    member?.MemberPlayerId ||
    member?.memberId ||
    member?.MemberId ||
    member?.id ||
    member?.ID ||
    ""
  );
};

const getMemberEmail = (member: any) => {
  return (
    member?.studentEmail || // Thêm cái này
    member?.account?.email || // Dự phòng
    member?.email ||
    member?.Email ||
    member?.player?.email ||
    member?.player?.Email ||
    ""
  );
};

const getMemberName = (member: any) => {
  if (member?.student?.account?.fullName)
    return member.student.account.fullName;
  if (member?.student?.fullName) return member.student.fullName;
  if (member?.account?.fullName) return member.account.fullName;
  return (
    member?.studentName ||
    member?.fullName ||
    member?.FullName ||
    member?.name ||
    member?.Name ||
    ""
  );
};

const isLeaderMember = (member: any) => {
  if (
    member?.isLeader === true ||
    member?.IsLeader === true ||
    member?.isLeader === 1 ||
    member?.IsLeader === 1
  ) {
    return true;
  }

  // Đề phòng Backend trả về role dạng chuỗi
  const role = String(
    member?.role || member?.teamRole || member?.memberRole || "",
  ).toLowerCase();

  return role === "leader" || role === "team leader" || role === "teamleader";
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
  if (!accessToken) return { displayName: "Bạn", email: "", playerId: "" };

  try {
    const decoded: any = jwtDecode(accessToken);
    const displayName =
      decoded?.fullName || decoded?.name || decoded?.email || "Bạn";

    // Phải thêm cái "sớ" nameidentifier của C# này vào thì mới moi được ID ra
    const playerId =
      decoded?.[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ] ||
      decoded?.studentId ||
      decoded?.StudentId ||
      decoded?.playerId ||
      decoded?.sub ||
      "";

    return {
      displayName,
      email: decoded?.email || decoded?.Email || "",
      playerId,
    };
  } catch {
    return { displayName: "Bạn", email: "", playerId: "" };
  }
};

const sameValue = (a?: any, b?: any) => {
  if (!a || !b) return false;
  return String(a).toLowerCase() === String(b).toLowerCase();
};

const isSelfMember = (
  member: any,
  index: number,
  currentUserInfo: { displayName: string; email: string; playerId: string },
  currentUserIsLeader: boolean,
) => {
  // ĐÃ XÓA DÒNG NHẬN VƠ INDEX 0. Giờ so sánh bằng thực lực ID!
  const memberId = String(getMemberPlayerId(member) || "");
  const myId = String(currentUserInfo.playerId || "");

  // Nếu ID quét được khớp với ID trong Token thì người đó 100% là You
  return memberId && myId && memberId.toLowerCase() === myId.toLowerCase();
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
  // THÊM ƯU TIÊN LẤY EMAIL VÀO ĐÂY ĐỂ HIỆN LÊN BẢNG THÔNG BÁO CHO ĐẸP
  const rawName = String(
    getMemberName(member) || getMemberEmail(member) || "",
  ).trim();

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

  // Đổi thành "Thành viên" cho đồng bộ với tiếng Việt ở ngoài
  return `Thành viên ${index + 1}`;
};

const resolveMemberRole = (
  member: any,
  index: number,
  currentUserIsLeader: boolean,
  isSelf: boolean,
) => {
  // Dùng chung 1 logic duy nhất với cái Vương miện, không đoán bừa vị trí index === 0 nữa!
  if (isLeaderMember(member)) {
    return "Team Leader";
  }

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

  const handleRenameTeam = async () => {
    const currentName = team?.teamName || team?.name || "";

    const { value: newName } = await Swal.fire({
      title: "Đổi tên Team",
      input: "text",
      inputLabel: "Nhập tên mới cho team của bạn",
      inputValue: currentName,
      showCancelButton: true,
      confirmButtonText: "Lưu thay đổi",
      cancelButtonText: "Hủy",
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return "Tên team không được để trống!";
        }
      },
    });

    if (newName && newName.trim() !== currentName) {
      try {
        await teamApi.updateTeamInfo(teamId, { teamName: newName.trim() });
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Tên team đã được cập nhật!",
        });
        await fetchMyTeam(); // Load lại data
        window.dispatchEvent(new Event("player-team-updated")); // Cập nhật luôn tên bên Sidebar
      } catch (error: any) {
        console.error("Rename failed:", error);
        Swal.fire({
          icon: "error",
          title: "Không thể đổi tên",
          text:
            error.response?.data?.message || "Backend từ chối thao tác này.",
        });
      }
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

  const confirmTransferLeader = async (newLeaderPlayerId: string) => {
    try {
      if (!teamId) return;
      await teamApi.transferLeader(teamId, newLeaderPlayerId);

      setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      await fetchMyTeam();

      Swal.fire({
        icon: "success",
        title: "Nhường chức thành công",
        text: "Bạn đã chuyển quyền Team Leader cho người này. Hiện tại bạn là Team Member.",
      });
      window.dispatchEvent(new Event("player-team-updated"));
    } catch (error: any) {
      console.error("Transfer leader failed:", error);
      Swal.fire({
        icon: "error",
        title: "Không thể nhường chức",
        text: error.response?.data?.message || "Backend từ chối thao tác này.",
      });
    }
  };

  const handleTransferClick = (memberPlayerId: string, memberName: string) => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Nhường chức Team Leader",
      description: `Bạn có chắc muốn nhường chức Team Leader cho ${memberName} không? Bạn sẽ mất quyền quản lý Team.`,
      confirmText: "Xác nhận nhường chức",
      onConfirm: () => {
        void confirmTransferLeader(memberPlayerId);
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
          Manage your team here. You can invite teammates, kick members, or
          transfer leadership if you are the Team Leader.
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

            <p className="text-xs text-muted-foreground font-medium"></p>
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
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground">
                  {team?.teamName || team?.name || "Team hiện tại"}
                </p>
                {/* Nút sửa tên chỉ hiện cho Leader */}
                {currentUserIsLeader && (
                  <button
                    onClick={handleRenameTeam}
                    className="p-1 text-slate-400 hover:text-slate-800 transition-colors rounded-md hover:bg-slate-100"
                    title="Đổi tên team"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
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
                  !!self,
                  currentUserInfo,
                );

                const memberRole = resolveMemberRole(
                  member,
                  index,
                  currentUserIsLeader,
                  !!self,
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
                            {/* Ưu tiên 1: Tên | Ưu tiên 2: Email | Cuối cùng: Thành viên X */}
                            {getMemberName(member) ||
                              getMemberEmail(member) ||
                              `Thành viên ${index + 1}`}
                          </span>

                          {isLeaderMember(member) && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                              Leader
                            </span>
                          )}

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

                    {/* BẮT ĐẦU VÙNG NÚT BẤM (ĐÃ CHUẨN HÓA LOGIC 100%) */}
                    {(() => {
                      // 1. NẾU LÀ CHÍNH MÌNH (YOU) -> Tuyệt đối không có nút Kick hay Transfer
                      if (self) {
                        if (currentUserIsLeader) {
                          // Mình là Leader -> Chỉ hiện chữ Leader
                          return (
                            <span className="text-sm font-medium text-muted-foreground px-3 py-2">
                              Leader
                            </span>
                          );
                        } else {
                          // Mình là Member -> Hiện nút Leave Team
                          return (
                            <button
                              type="button"
                              onClick={handleLeaveTeam}
                              className="text-sm font-medium text-red-600 hover:bg-red-50 transition-colors px-3 py-2 rounded-radius-md"
                            >
                              Leave Team
                            </button>
                          );
                        }
                      }

                      // 2. NẾU KHÔNG PHẢI MÌNH & MÌNH LÀ LEADER ĐANG NHÌN MEMBER KHÁC
                      if (currentUserIsLeader) {
                        // Phòng hờ Backend bị ngáo trả về 2 thằng Leader trong 1 nhóm
                        if (isLeaderMember(member)) {
                          return (
                            <span className="text-sm font-medium text-muted-foreground px-3 py-2">
                              Leader
                            </span>
                          );
                        }

                        // Nếu member có ID thì cho phép tương tác (Transfer / Kick)
                        if (memberPlayerId) {
                          return (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleTransferClick(
                                    memberPlayerId,
                                    memberName,
                                  )
                                }
                                className="text-sm font-bold text-amber-600 hover:bg-amber-50 transition-colors px-3 py-2 rounded-radius-md border border-amber-200"
                              >
                                Transfer Leader
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveMember(memberPlayerId, memberName)
                                }
                                className="text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors px-3 py-2 rounded-radius-md"
                              >
                                Kick
                              </button>
                            </div>
                          );
                        } else {
                          return (
                            <span className="text-sm font-medium text-muted-foreground px-3 py-2">
                              Cannot interact
                            </span>
                          );
                        }
                      }

                      // 3. NẾU MÌNH CHỈ LÀ MEMBER VÀ ĐANG NHÌN NGƯỜI KHÁC
                      if (isLeaderMember(member)) {
                        return (
                          <span className="text-sm font-medium text-muted-foreground px-3 py-2">
                            Leader
                          </span>
                        );
                      }

                      return (
                        <span className="text-sm font-medium text-muted-foreground px-3 py-2">
                          Member
                        </span>
                      );
                    })()}
                    {/* KẾT THÚC VÙNG NÚT BẤM */}
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
