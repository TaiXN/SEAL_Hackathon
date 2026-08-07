import apiClient from "./apiClient";

export interface Mentor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  trackId?: string;
  trackName?: string;
}

export interface MentorAssignedTeam {
  teamId: string;
  teamName: string;
  eventName?: string;
  trackId?: string;
  trackName?: string;
}

export interface MentorTeamDetail {
  teamId: string;
  teamName: string;
  eventName?: string;
  trackName?: string;
  roundName?: string;
  urlGithub?: string;
  urlDemo?: string;
  urlSlide?: string;
  leaderEmail?: string;
}

const unwrapData = (value: any) => value?.data ?? value;

const normalizeList = (value: any): any[] => {
  const data = unwrapData(value);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

const readString = (value: any, fallback = ""): string => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
};

const placeholderEmails = new Set([
  "leader@gmail.com",
  "mentor@gmail.com",
  "user@example.com",
]);

const readEmail = (...values: any[]): string => {
  for (const value of values) {
    const email = readString(value);
    const lowerEmail = email.toLowerCase();
    if (email.includes("@") && !placeholderEmails.has(lowerEmail)) {
      return email;
    }
  }

  return "";
};

const findLeaderEmail = (item: any): string => {
  const directEmail = readEmail(
    item?.leaderEmail,
    item?.LeaderEmail,
    item?.leaderGmail,
    item?.LeaderGmail,
    item?.leaderMail,
    item?.LeaderMail,
    item?.leaderEmailAddress,
    item?.LeaderEmailAddress,
    item?.teamLeaderEmail,
    item?.TeamLeaderEmail,
    item?.teamLeaderGmail,
    item?.TeamLeaderGmail,
    item?.teamLeaderMail,
    item?.TeamLeaderMail,
    item?.captainEmail,
    item?.CaptainEmail,
    item?.captainGmail,
    item?.CaptainGmail,
    item?.leader?.email,
    item?.leader?.Email,
    item?.leader?.gmail,
    item?.leader?.Gmail,
    item?.teamLeader?.email,
    item?.teamLeader?.Email,
    item?.teamLeader?.gmail,
    item?.teamLeader?.Gmail,
  );

  if (directEmail) return directEmail;

  const members = normalizeList(
    item?.members || item?.Members || item?.teamMembers || item?.TeamMembers,
  );
  const leader = members.find((member) => {
    const role = readString(member?.role || member?.Role).toLowerCase();
    return (
      member?.isLeader === true ||
      member?.IsLeader === true ||
      role.includes("leader") ||
      role.includes("lead")
    );
  });

  return readEmail(
    leader?.email,
    leader?.Email,
    leader?.gmail,
    leader?.Gmail,
    leader?.userEmail,
    leader?.UserEmail,
    leader?.account?.email,
    leader?.account?.Email,
    leader?.user?.email,
    leader?.user?.Email,
  );
};

const normalizeMentor = (value: any): Mentor | null => {
  const data = unwrapData(value);
  const item = Array.isArray(data) ? data[0] : data;
  if (!item) return null;

  const id = readString(
    item.teacherId ||
      item.teacherID ||
      item.mentorId ||
      item.mentorID ||
      item.id ||
      item.ID,
  );
  const name = readString(
    item.teacherName ||
      item.mentorName ||
      item.fullName ||
      item.name ||
      item.FullName,
    "Mentor",
  );
  const email = readEmail(
    item.email,
    item.Email,
    item.teacherEmail,
    item.TeacherEmail,
    item.mentorEmail,
    item.MentorEmail,
    item.gmail,
    item.Gmail,
  );

  return {
    id,
    name,
    email,
    phone: readString(item.phone || item.Phone || item.teacherPhone),
    trackId: readString(item.trackId || item.trackID || item.TrackID),
    trackName: readString(item.trackName || item.TrackName || item.track?.name),
  };
};

const normalizeAssignedTeam = (item: any): MentorAssignedTeam => ({
  teamId: readString(item.teamId || item.teamID || item.TeamID || item.id),
  teamName: readString(
    item.teamName || item.TeamName || item.name,
    "Unnamed Team",
  ),
  eventName: readString(item.eventName || item.EventName || item.event?.name),
  trackId: readString(item.trackId || item.trackID || item.TrackID),
  trackName: readString(item.trackName || item.TrackName || item.track?.name),
});

