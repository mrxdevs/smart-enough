
import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "@/App";
import { toast } from "@/components/ui/sonner";
import { NoteData } from "@/types/note";

const Notes = () => {
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useContext(AuthContext);
  
  // Fetch notes from Supabase
  useEffect(() => {
    const fetchNotes = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("notes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
          
        if (error) {
          console.error("Error fetching notes:", error);
          toast.error("Failed to load notes");
          return;
        }
        
        if (data) {
          // Format notes from database
          const formattedNotes = data.map(note => ({
            ...note,
            tags: note.category ? note.category.split(',') : []
          }));
          
          setNotes(formattedNotes);
        }
      } catch (error) {
        console.error("Error in note fetch:", error);
        toast.error("Failed to load notes");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotes();
  }, [user]);
  
  const handleAddTag = () => {
    if (tag.trim() !== "" && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
      setTag("");
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };
  
  const handleCreateNote = async () => {
    if (!user || title.trim() === "") return;
    
    try {
      const newNote = {
        user_id: user.id,
        title,
        content,
        category: tags.join(',') // Store tags as comma-separated string
      };
      
      // Add to Supabase
      const { data, error } = await supabase
        .from("notes")
        .insert(newNote)
        .select();
        
      if (error) {
        console.error("Error creating note:", error);
        toast.error("Failed to create note");
        return;
      }
      
      // Update local state
      if (data && data.length > 0) {
        const createdNote = {
          ...data[0],
          tags: tags
        };
        
        setNotes([createdNote, ...notes]);
        resetForm();
        toast.success("Note created successfully");
      }
    } catch (error) {
      console.error("Error in create note flow:", error);
      toast.error("Failed to create note");
    }
  };
  
  const handleUpdateNote = async () => {
    if (!user || activeNote === null) return;
    
    try {
      const updatedNote = {
        title,
        content,
        category: tags.join(','), // Store tags as comma-separated string
      };
      
      // Update in Supabase
      const { error } = await supabase
        .from("notes")
        .update(updatedNote)
        .eq("id", activeNote);
        
      if (error) {
        console.error("Error updating note:", error);
        toast.error("Failed to update note");
        return;
      }
      
      // Update local state
      setNotes(notes.map(note => 
        note.id === activeNote ? { ...note, title, content, tags } : note
      ));
      
      resetForm();
      toast.success("Note updated successfully");
    } catch (error) {
      console.error("Error in update note flow:", error);
      toast.error("Failed to update note");
    }
  };
  
  const handleSelectNote = (note: NoteData) => {
    setActiveNote(note.id!);
    setTitle(note.title);
    setContent(note.content || "");
    setTags(note.tags || []);
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
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : notes.length === 0 ? (
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
                      <span className="text-xs text-muted-foreground">
                        {note.created_at ? new Date(note.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{note.content}</p>
                    {note.tags && note.tags.length > 0 && (
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
