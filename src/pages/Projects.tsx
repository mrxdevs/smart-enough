
import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FolderOpen, Plus, ListTodo, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "@/App";
import { toast } from "@/components/ui/sonner";
import { ProjectData } from "@/types/project";

const Projects = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    dueDate: ""
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useContext(AuthContext);
  
  // Fetch projects from Supabase
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
          
        if (error) {
          console.error("Error fetching projects:", error);
          toast.error("Failed to load projects");
          return;
        }
        
        if (data) {
          setProjects(data);
        }
      } catch (error) {
        console.error("Error in project fetch:", error);
        toast.error("Failed to load projects");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
  }, [user]);
  
  const handleCreateProject = async () => {
    if (!user || newProject.name.trim() === "") return;
    
    try {
      const projectToCreate = {
        user_id: user.id,
        name: newProject.name,
        description: newProject.description,
        due_date: newProject.dueDate,
        total_tasks: 0,
        completed_tasks: 0,
        progress: 0,
        status: "not-started"
      };
      
      // Add to Supabase
      const { data, error } = await supabase
        .from("projects")
        .insert(projectToCreate)
        .select();
        
      if (error) {
        console.error("Error creating project:", error);
        toast.error("Failed to create project");
        return;
      }
      
      // Update local state
      if (data && data.length > 0) {
        setProjects([data[0], ...projects]);
        setNewProject({ name: "", description: "", dueDate: "" });
        setIsDialogOpen(false);
        toast.success("Project created successfully");
      }
    } catch (error) {
      console.error("Error in create project flow:", error);
      toast.error("Failed to create project");
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not-started":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Not Started</Badge>;
      case "in-progress":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your projects and track progress</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add the details for your new project.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Project Name</label>
                <Input
                  id="name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  placeholder="Enter project name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  placeholder="Enter project description"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dueDate" className="text-sm font-medium">Due Date</label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newProject.dueDate}
                  onChange={(e) => setNewProject({...newProject, dueDate: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateProject}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {projects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="project-card">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-lg">{project.name}</h3>
                        <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
                      </div>
                      {getStatusBadge(project.status || "not-started")}
                    </div>
                    
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Progress</span>
                        <span className="text-sm font-medium">{project.progress || 0}%</span>
                      </div>
                      <Progress value={project.progress || 0} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <ListTodo className="h-4 w-4 mr-1" />
                          <span>{project.completed_tasks || 0}/{project.total_tasks || 0} tasks</span>
                        </div>
                        
                        {project.due_date && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Due {new Date(project.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-4">
                        <Button variant="outline" className="w-full" size="sm">
                          View Project
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No projects found</h3>
              <p className="text-muted-foreground mt-1">Create your first project to get started.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Projects;
