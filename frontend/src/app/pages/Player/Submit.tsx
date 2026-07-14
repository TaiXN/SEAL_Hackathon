import { useEffect, useState } from "react";
import { Github, Link2, AlertTriangle, Presentation, Send } from "lucide-react";
import { ConfirmModal } from "../../components/leaderPage/ConfirmModal";
import Swal from "sweetalert2";
import { submittedTeamApi } from "../../lib/api/submittedTeamApi";
import { teamApi } from "../../lib/api/teamApi";

const unwrapData = (value: any) => value?.data ?? value;

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

const getTeamId = (team: any) => {
  return (
    team?.teamId ||
    team?.teamID ||
    team?.id ||
    team?.team?.teamId ||
    team?.team?.teamID ||
    ""
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
        "Không có quyền submit",
        "Chỉ Team Leader mới được submit project.",
        "warning",
      );
      return;
    }

    if (!teamId) {
      Swal.fire(
        "Thiếu teamId",
        "Không xác định được team hiện tại để submit.",
        "warning",
      );
      return;
    }

    if (!githubUrl.trim()) {
      Swal.fire("Thiếu GitHub URL", "Vui lòng nhập link GitHub.", "warning");
      return;
    }

    if (!githubUrl.trim().startsWith("https://github.com/")) {
      Swal.fire(
        "GitHub URL chưa hợp lệ",
        "Link GitHub nên bắt đầu bằng https://github.com/",
        "warning",
      );
      return;
    }

    if (!demoUrl.trim()) {
      Swal.fire("Thiếu Demo URL", "Vui lòng nhập link demo.", "warning");
      return;
    }

    if (!isValidUrl(demoUrl.trim())) {
      Swal.fire(
        "Demo URL chưa hợp lệ",
        "Link demo phải bắt đầu bằng http:// hoặc https://.",
        "warning",
      );
      return;
    }

    if (!slideUrl.trim()) {
      Swal.fire("Thiếu Slide URL", "Vui lòng nhập link slide.", "warning");
      return;
    }

    if (!isValidUrl(slideUrl.trim())) {
      Swal.fire(
        "Slide URL chưa hợp lệ",
        "Link slide phải bắt đầu bằng http:// hoặc https://.",
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
        title: "Submit thành công",
        text: "Bài nộp của team đã được gửi lên hệ thống.",
      });
    } catch (error: any) {
      console.error("Submit project failed:", error);

      Swal.fire({
        icon: "error",
        title: "Submit thất bại",
        html: `<pre style="white-space:pre-wrap;text-align:left;font-size:12px">${getErrorMessage(
          error,
          "Không thể submit project lúc này.",
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
            Đang kiểm tra quyền submit...
          </p>
        </header>

        <div className="bg-card border border-border rounded-radius-lg p-6 shadow-sm">
          <p className="text-sm text-muted-foreground font-medium">
            Vui lòng chờ trong giây lát.
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
            Chỉ Team Leader mới được submit project.
          </p>
        </header>

        <div className="bg-secondary border border-border p-6 rounded-radius-md shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />

            <div>
              <h2 className="text-lg font-bold text-foreground">
                Bạn chưa có quyền submit
              </h2>

              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Tài khoản hiện tại đang là Team Member hoặc chưa có team. Sau
                khi bạn tạo team thành công, hệ thống sẽ xem bạn là Team Leader
                và mở chức năng Submit Project.
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
              * Link demo deploy hoặc video demo
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
              {isSubmitting ? "Đang submit..." : "Submit Project"}
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeSubmit}
        title="Confirm Final Submission"
        description="Bạn có chắc muốn submit GitHub link, demo link và slide link này không?"
        confirmText="Yes, Submit Project"
        isDestructive={false}
      />
    </div>
  );
}
