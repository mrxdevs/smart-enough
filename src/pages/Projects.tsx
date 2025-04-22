
import { useState } from "react";
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
import { FolderOpen, Plus, ListTodo, FileText, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Mock data for now until we have Supabase integration
const initialProjects = [
  { 
    id: 1, 
    name: "Website Redesign", 
    description: "Complete redesign of the company website with new branding.", 
    totalTasks: 12,
    completedTasks: 8,
    progress: 67,
    dueDate: "2025-05-15",
    status: "in-progress"
  },
  { 
    id: 2, 
    name: "Mobile App Development", 
    description: "Develop a new mobile app for both iOS and Android platforms.", 
    totalTasks: 20,
    completedTasks: 5,
    progress: 25,
    dueDate: "2025-06-30",
    status: "in-progress"
  },
  { 
    id: 3, 
    name: "Marketing Campaign", 
    description: "Q2 Marketing campaign for new product launch.", 
    totalTasks: 8,
    completedTasks: 8,
    progress: 100,
    dueDate: "2025-04-10",
    status: "completed"
  },
  { 
    id: 4, 
    name: "Content Strategy", 
    description: "Develop content strategy for the next quarter.", 
    totalTasks: 6,
    completedTasks: 0,
    progress: 0,
    dueDate: "2025-05-01",
    status: "not-started"
  },
];

const Projects = () => {
  const [projects, setProjects] = useState(initialProjects);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    dueDate: ""
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleCreateProject = () => {
    if (newProject.name.trim() === "") return;
    
    const createdProject = {
      id: projects.length + 1,
      name: newProject.name,
      description: newProject.description,
      totalTasks: 0,
      completedTasks: 0,
      progress: 0,
      dueDate: newProject.dueDate,
      status: "not-started"
    };
    
    setProjects([...projects, createdProject]);
    setNewProject({ name: "", description: "", dueDate: "" });
    setIsDialogOpen(false);
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
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="project-card">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-lg">{project.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
                </div>
                {getStatusBadge(project.status)}
              </div>
              
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Progress</span>
                  <span className="text-sm font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <ListTodo className="h-4 w-4 mr-1" />
                    <span>{project.completedTasks}/{project.totalTasks} tasks</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Due {project.dueDate}</span>
                  </div>
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
      
      {projects.length === 0 && (
        <div className="text-center py-10">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-medium">No projects found</h3>
          <p className="text-muted-foreground mt-1">Create your first project to get started.</p>
        </div>
      )}
    </div>
  );
};

export default Projects;
