import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background font-inter">
      <Sidebar />
      <main className="pt-16 px-4 pb-6 lg:pt-0 lg:ml-16 lg:px-8 lg:py-8 min-h-screen">
        <Outlet />
      </main>
    </div>);

}