
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock data for now until we have Supabase integration
const initialNotes = [
  { 
    id: 1, 
    title: "Project requirements", 
    content: "We need to ensure that all features are properly documented and tested before the release.", 
    tags: ["documentation", "project"], 
    createdAt: "2025-04-15"
  },
  { 
    id: 2, 
    title: "Meeting notes with client", 
    content: "Discussed timeline and deliverables. Client wants to see the first prototype by next Friday.", 
    tags: ["meeting", "client"], 
    createdAt: "2025-04-18" 
  },
  { 
    id: 3, 
    title: "Design inspiration", 
    content: "Color palette options: \n- Blue and teal \n- Purple and pink \n- Monochrome with accent colors", 
    tags: ["design", "inspiration"], 
    createdAt: "2025-04-20" 
  },
  { 
    id: 4, 
    title: "API Documentation", 
    content: "Endpoints: \n- GET /api/users \n- POST /api/users \n- PUT /api/users/:id \n- DELETE /api/users/:id", 
    tags: ["api", "documentation"], 
    createdAt: "2025-04-21" 
  },
];

const Notes = () => {
  const [notes, setNotes] = useState(initialNotes);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [activeNote, setActiveNote] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const handleAddTag = () => {
    if (tag.trim() !== "" && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
      setTag("");
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };
  
  const handleCreateNote = () => {
    if (title.trim() === "") return;
    
    const newNote = {
      id: notes.length + 1,
      title,
      content,
      tags,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setNotes([...notes, newNote]);
    resetForm();
  };
  
  const handleUpdateNote = () => {
    if (activeNote === null) return;
    
    setNotes(notes.map(note => 
      note.id === activeNote ? { ...note, title, content, tags } : note
    ));
    
    resetForm();
  };
  
  const handleSelectNote = (note: typeof notes[0]) => {
    setActiveNote(note.id);
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags);
    setIsEditing(true);
  };
  
  const resetForm = () => {
    setTitle("");
    setContent("");
    setTags([]);
    setActiveNote(null);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
        <p className="text-muted-foreground mt-1">Create and manage your notes</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Note" : "Create Note"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input 
                placeholder="Note title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              
              <Textarea 
                placeholder="Write your note content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px]"
              />
              
              <div className="flex gap-2">
                <Input 
                  placeholder="Add tag"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button variant="outline" onClick={handleAddTag}>
                  <Tag className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((t) => (
                    <Badge key={t} variant="outline" className="px-2 py-1">
                      {t}
                      <button
                        className="ml-2 text-xs"
                        onClick={() => handleRemoveTag(t)}
                      >
                        ✕
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-4">
                {isEditing && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
                <Button onClick={isEditing ? handleUpdateNote : handleCreateNote}>
                  {isEditing ? "Update Note" : "Create Note"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">All Notes</h2>
          </div>
          
          {notes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No notes found. Create your first note.
            </div>
          ) : (
            <div className="grid gap-4">
              {notes.map((note) => (
                <Card 
                  key={note.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                  onClick={() => handleSelectNote(note)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{note.title}</h3>
                      <span className="text-xs text-muted-foreground">{note.createdAt}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{note.content}</p>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {note.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs px-1">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notes;
