import { Outlet } from "react-router-dom";
import { PlayerNotificationBell } from "../../components/player/PlayerNotificationBell";
import { Sidebar as PlayerSidebar } from "./Sidebar";

export function PlayerLayout() {
  return (
    <div className="flex min-h-screen items-stretch bg-[#f7f8fb]">
      <PlayerSidebar />
      <PlayerNotificationBell />

      <main className="flex-1 p-8 pr-24 lg:p-10 lg:pr-28">
        <Outlet />
      </main>
    </div>
  );
}
