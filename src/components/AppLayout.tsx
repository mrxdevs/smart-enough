
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";

const AppLayout = () => {
  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1 p-6 lg:px-8 overflow-auto">
        <div className="mb-6 flex items-center justify-between">
          <SidebarTrigger className="lg:hidden">
            <span className="sr-only">Toggle sidebar</span>
          </SidebarTrigger>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
