import { useEffect, useState } from "react";
import { Github, Link2, AlertTriangle, Presentation, Send } from "lucide-react";
import { ConfirmModal } from "../../components/leaderPage/ConfirmModal";
import Swal from "sweetalert2";
import { submittedTeamApi } from "../../lib/api/submittedTeamApi";
import { teamApi } from "../../lib/api/teamApi";
import {
  normalizeList,
  getCurrentTeamFromHistory,
  getTeamId,
  isLeaderTeam,
} from "../../lib/utils/teamHelpers";

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const getErrorMessage = (error: any, fallback: string) => {
  const rawError = error?.response?.data;

  if (!rawError) return fallback;

  if (typeof rawError === "string") return rawError;

  if (rawError?.message) return rawError.message;

  if (rawError?.title) return rawError.title;

  if (rawError?.errors) {
    return JSON.stringify(rawError.errors, null, 2);
  }

  return JSON.stringify(rawError, null, 2);
};

export function Submit() {
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [slideUrl, setSlideUrl] = useState("");

  const [teamId, setTeamId] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [canSubmitProject, setCanSubmitProject] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkSubmitPermission = async () => {
      try {
        setIsCheckingRole(true);

        const response = await teamApi.getMyTeamsHistory();
        const history = normalizeList(response);
        const currentTeam = getCurrentTeamFromHistory(history);

        const currentTeamId = getTeamId(currentTeam);
        const leader = Boolean(currentTeam && isLeaderTeam(currentTeam));

        console.log("SUBMIT TEAM HISTORY:", history);
        console.log("SUBMIT CURRENT TEAM:", currentTeam);
        console.log("SUBMIT TEAM ID:", currentTeamId);
        console.log("CAN SUBMIT PROJECT:", leader);

        setTeamId(currentTeamId);
        setCanSubmitProject(leader);
      } catch (error) {
        console.warn("Không kiểm tra được quyền submit:", error);
        setTeamId("");
        setCanSubmitProject(false);
      } finally {
        setIsCheckingRole(false);
      }
    };

    checkSubmitPermission();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmitProject) {
      Swal.fire(
        "Permission Denied",
        "Only the Team Leader can submit the project.",
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
      Swal.fire("Missing GitHub URL", "Please enter the GitHub link.", "warning");
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

      await submittedTeamApi.submitProject(teamId, {
        githubUrl: githubUrl.trim(),
        demoUrl: demoUrl.trim(),
        slideUrl: slideUrl.trim(),
      });

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
            Checking submit permission...
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

  if (!canSubmitProject) {
    return (
      <div className="animate-in fade-in duration-500 max-w-3xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            Submit Project
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Only Team Leaders can submit the project.
          </p>
        </header>

        <div className="bg-secondary border border-border p-6 rounded-radius-md shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />

            <div>
              <h2 className="text-lg font-bold text-foreground">
                You do not have submit permission
              </h2>

              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Your current account is a Team Member or has no team. Once you
                successfully create a team, the system will recognize you as Team Leader
                and enable the Submit Project feature.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Submit Project
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Submit your project by providing the GitHub repository link, demo
          link, and presentation link.
        </p>
      </header>

      <div className="mb-8 flex items-start gap-3 bg-secondary border border-border p-5 rounded-radius-md shadow-sm">
        <AlertTriangle className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />

        <div className="text-sm font-medium leading-relaxed text-secondary-foreground">
          <strong>Important Note:</strong> Only Team Leader can submit project.
          Team members are not permitted. Please make sure all links are
          accessible before submitting.
        </div>
      </div>

      <div className="bg-card border border-border rounded-radius-lg p-6 sm:p-10 shadow-sm">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <label
              htmlFor="github-url"
              className="text-base font-semibold text-foreground flex items-center gap-2"
            >
              <Github className="w-5 h-5 text-primary" />
              GitHub repository URL
            </label>

            <input
              type="url"
              id="github-url"
              placeholder="https://github.com/your-team/project"
              className="w-full p-4 bg-input-background border-none rounded-radius-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all font-mono text-sm"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />

            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              * GitHub repository link
            </p>
          </div>

          <div className="space-y-3">
            <label
              htmlFor="demo-url"
              className="text-base font-semibold text-foreground flex items-center gap-2"
            >
              <Link2 className="w-5 h-5 text-primary" />
              Demo URL
            </label>

            <input
              type="url"
              id="demo-url"
              placeholder="https://your-demo-url.com"
              className="w-full p-4 bg-input-background border-none rounded-radius-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all font-mono text-sm"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
            />

            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              * Deployed demo link or demo video
            </p>
          </div>

          <div className="space-y-3">
            <label
              htmlFor="slide-url"
              className="text-base font-semibold text-foreground flex items-center gap-2"
            >
              <Presentation className="w-5 h-5 text-primary" />
              Slide URL
            </label>

            <input
              type="url"
              id="slide-url"
              placeholder="https://docs.google.com/presentation/..."
              className="w-full p-4 bg-input-background border-none rounded-radius-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all font-mono text-sm"
              value={slideUrl}
              onChange={(e) => setSlideUrl(e.target.value)}
            />

            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              * Link Google Slides / PowerPoint online / Drive
            </p>
          </div>

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
        </form>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeSubmit}
        title="Confirm Final Submission"
        description="Are you sure you want to submit this GitHub link, demo link, and slide link?"
        confirmText="Yes, Submit Project"
        isDestructive={false}
      />
    </div>
  );
}
