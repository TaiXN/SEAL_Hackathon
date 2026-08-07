import { useEffect, useState } from "react";
import { ExternalLink, Mail, UserRound } from "lucide-react";
import { mentorApi, type Mentor } from "../../lib/api/mentorApi";

type MentorSupportCardProps = {
  teamId: string;
  eventId: string;
  teamName: string;
  trackName: string;
  topicName: string;
  canLoadMentor: boolean;
};

const cleanText = (value: string, fallback = "-") =>
  value && value.trim() ? value.trim() : fallback;

const openGmailCompose = ({
  mentorEmail,
  teamName,
  trackName,
  topicName,
}: {
  mentorEmail: string;
  teamName: string;
  trackName: string;
  topicName: string;
}) => {
  const subject = `[SEAL Hackathon] Support request from ${teamName}`;
  const body = `
Dear Mentor,

Our team would like to ask for your support.

Team: ${teamName}
Track: ${trackName}
Topic: ${topicName}

Problem we need help with:
-

Thank you.
`.trim();

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    mentorEmail,
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  window.open(gmailUrl, "_blank", "noopener,noreferrer");
};

export function MentorSupportCard({
  teamId,
  eventId,
  teamName,
  trackName,
  topicName,
  canLoadMentor,
}: MentorSupportCardProps) {
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchMentor = async () => {
      setMentor(null);
      setHasLoaded(false);

      if (!teamId || !eventId || !canLoadMentor) return;

      try {
        setIsLoading(true);
        const contact = await mentorApi.getMentorContactByEventTeam(
          eventId,
          teamId,
        );
        if (isMounted) setMentor(contact);
      } catch (error) {
        if (isMounted) setMentor(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setHasLoaded(true);
        }
      }
    };

    fetchMentor();

    return () => {
      isMounted = false;
    };
  }, [teamId, eventId, canLoadMentor]);

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <UserRound className="w-4 h-4 text-[#0b7a3b]" />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Mentor Support
          </h2>
        </div>
        {mentor?.email && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-radius-sm">
            Available
          </span>
        )}
      </div>

      {!teamId ? (
        <p className="text-sm font-medium text-slate-500">
          Create or join a team before contacting a mentor.
        </p>
      ) : !canLoadMentor ? (
        <div className="text-sm text-slate-500 space-y-1">
          <p className="font-bold text-slate-700">Register first</p>
          <p>
            Your mentor will appear after your team selects an Event, Track, and
            Topic.
          </p>
        </div>
      ) : !eventId ? (
        <div className="text-sm text-slate-500 space-y-1">
          <p className="font-bold text-slate-700">Select an event</p>
          <p>Choose one registered event to load the right mentor contact.</p>
        </div>
      ) : isLoading ? (
        <p className="text-sm font-medium text-slate-400 animate-pulse">
          Loading mentor contact...
        </p>
      ) : mentor?.email ? (
        <div className="space-y-4">
          <div className="space-y-3">
            <InfoLine label="Track" value={cleanText(trackName, "No track")} />
            <InfoLine label="Mentor" value={mentor.name} />
            <InfoLine label="Email" value={mentor.email} />
            {mentor.phone && <InfoLine label="Phone" value={mentor.phone} />}
          </div>

          <button
            type="button"
            onClick={() =>
              openGmailCompose({
                mentorEmail: mentor.email,
                teamName: cleanText(teamName, "Unnamed Team"),
                trackName: cleanText(trackName, "No track"),
                topicName: cleanText(topicName, "No topic"),
              })
            }
            className="w-full inline-flex items-center justify-center gap-2 bg-[#f26f21] text-white px-4 py-3 rounded-lg text-sm font-bold hover:bg-[#d85f16] transition-colors"
          >
            <Mail className="w-4 h-4" />
            Open Gmail
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="text-sm text-slate-500 space-y-1">
          <p className="font-bold text-slate-700">No mentor assigned yet</p>
          <p>
            {hasLoaded
              ? "Please wait for the organizer to assign a mentor to your track."
              : "Mentor contact is not available yet."}
          </p>
        </div>
      )}
    </section>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-900 break-words">{value}</p>
    </div>
  );
}
