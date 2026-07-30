import { Outlet } from "react-router-dom";
import { Sidebar as PlayerSidebar } from "./Sidebar";

export function PlayerLayout() {
  return (
    <div className="flex min-h-screen items-stretch bg-[#f7f8fb]">
      <PlayerSidebar />

      <main className="flex-1 p-8 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
