
import { NavLink } from "react-router-dom";
import {
  FileText,
  FolderOpen,
  Home,
  ListTodo,
  Pencil,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    path: "/",
    exact: true,
  },
  {
    title: "Tasks",
    icon: ListTodo,
    path: "/tasks",
  },
  {
    title: "Notes",
    icon: FileText,
    path: "/notes",
  },
  {
    title: "Canvas",
    icon: Pencil,
    path: "/canvas",
  },
  {
    title: "Projects",
    icon: FolderOpen,
    path: "/projects",
  },
];

const AppSidebar = () => {
  return (
    <Sidebar>
      <SidebarHeader className="px-6 py-3">
        <h1 className="text-xl font-bold tracking-tight">ProjectNexus</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.path}
                      end={item.exact}
                      className={({ isActive }) =>
                        isActive ? "text-sidebar-primary font-medium" : ""
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-6 py-3">
        <div className="text-xs text-muted-foreground">
          <p>Connect to Supabase to enable sync</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
