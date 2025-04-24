
import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Check, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "@/App";
import { toast } from "@/components/ui/sonner";
import { TaskData } from "@/types/task";

/**
 * Converts database status format to application format
 */
const dbStatusToAppStatus = (status: string): "todo" | "in-progress" | "completed" => {
  if (status === "in_progress") return "in-progress";
  if (status === "todo" || status === "completed") return status as "todo" | "completed";
  return "todo"; // Default fallback
};

/**
 * Converts application status format to database format
 */
const appStatusToDbStatus = (status: "todo" | "in-progress" | "completed"): string => {
  return status === "in-progress" ? "in_progress" : status;
};

const Tasks = () => {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTag, setNewTaskTag] = useState("task");
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useContext(AuthContext);
  
  // Fetch tasks from Supabase
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
          
        if (error) {
          console.error("Error fetching tasks:", error);
          toast.error("Failed to load tasks");
          return;
        }
        
        if (data) {
          // Properly convert database status format to UI format
          const formattedTasks: TaskData[] = data.map(task => ({
            ...task,
            status: dbStatusToAppStatus(task.status)
          }));
          setTasks(formattedTasks);
        }
      } catch (error) {
        console.error("Error in task fetch:", error);
        toast.error("Failed to load tasks");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTasks();
  }, [user]);
  
  const handleAddTask = async () => {
    if (!user || newTaskTitle.trim() === "") return;
    
    try {
      const newTask = {
        user_id: user.id,
        title: newTaskTitle,
        status: "todo" as const,
        tag: newTaskTag,
      };
      
      // Add to Supabase
      const { data, error } = await supabase
        .from("tasks")
        .insert(newTask)
        .select();
        
      if (error) {
        console.error("Error adding task:", error);
        toast.error("Failed to add task");
        return;
      }
      
      // Update local state
      if (data && data.length > 0) {
        const formattedTask: TaskData = {
          ...data[0],
          status: dbStatusToAppStatus(data[0].status)
        };
        setTasks([formattedTask, ...tasks]);
        setNewTaskTitle("");
        toast.success("Task added successfully");
      }
    } catch (error) {
      console.error("Error in add task flow:", error);
      toast.error("Failed to add task");
    }
  };
  
  const handleStatusChange = async (taskId: string, newStatus: "todo" | "in-progress" | "completed") => {
    if (!user) return;
    
    try {
      // Convert UI status format to database format
      const dbStatus = appStatusToDbStatus(newStatus);
      
      // Update in Supabase
      const { error } = await supabase
        .from("tasks")
        .update({ status: dbStatus })
        .eq("id", taskId);
        
      if (error) {
        console.error("Error updating task status:", error);
        toast.error("Failed to update task");
        return;
      }
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      
      toast.success("Task updated successfully");
    } catch (error) {
      console.error("Error in status update flow:", error);
      toast.error("Failed to update task");
    }
  };
  
  const filteredTasks = filter === "all" 
    ? tasks 
    : tasks.filter(task => task.status === filter);
  
  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      'documentation': 'bg-blue-100 text-blue-800',
      'design': 'bg-purple-100 text-purple-800',
      'development': 'bg-emerald-100 text-emerald-800',
      'bug': 'bg-red-100 text-red-800',
      'meeting': 'bg-amber-100 text-amber-800',
      'task': 'bg-gray-100 text-gray-800',
    };
    return colors[tag] || colors.task;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground mt-1">Manage your tasks and track progress</p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Add and manage your tasks</CardDescription>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-6">
            <Input 
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1"
            />
            <Select value={newTaskTag} onValueChange={setNewTaskTag}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="feature">Feature</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="development">Development</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddTask}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No tasks found. Add some tasks to get started.
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors duration-200 ${
                      task.status === 'completed' ? 'bg-muted/50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Button
                        size="icon"
                        variant={task.status === 'completed' ? 'default' : 'outline'}
                        className="h-6 w-6 rounded-full"
                        onClick={() => handleStatusChange(
                          task.id!, 
                          task.status === 'completed' ? 'todo' : 'completed'
                        )}
                      >
                        {task.status === 'completed' && <Check className="h-3 w-3" />}
                      </Button>
                      <span className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                        {task.title}
                      </span>
                      <Badge className={`text-xs ${getTagColor(task.tag || 'task')}`} variant="outline">
                        {task.tag || 'task'}
                      </Badge>
                    </div>
                    
                    {task.status !== 'completed' && (
                      <Select
                        value={task.status}
                        onValueChange={(value) => handleStatusChange(task.id!, value as "todo" | "in-progress" | "completed")}
                      >
                        <SelectTrigger className="w-32 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Tasks;
