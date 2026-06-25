import { Outlet } from "react-router";
import { Sidebar } from "../../pages/Player/Sidebar";

export function Layout() {
  return (
    <div className="flex h-screen w-full bg-white text-gray-900 font-sans selection:bg-gray-200">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[#fdfdfd]">
        <div className="h-full p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
