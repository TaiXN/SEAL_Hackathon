import { Outlet } from "react-router-dom";
import { Sidebar as PlayerSidebar } from "./Sidebar";

export function PlayerLayout() {
  return (
    <div className="flex min-h-screen bg-white">
      <PlayerSidebar />

      <main className="flex-1 overflow-y-auto p-10">
        <Outlet />
      </main>
    </div>
  );
}
