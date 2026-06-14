import { useState } from "react";
import {
  Github,
  UploadCloud,
  AlertTriangle,
  Presentation,
  Send,
} from "lucide-react";
import { ConfirmModal } from "../../components/leaderPage/ConfirmModal";
export function Submit() {
  const [githubUrl, setGithubUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl && !file) return; // Basic validation
    setIsConfirmOpen(true);
  };

  const executeSubmit = () => {
    // Logic to actually submit the project
    console.log("Project submitted!", { githubUrl, file });
    // You could navigate away or show a success state here
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Submit Project
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Finalize your hackathon submission.
        </p>
      </header>

      {/* Permission Warning */}
      <div className="mb-8 flex items-start gap-3 bg-secondary border border-border p-5 rounded-radius-md shadow-sm">
        <AlertTriangle className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />
        <div className="text-sm font-medium leading-relaxed text-secondary-foreground">
          <strong>Important Note:</strong> Only Team Management members are
          allowed to submit projects; participants are not permitted! Ensure
          your captain submits before the deadline.
        </div>
      </div>

      <div className="bg-card border border-border rounded-radius-lg p-6 sm:p-10 shadow-sm">
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* GitHub Input */}
          <div className="space-y-3">
            <label
              htmlFor="github-url"
              className="text-base font-semibold text-foreground flex items-center gap-2"
            >
              <Github className="w-5 h-5 text-primary" />
              GitHub repository URL
            </label>
            <div className="relative">
              <input
                type="url"
                id="github-url"
                placeholder="https://github.com/your-team/project"
                className="w-full p-4 bg-input-background border-none rounded-radius-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all font-mono text-sm"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              * GitHub only
            </p>
          </div>

          {/* File Upload Area */}
          <div className="space-y-3">
            <label className="text-base font-semibold text-foreground flex items-center gap-2">
              <Presentation className="w-5 h-5 text-primary" />
              Presentation Slides (.pptx)
            </label>

            <div className="border-2 border-dashed border-border rounded-radius-md bg-muted/20 hover:bg-muted/40 transition-colors relative group cursor-pointer">
              {/* Simulate file input */}
              <input
                type="file"
                accept=".pptx"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFile(e.target.files[0]);
                  }
                }}
              />

              <div className="p-12 flex flex-col items-center justify-center text-center">
                {file ? (
                  <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                      <Presentation className="w-8 h-8" />
                    </div>
                    <span className="font-semibold text-foreground text-lg">
                      {file.name}
                    </span>
                    <span className="text-sm text-muted-foreground mt-1">
                      Ready for submission
                    </span>
                    <button
                      type="button"
                      className="mt-4 text-sm text-destructive hover:underline font-medium relative z-20"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-background border border-border shadow-sm rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                      <UploadCloud className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-base font-medium text-foreground mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Only .pptx files are supported
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            {/* Submit Button */}
            <button
              type="submit"
              disabled={!githubUrl && !file}
              className="w-full bg-primary text-primary-foreground py-5 rounded-radius-md font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              Submit Project
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeSubmit}
        title="Confirm Final Submission"
        description="Are you sure you want to submit your project? Once submitted, you cannot make any further changes to your submission."
        confirmText="Yes, Submit Project"
        isDestructive={false}
      />
    </div>
  );
}