const normalizeTeamDetail = (value: any): MentorTeamDetail => {
  const item = unwrapData(value) || {};

  return {
    teamId: readString(item.teamId || item.teamID || item.TeamID || item.id),
    teamName: readString(
      item.teamName || item.TeamName || item.name,
      "Unnamed Team",
    ),
    eventName: readString(item.eventName || item.EventName || item.event?.name),
    trackName: readString(item.trackName || item.TrackName || item.track?.name),
    roundName: readString(
      item.roundName ||
        item.RoundName ||
        item.currentRoundName ||
        item.CurrentRoundName,
    ),
    urlGithub: readString(
      item.urlGithub || item.UrlGithub || item.githubUrl || item.GithubUrl,
    ),
    urlDemo: readString(item.urlDemo || item.UrlDemo || item.demoUrl),
    urlSlide: readString(item.urlSlide || item.UrlSlide || item.slideUrl),
    leaderEmail: findLeaderEmail(item),
  };
};

export function pickId(obj: any): string {
  return (
    obj?.id ||
    obj?.eventID ||
    obj?.eventId ||
    obj?.roundID ||
    obj?.roundId ||
    obj?.trackID ||
    obj?.trackId ||
    obj?.topicID ||
    obj?.topicId ||
    obj?.criteriaID ||
    obj?.criteriaId ||
    obj?.criteriaSetID ||
    obj?.criteriaSetId ||
    obj?.teacherID ||
    obj?.teacherId ||
    obj?.data?.id ||
    obj?.data?.eventID ||
    obj?.data?.eventId ||
    obj?.data?.roundID ||
    obj?.data?.roundId ||
    obj?.data?.trackID ||
    obj?.data?.trackId ||
    obj?.data?.topicID ||
    obj?.data?.topicId ||
    obj?.data?.criteriaID ||
    obj?.data?.criteriaId ||
    obj?.data?.criteriaSetID ||
    obj?.data?.criteriaSetId ||
    obj?.data?.teacherID ||
    obj?.data?.teacherId ||
    ""
  );
}
export const mentorApi = {
  async getAllMentors(): Promise<Mentor[]> {
    const res = await apiClient.get("/api/Mentor");
    return normalizeList(res).map(normalizeMentor).filter(Boolean) as Mentor[];
  },

  async assignMentor(trackId: string, mentorId: string): Promise<Mentor> {
    const res = await apiClient.post(
      `/api/Mentor/track/${trackId}/teacher/${mentorId}`,
    );
    return normalizeMentor(res) || res.data;
  },

  async removeMentor(trackId: string, mentorId: string): Promise<void> {
    const res = await apiClient.delete(
      `/api/Mentor/track/${trackId}/teacher/${mentorId}`,
    );
    return res.data;
  },

  async getMentorsByTrack(trackId: string): Promise<Mentor[]> {
    const res = await apiClient.get(`/api/Mentor/track/${trackId}`);
    return normalizeList(res).map(normalizeMentor).filter(Boolean) as Mentor[];
  },

  async getAssignedTeams(mentorId: string): Promise<MentorAssignedTeam[]> {
    const res = await apiClient.get(`/api/Mentor/assigned-teams/${mentorId}`);
    return normalizeList(res).map(normalizeAssignedTeam);
  },

  async getMentorContactByTeam(teamId: string): Promise<Mentor | null> {
    const res = await apiClient.get(`/api/Mentor/contact/${teamId}`);
    return normalizeMentor(res);
  },

  async getMentorContactByEventTeam(
    eventId: string,
    teamId: string,
  ): Promise<Mentor | null> {
    const res = await apiClient.get(
      `/api/Mentor/contact/event/${eventId}/team/${teamId}`,
    );
    return normalizeMentor(res);
  },

  async getTeamDetail(teamId: string): Promise<MentorTeamDetail> {
    const res = await apiClient.get(`/api/Mentor/team-detail/${teamId}`);
    return normalizeTeamDetail(res);
  },
};
