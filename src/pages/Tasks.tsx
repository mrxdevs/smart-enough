
import { useState } from "react";
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

// Mock data for now until we have Supabase integration
const initialTasks = [
  { id: 1, title: "Update project documentation", status: "todo", tag: "documentation" },
  { id: 2, title: "Design new landing page", status: "in-progress", tag: "design" },
  { id: 3, title: "Fix responsiveness issues", status: "in-progress", tag: "bug" },
  { id: 4, title: "Prepare client presentation", status: "todo", tag: "meeting" },
  { id: 5, title: "Implement authentication flow", status: "todo", tag: "development" },
  { id: 6, title: "Create wireframes for mobile app", status: "completed", tag: "design" },
  { id: 7, title: "Update API documentation", status: "completed", tag: "documentation" },
];

const Tasks = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTag, setNewTaskTag] = useState("task");
  const [filter, setFilter] = useState("all");
  
  const handleAddTask = () => {
    if (newTaskTitle.trim() === "") return;
    
    const newTask = {
      id: tasks.length + 1,
      title: newTaskTitle,
      status: "todo",
      tag: newTaskTag,
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
  };
  
  const handleStatusChange = (taskId: number, newStatus: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
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
          
          <div className="space-y-2">
            {filteredTasks.map((task) => (
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
                      task.id, 
                      task.status === 'completed' ? 'todo' : 'completed'
                    )}
                  >
                    {task.status === 'completed' && <Check className="h-3 w-3" />}
                  </Button>
                  <span className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                    {task.title}
                  </span>
                  <Badge className={`text-xs ${getTagColor(task.tag)}`} variant="outline">
                    {task.tag}
                  </Badge>
                </div>
                
                {task.status !== 'completed' && (
                  <Select
                    value={task.status}
                    onValueChange={(value) => handleStatusChange(task.id, value)}
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
            ))}
            
            {filteredTasks.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                No tasks found. Add some tasks to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tasks;
