import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Github,
  History,
  Link2,
  Lock,
  Presentation,
  Send,
  Trophy,
  X,
} from "lucide-react";
import { ConfirmModal } from "../../components/leaderPage/ConfirmModal";
import Swal from "sweetalert2";
import { submittedTeamApi } from "../../lib/api/submittedTeamApi";
import { teamApi } from "../../lib/api/teamApi";
import {
  normalizeList,
  getCurrentTeamFromHistory,
  getTeamId,
  normalizeId,
  isLeaderTeam,
  isBannedAccount,
  isEliminatedTeam,
  getBanReason,
  unwrapData,
} from "../../lib/utils/teamHelpers";

import {
  type SubmissionAuditLog,
  type SubmissionEventContext,
  type SubmissionSnapshot,
  buildSubmitEventContexts,
  formatAuditDate,
  getErrorMessage,
  getSubmitEventKey,
  hasSubmissionLinks,
  isValidUrl,
  normalizeAuditLogs,
  normalizeSubmission,
  readString,
  stripTechnicalIds,
} from "../../lib/utils/playerSubmissionHelpers";
export function Submit() {
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [slideUrl, setSlideUrl] = useState("");

  const [teamId, setTeamId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [eventContexts, setEventContexts] = useState<SubmissionEventContext[]>(
    [],
  );
  const [selectedEventKey, setSelectedEventKey] = useState("");
  const [submission, setSubmission] = useState<SubmissionSnapshot | null>(null);
  const [auditLogs, setAuditLogs] = useState<SubmissionAuditLog[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isLeader, setIsLeader] = useState(false);
  const [canSubmitProject, setCanSubmitProject] = useState(false);
  const [submitBlockTitle, setSubmitBlockTitle] = useState("");
  const [submitBlockReason, setSubmitBlockReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMySubmission = async (
    currentTeamId: string,
    currentEventId = "",
  ) => {
    if (!currentTeamId || !currentEventId) {
      setSubmission(null);
      setGithubUrl("");
      setDemoUrl("");
      setSlideUrl("");
      return;
    }

    try {
      const response = await submittedTeamApi.getMySubmission(
        currentTeamId,
        currentEventId,
      );
      const nextSubmission = normalizeSubmission(response, currentEventId);

      setSubmission(nextSubmission);
      setGithubUrl(nextSubmission?.githubUrl || "");
      setDemoUrl(nextSubmission?.demoUrl || "");
      setSlideUrl(nextSubmission?.slideUrl || "");
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.warn("Cannot load team submission:", error);
      }

      setSubmission(null);
      setGithubUrl("");
      setDemoUrl("");
      setSlideUrl("");
    }
  };

  const loadAuditLogs = async (
    currentTeamId: string,
    leader: boolean,
    currentEventId = "",
  ) => {
    if (!currentTeamId || !currentEventId) {
      setAuditLogs([]);
      return;
    }

    try {
      setIsAuditLoading(true);
      const response = leader
        ? await submittedTeamApi.getAuditLogsByTeam(
            currentTeamId,
            currentEventId,
          )
        : await submittedTeamApi.getMyTeamAuditLogs(
            currentTeamId,
            currentEventId,
          );
      setAuditLogs(normalizeAuditLogs(response));
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.warn("Cannot load submission audit logs:", error);
      }
      setAuditLogs([]);
    } finally {
      setIsAuditLoading(false);
    }
  };

  const checkSubmitPermission = async () => {
    try {
      setIsCheckingRole(true);

      const response = await teamApi.getMyTeamsHistory();
      const history = normalizeList(response);
      const currentTeam = getCurrentTeamFromHistory(history);

      const currentTeamId = getTeamId(currentTeam);
      const leader = Boolean(currentTeam && isLeaderTeam(currentTeam));
      let teamInfo: any = null;

      if (currentTeamId) {
        try {
          const infoRes = await teamApi.getTeamDashboard(currentTeamId);
          teamInfo = unwrapData(infoRes);
        } catch (error) {
          console.warn("Cannot load team info for submit guard:", error);
        }
      }

      const banned = isBannedAccount(response, currentTeam, teamInfo);
      const eliminated = isEliminatedTeam(currentTeam, teamInfo);
      const banReason = getBanReason(response, currentTeam, teamInfo);
      const contexts = buildSubmitEventContexts(currentTeam, teamInfo);
      const savedEventId =
        currentTeamId && typeof window !== "undefined"
          ? localStorage.getItem(`activeTeamEventId_${currentTeamId}`)
          : "";
      const savedEventKey =
        currentTeamId && typeof window !== "undefined"
          ? localStorage.getItem(`activeTeamEventKey_${currentTeamId}`)
          : "";
      const selectedContext =
        contexts.find(
          (event) =>
            (savedEventId &&
              normalizeId(event.eventId) === normalizeId(savedEventId)) ||
            (savedEventKey && event.key === savedEventKey),
        ) ||
        contexts[0] ||
        null;
      const editable =
        leader && !banned && !eliminated && Boolean(selectedContext?.eventId);

      setTeamId(currentTeamId);
      setTeamName(
        readString(
          currentTeam?.teamName,
          currentTeam?.TeamName,
          teamInfo?.teamName,
          teamInfo?.TeamName,
          currentTeam?.name,
          "Current team",
        ),
      );
      setEventContexts(contexts);
      setSelectedEventKey(selectedContext?.key || "");
      setIsLeader(leader);
      setCanSubmitProject(editable);

      if (currentTeamId) {
        await loadMySubmission(currentTeamId, selectedContext?.eventId || "");
        await loadAuditLogs(
          currentTeamId,
          leader,
          selectedContext?.eventId || "",
        );
      } else {
        setSubmission(null);
        setAuditLogs([]);
        setEventContexts([]);
        setSelectedEventKey("");
        setGithubUrl("");
        setDemoUrl("");
        setSlideUrl("");
      }

      if (!currentTeamId) {
        setSubmitBlockTitle("No Active Team");
        setSubmitBlockReason(
          "Create or join a team before viewing project submission.",
        );
      } else if (banned) {
        setSubmitBlockTitle("Account Banned");
        setSubmitBlockReason(
          banReason || "This account can only view previous team information.",
        );
      } else if (eliminated) {
        setSubmitBlockTitle("Team Eliminated");
        setSubmitBlockReason(
          "This team has been eliminated. Submission editing is disabled, but previous links and scores remain visible.",
        );
      } else if (contexts.length === 0 || !selectedContext?.eventId) {
        setSubmitBlockTitle("No Event Selected");
        setSubmitBlockReason(
          "Select a registered event on the Dashboard before submitting project links.",
        );
      } else if (!leader) {
        setSubmitBlockTitle("View-only Access");
        setSubmitBlockReason(
          "You are a Team Member. You can view submitted links and scores, but only the Team Leader can edit or submit project links.",
        );
      } else {
        setSubmitBlockTitle("");
        setSubmitBlockReason("");
      }
    } catch (error) {
      console.warn("Cannot verify submit permission:", error);
      setTeamId("");
      setTeamName("");
      setEventContexts([]);
      setSelectedEventKey("");
      setSubmission(null);
      setAuditLogs([]);
      setIsLeader(false);
      setCanSubmitProject(false);
      setSubmitBlockTitle("Submit Unavailable");
      setSubmitBlockReason("Unable to verify submit permission.");
    } finally {
      setIsCheckingRole(false);
    }
  };

  useEffect(() => {
    checkSubmitPermission();

    const handler = () => {
      checkSubmitPermission();
    };

    window.addEventListener("player-team-updated", handler);

    return () => {
      window.removeEventListener("player-team-updated", handler);
    };
  }, []);

  const handleSubmitEventChange = async (key: string) => {
    setSelectedEventKey(key);
    const nextEvent = eventContexts.find((event) => event.key === key);
    if (!nextEvent || !teamId) return;

    if (typeof window !== "undefined") {
      localStorage.setItem(`activeTeamEventKey_${teamId}`, nextEvent.key);
      if (nextEvent.eventId) {
        localStorage.setItem(`activeTeamEventId_${teamId}`, nextEvent.eventId);
      }
    }

    setCanSubmitProject(isLeader && Boolean(nextEvent.eventId));
    await loadMySubmission(teamId, nextEvent.eventId);
    await loadAuditLogs(teamId, isLeader, nextEvent.eventId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSubmitEvent = eventContexts.find(
      (event) => event.key === selectedEventKey,
    );

    if (!canSubmitProject) {
      Swal.fire(
        "Permission Denied",
        submitBlockReason || "Only the Team Leader can submit the project.",
        "warning",
      );
      return;
    }

    if (!selectedSubmitEvent?.eventId) {
      Swal.fire(
        "Missing Event",
        "Please choose the event you want to submit for.",
        "warning",
      );
      return;
    }

    if (!teamId) {
      Swal.fire(
        "Missing Team",
        "Unable to identify the current team for submission.",
        "warning",
      );
      return;
    }

    if (!githubUrl.trim()) {
      Swal.fire(
        "Missing GitHub URL",
        "Please enter the GitHub link.",
        "warning",
      );
      return;
    }

    if (!githubUrl.trim().startsWith("https://github.com/")) {
      Swal.fire(
        "Invalid GitHub URL",
        "GitHub link must start with https://github.com/",
        "warning",
      );
      return;
    }

    if (!demoUrl.trim()) {
      Swal.fire("Missing Demo URL", "Please enter the demo link.", "warning");
      return;
    }

    if (!isValidUrl(demoUrl.trim())) {
      Swal.fire(
        "Invalid Demo URL",
        "Demo link must start with http:// or https://.",
        "warning",
      );
      return;
    }

    if (!slideUrl.trim()) {
      Swal.fire("Missing Slide URL", "Please enter the slide link.", "warning");
      return;
    }

    if (!isValidUrl(slideUrl.trim())) {
      Swal.fire(
        "Invalid Slide URL",
        "Slide link must start with http:// or https://.",
        "warning",
      );
      return;
    }

    setIsConfirmOpen(true);
  };

  const executeSubmit = async () => {
    try {
      setIsConfirmOpen(false);
      setIsSubmitting(true);
      const selectedSubmitEvent = eventContexts.find(
        (event) => event.key === selectedEventKey,
      );

      if (!selectedSubmitEvent?.eventId) {
        Swal.fire(
          "Missing Event",
          "Please choose the event you want to submit for.",
          "warning",
        );
        return;
      }

      const response = await submittedTeamApi.submitProject(
        teamId,
        selectedSubmitEvent.eventId,
        {
          githubUrl: githubUrl.trim(),
          demoUrl: demoUrl.trim(),
          slideUrl: slideUrl.trim(),
        },
      );

      setSubmission(
        normalizeSubmission(response, selectedSubmitEvent.eventId) || {
          submissionId: "",
          githubUrl: githubUrl.trim(),
          demoUrl: demoUrl.trim(),
          slideUrl: slideUrl.trim(),
          score: "",
          reason: "",
          roundName: "",
          status: "Submitted",
        },
      );
      await loadAuditLogs(teamId, true, selectedSubmitEvent.eventId);

      Swal.fire({
        icon: "success",
        title: "Submission Successful",
        text: "Your team's project has been submitted successfully.",
      });
    } catch (error: any) {
      console.error("Submit project failed:", error);

      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        html: `<pre style="white-space:pre-wrap;text-align:left;font-size:12px">${getErrorMessage(
          error,
          "Unable to submit project at this time.",
        )}</pre>`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingRole) {
    return (
      <div className="animate-in fade-in duration-500 max-w-3xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            Submit Project
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Loading submission access...
          </p>
        </header>

        <div className="bg-card border border-border rounded-radius-lg p-6 shadow-sm">
          <p className="text-sm text-muted-foreground font-medium">
            Please wait a moment.
          </p>
        </div>
      </div>
    );
  }

  const isReadOnly = !canSubmitProject;
  const hasExistingSubmission = hasSubmissionLinks(submission);
  const selectedSubmitEvent =
    eventContexts.find((event) => event.key === selectedEventKey) ||
    eventContexts[0] ||
    null;

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Submit Project
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {canSubmitProject
            ? "Submit or update your team's project links."
            : "View your team's submitted project links and score."}
        </p>
      </header>

      {teamId && (
        <section className="mb-6 bg-card border border-border rounded-radius-lg p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Submitting For
              </p>
              <h2 className="mt-1 text-xl font-bold text-foreground">
                {selectedSubmitEvent?.eventName || "No event selected"}
              </h2>
              <p className="mt-1 text-sm font-bold text-muted-foreground">
                {selectedSubmitEvent
                  ? `${selectedSubmitEvent.trackName}${
                      selectedSubmitEvent.topicName &&
                      selectedSubmitEvent.topicName !== "No topic"
                        ? ` - ${selectedSubmitEvent.topicName}`
                        : ""
                    }`
                  : "Choose a registered event before submitting."}
              </p>
            </div>

            <div className="w-full md:w-72">
              <label
                htmlFor="submit-event"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Event
              </label>
              <select
                id="submit-event"
                value={selectedEventKey}
                onChange={(event) =>
                  handleSubmitEventChange(event.target.value)
                }
                disabled={eventContexts.length <= 1 || isSubmitting}
                className="w-full rounded-radius-md border border-border bg-background px-4 py-3 text-sm font-bold text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {eventContexts.length === 0 ? (
                  <option value="">No registered event</option>
                ) : (
                  eventContexts.map((event) => (
                    <option key={event.key} value={event.key}>
                      {event.eventName}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {selectedSubmitEvent?.roundName && (
            <div className="mt-4 rounded-radius-md border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-bold text-primary">
              Current round: {selectedSubmitEvent.roundName}
            </div>
          )}
        </section>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatusCard
          icon={isLeader ? <CheckCircle2 /> : <Lock />}
          label="Access"
          value={canSubmitProject ? "Team Leader" : "Read only"}
          tone={canSubmitProject ? "green" : "orange"}
        />
        <StatusCard
          icon={<Github />}
          label="Submission"
          value={hasExistingSubmission ? "Submitted" : "No links yet"}
          tone={hasExistingSubmission ? "green" : "slate"}
        />
        <StatusCard
          icon={<Trophy />}
          label="Score"
          value={submission?.score ? `${submission.score} pts` : "Not scored"}
          tone={submission?.score ? "green" : "slate"}
        />
      </div>

      {submitBlockReason && (
        <div className="mb-8 flex items-start gap-3 bg-secondary border border-border p-5 rounded-radius-md shadow-sm">
          <AlertTriangle className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />

          <div className="text-sm font-medium leading-relaxed text-secondary-foreground">
            <strong>{submitBlockTitle}:</strong> {submitBlockReason}
          </div>
        </div>
      )}

      {submission && (
        <section className="mb-8 bg-card border border-border rounded-radius-lg p-6 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Current Submission
              </p>
              <h2 className="mt-1 text-xl font-bold text-foreground">
                {teamName || "Current team"}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-bold text-muted-foreground">
                {submission.roundName || submission.status || "Project links"}
              </div>
              <button
                type="button"
                onClick={() => setIsAuditOpen(true)}
                className="inline-flex items-center gap-2 rounded-radius-md border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-orange-100"
              >
                <History className="h-4 w-4" />
                Activity
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <SubmissionLink label="GitHub" href={submission.githubUrl} />
            <SubmissionLink label="Demo" href={submission.demoUrl} />
            <SubmissionLink label="Slide" href={submission.slideUrl} />
          </div>

          {(submission.score || submission.reason) && (
            <div className="mt-5 rounded-radius-md border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-bold">
                Score:{" "}
                {submission.score ? `${submission.score} pts` : "Not scored"}
              </p>
              {submission.reason && (
                <p className="mt-1 leading-relaxed">{submission.reason}</p>
              )}
            </div>
          )}
        </section>
      )}

      {!teamId ? (
        <div className="bg-card border border-border rounded-radius-lg p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            No active team is selected.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-radius-lg p-6 sm:p-10 shadow-sm">
          <form className="space-y-8" onSubmit={handleSubmit}>
            <ProjectInput
              id="github-url"
              icon={<Github className="w-5 h-5 text-primary" />}
              label="GitHub repository URL"
              helper="* GitHub repository link"
              placeholder="https://github.com/your-team/project"
              value={githubUrl}
              onChange={setGithubUrl}
              disabled={isReadOnly || isSubmitting}
            />

            <ProjectInput
              id="demo-url"
              icon={<Link2 className="w-5 h-5 text-primary" />}
              label="Demo URL"
              helper="* Deployed demo link or demo video"
              placeholder="https://your-demo-url.com"
              value={demoUrl}
              onChange={setDemoUrl}
              disabled={isReadOnly || isSubmitting}
            />

            <ProjectInput
              id="slide-url"
              icon={<Presentation className="w-5 h-5 text-primary" />}
              label="Slide URL"
              helper="* Link Google Slides / PowerPoint online / Drive"
              placeholder="https://docs.google.com/presentation/..."
              value={slideUrl}
              onChange={setSlideUrl}
              disabled={isReadOnly || isSubmitting}
            />

            {canSubmitProject ? (
              <div className="pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-primary-foreground py-5 rounded-radius-md font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                  {isSubmitting ? "Submitting..." : "Submit Project"}
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-center gap-2 rounded-radius-md border border-slate-200 bg-slate-50 py-4 text-sm font-bold text-slate-500">
                  <Lock className="w-4 h-4" />
                  Editing is available to the Team Leader only.
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeSubmit}
        title="Confirm Final Submission"
        description={`Are you sure you want to submit these project links for ${
          selectedSubmitEvent?.eventName || "the selected event"
        }?`}
        confirmText="Yes, Submit Project"
        isDestructive={false}
      />

      {isAuditOpen && (
        <AuditLogModal
          logs={auditLogs}
          isLoading={isAuditLoading}
          onClose={() => setIsAuditOpen(false)}
        />
      )}
    </div>
  );
}

function AuditLogModal({
  logs,
  isLoading,
  onClose,
}: {
  logs: SubmissionAuditLog[];
  isLoading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <section className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-radius-lg border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Audit Logs
            </p>
            <h2 className="mt-1 text-xl font-bold text-foreground">
              Submission activity
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-radius-md text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
            aria-label="Close audit logs"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <p className="text-sm font-medium text-muted-foreground">
              Loading activity...
            </p>
          ) : logs.length === 0 ? (
            <p className="rounded-radius-md border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-muted-foreground">
              No submission activity yet.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-radius-md border border-border">
              {logs.map((log, index) => (
                <div
                  key={`${log.title}-${log.createdAt}-${index}`}
                  className="p-4"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <p className="font-bold text-foreground">{log.title}</p>
                    {log.createdAt && (
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {formatAuditDate(log.createdAt)}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 space-y-3">
                    <AuditLinkChange
                      label="GitHub"
                      before={log.oldGithubUrl}
                      after={log.newGithubUrl}
                    />
                    <AuditLinkChange
                      label="Demo"
                      before={log.oldDemoUrl}
                      after={log.newDemoUrl}
                    />
                    <AuditLinkChange
                      label="Slide"
                      before={log.oldSlideUrl}
                      after={log.newSlideUrl}
                    />
                  </div>
                  {log.actor && (
                    <p className="mt-2 text-xs font-bold text-primary">
                      By {log.actor}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AuditLinkChange({
  label,
  before,
  after,
}: {
  label: string;
  before: string;
  after: string;
}) {
  const cleanBefore = stripTechnicalIds(before) || "-";
  const cleanAfter = stripTechnicalIds(after) || "-";
  const changed = cleanBefore !== cleanAfter;

  return (
    <div className="rounded-radius-md border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
            changed
              ? "bg-orange-100 text-[#c2410c]"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          {changed ? "Changed" : "Same"}
        </span>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <AuditValue label="Before" value={cleanBefore} />
        <AuditValue label="After" value={cleanAfter} isCurrent />
      </div>
    </div>
  );
}

function AuditValue({
  label,
  value,
  isCurrent,
}: {
  label: string;
  value: string;
  isCurrent?: boolean;
}) {
  const isUrl = value.startsWith("http://") || value.startsWith("https://");

  return (
    <div className="min-w-0 rounded-radius-md bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {isUrl ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className={`mt-1 inline-flex max-w-full items-center gap-2 text-xs font-bold hover:underline ${
            isCurrent ? "text-primary" : "text-slate-600"
          }`}
        >
          <span className="truncate">{value}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </a>
      ) : (
        <p
          className={`mt-1 break-words text-xs font-bold ${
            isCurrent ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactElement;
  label: string;
  value: string;
  tone: "green" | "orange" | "slate";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : tone === "orange"
        ? "border-orange-100 bg-orange-50 text-[#c2410c]"
        : "border-slate-200 bg-white text-slate-600";

  return (
    <div className={`rounded-radius-md border p-4 shadow-sm ${toneClass}`}>
      <div className="mb-3">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-wider opacity-70">
        {label}
      </p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
    </div>
  );
}

function SubmissionLink({ label, href }: { label: string; href: string }) {
  return (
    <div className="rounded-radius-md border border-border bg-input-background p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex max-w-full items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <span className="truncate">{href}</span>
          <ExternalLink className="h-4 w-4 shrink-0" />
        </a>
      ) : (
        <p className="mt-2 text-sm font-bold text-muted-foreground">-</p>
      )}
    </div>
  );
}

function ProjectInput({
  id,
  icon,
  label,
  helper,
  placeholder,
  value,
  onChange,
  disabled,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  helper: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <label
        htmlFor={id}
        className="text-base font-semibold text-foreground flex items-center gap-2"
      >
        {icon}
        {label}
      </label>

      <input
        type="url"
        id={id}
        placeholder={placeholder}
        className="w-full p-4 bg-input-background border-none rounded-radius-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all font-mono text-sm disabled:cursor-not-allowed disabled:opacity-70"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />

      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        {helper}
      </p>
    </div>
  );
}
