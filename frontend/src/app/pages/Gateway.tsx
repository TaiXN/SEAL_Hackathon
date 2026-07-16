import { Hexagon, User, LogOut } from "lucide-react";

export function Gateway() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-200 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-transparent">
        <div className="flex items-center gap-2">
          <Hexagon className="w-6 h-6 text-neutral-900" strokeWidth={2.5} />
          <span className="font-bold text-lg tracking-tight">
            SEAL Hackathon
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200">
              <User className="w-4 h-4 text-neutral-600" />
            </div>
          </div>
          <button className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-4">
            Welcome to the Spring 2026 Season
          </h1>
          <p className="text-lg text-neutral-500">
            How would you like to start?
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl justify-center">
          {/* Option 1: Create Team */}
          <div className="flex-1 flex flex-col bg-white border border-neutral-200 p-8 hover:border-neutral-300 transition-colors">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-3">Create a New Team</h2>
              <p className="text-neutral-500 leading-relaxed">
                Become a Team Leader, choose your track, and invite others.
              </p>
            </div>

            <div className="mt-10">
              <button className="w-full bg-neutral-900 text-white font-medium py-3.5 px-4 hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2">
                + Create Team
              </button>
            </div>
          </div>

          {/* Option 2: Join Team */}
          <div className="flex-1 flex flex-col bg-white border border-neutral-200 p-8 hover:border-neutral-300 transition-colors">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-3">
                Join an Existing Team
              </h2>
              <p className="text-neutral-500 leading-relaxed">
                Received an invite from a Team Leader?
              </p>
            </div>

            <div className="mt-10">
              <div className="flex w-full">
                <input
                  type="text"
                  placeholder="Paste invite link here..."
                  className="flex-1 min-w-0 bg-neutral-50 border border-neutral-200 py-3.5 px-4 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 focus:bg-white transition-colors"
                />
                <button className="bg-neutral-900 text-white font-medium py-3.5 px-8 hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2">
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
