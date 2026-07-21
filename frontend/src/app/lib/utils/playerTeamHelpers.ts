import { jwtDecode } from "jwt-decode";

export type CurrentPlayerInfo = {
  displayName: string;
  email: string;
  playerId: string;
};

const readString = (value: any, fallback = "") => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
};

export const getMembers = (team: any): any[] => {
  return team?.members || team?.teamMembers || team?.players || [];
};

export const getTeamDisplayName = (team: any) =>
  readString(
    team?.teamName || team?.TeamName || team?.name || team?.team?.teamName,
    "Unnamed Team",
  );

export const getTeamEventName = (team: any) =>
  readString(
    team?.eventName ||
      team?.EventName ||
      team?.event?.eventName ||
      team?.event?.name ||
      team?.teamInRound?.eventName,
  );

export const getTeamTrackName = (team: any) =>
  readString(
    team?.trackName ||
      team?.TrackName ||
      team?.track?.trackName ||
      team?.track?.name ||
      team?.teamInRound?.trackName,
  );

export const getTeamTopicName = (team: any) =>
  readString(
    team?.topicName ||
      team?.TopicName ||
      team?.topicDetail ||
      team?.TopicDetail ||
      team?.topic?.topicDetail ||
      team?.topic?.name ||
      team?.teamInRound?.topicName ||
      team?.teamInRound?.topicDetail,
  );

export const getMemberPlayerId = (member: any) => {
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

export const getMemberEmail = (member: any) => {
  return (
    member?.studentEmail ||
    member?.account?.email ||
    member?.email ||
    member?.Email ||
    member?.player?.email ||
    member?.player?.Email ||
    ""
  );
};

export const getMemberName = (member: any) => {
  if (member?.student?.account?.fullName) {
    return member.student.account.fullName;
  }
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

export const isLeaderMember = (member: any) => {
  if (
    member?.isLeader === true ||
    member?.IsLeader === true ||
    member?.isLeader === 1 ||
    member?.IsLeader === 1
  ) {
    return true;
  }

  const role = String(
    member?.role || member?.teamRole || member?.memberRole || "",
  ).toLowerCase();

  return role === "leader" || role === "team leader" || role === "teamleader";
};

export const getInitials = (name: string) => {
  const words = name.trim().split(" ").filter(Boolean);

  if (words.length === 0) return "?";

  return words
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

export const extractTeamIdFromJoinInput = (value: string) => {
  const clean = value.trim().replace(/\/+$/, "");
  if (!clean) return "";

  const last = clean.split("/").pop() || "";
  return last.split("?")[0].split("#")[0];
};

export const getCurrentUserFromToken = (
  accessToken?: string | null,
): CurrentPlayerInfo => {
  if (!accessToken) return { displayName: "You", email: "", playerId: "" };

  try {
    const decoded: any = jwtDecode(accessToken);
    const displayName =
      decoded?.fullName || decoded?.name || decoded?.email || "You";

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
    return { displayName: "You", email: "", playerId: "" };
  }
};

export const isSelfMember = (
  member: any,
  _index: number,
  currentUserInfo: CurrentPlayerInfo,
  _currentUserIsLeader: boolean,
) => {
  const memberId = String(getMemberPlayerId(member) || "");
  const myId = String(currentUserInfo.playerId || "");

  return memberId && myId && memberId.toLowerCase() === myId.toLowerCase();
};

export const resolveMemberName = (
  member: any,
  index: number,
  isSelf: boolean,
  currentUserInfo: CurrentPlayerInfo,
) => {
  const rawName = String(
    getMemberName(member) || getMemberEmail(member) || "",
  ).trim();
  const normalizedName = rawName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const isMissingName =
    !rawName ||
    rawName === "No name" ||
    normalizedName === "khong co ten" ||
    normalizedName === "unknown" ||
    normalizedName === "null" ||
    normalizedName === "undefined";

  if (!isMissingName) return rawName;

  if (isSelf) {
    return currentUserInfo.displayName || currentUserInfo.email || "You";
  }

  return `Member ${index + 1}`;
};

export const resolveMemberRole = (
  member: any,
  _index: number,
  _currentUserIsLeader: boolean,
  _isSelf: boolean,
) => {
  if (isLeaderMember(member)) {
    return "Team Leader";
  }

  return "Member";
};
