"use client";

import { useState, useRef, useEffect } from "react";
import { StickyNote, Bold, Type, Palette, Save, X, List, Plus, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export function QuickNotes() {
  const [isOpen, setIsOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState("editor");
  const [mounted, setMounted] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const noteIdCounter = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Load all saved notes from localStorage when panel opens
    if (isOpen) {
      loadAllNotes();
    }
  }, [isOpen]);

  const loadAllNotes = () => {
    const notesJson = localStorage.getItem("employeeQuickNotes");
    if (notesJson) {
      try {
        const notes = JSON.parse(notesJson) as Note[];
        // Validate that it's an array
        if (Array.isArray(notes)) {
          setSavedNotes(notes);
          // Initialize counter based on existing notes
          const maxId = notes.reduce((max, note) => {
            const match = note.id.match(/note-(\d+)/);
            return match ? Math.max(max, parseInt(match[1])) : max;
          }, 0);
          noteIdCounter.current = maxId;
        } else {
          // Old data format, clear it
          console.log("Clearing old notes format");
          localStorage.removeItem("employeeQuickNotes");
          setSavedNotes([]);
        }
      } catch (error) {
        // Invalid JSON or old format, clear it
        console.log("Clearing invalid notes data");
        localStorage.removeItem("employeeQuickNotes");
        setSavedNotes([]);
      }
    }
  };

  const handleBold = () => {
    document.execCommand("bold", false);
    saveContent();
  };

  const handleFontSize = (size: string) => {
    document.execCommand("fontSize", false, size);
    saveContent();
  };

  const handleTextColor = (color: string) => {
    document.execCommand("foreColor", false, color);
    saveContent();
  };

  const saveContent = () => {
    // Content is auto-saved while typing
  };

  const handleSave = () => {
    if (!noteTitle.trim()) {
      toast.error("Please enter a note title!");
      return;
    }

    if (!editorRef.current) {
      toast.error("Editor not ready");
      return;
    }

    const content = editorRef.current.innerHTML;
    
    if (!content.trim() || content === '<br>') {
      toast.error("Please enter some content!");
      return;
    }
    
    const note: Note = currentNote
      ? { ...currentNote, title: noteTitle, content, updatedAt: new Date().toISOString() }
      : {
          id: `note-${++noteIdCounter.current}`,
          title: noteTitle,
          content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

    const updatedNotes = currentNote
      ? savedNotes.map((n) => (n.id === currentNote.id ? note : n))
      : [...savedNotes, note];

    try {
      localStorage.setItem("employeeQuickNotes", JSON.stringify(updatedNotes));
      setSavedNotes(updatedNotes);
      setCurrentNote(null);
      setNoteTitle("");
      if (editorRef.current) editorRef.current.innerHTML = "";
      
      // Switch to view tab to show the saved note
      setTimeout(() => {
        setActiveTab("view");
      }, 100);
      
      toast.success(currentNote ? "Note updated successfully!" : "Note saved successfully!");
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    }
  };

  const handleNewNote = () => {
    setCurrentNote(null);
    setNoteTitle("");
    if (editorRef.current) editorRef.current.innerHTML = "";
    setActiveTab("editor");
  };

  const handleViewNote = (note: Note) => {
    setCurrentNote(note);
    setNoteTitle(note.title);
    if (editorRef.current) editorRef.current.innerHTML = note.content;
    setActiveTab("editor");
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = savedNotes.filter((n) => n.id !== noteId);
    localStorage.setItem("employeeQuickNotes", JSON.stringify(updatedNotes));
    setSavedNotes(updatedNotes);
    toast.success("Note deleted!");
  };

  const handleClear = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      setNoteTitle("");
      setCurrentNote(null);
    }
  };

  const colors = [
    { name: "Black", value: "#000000" },
    { name: "Red", value: "#EF4444" },
    { name: "Blue", value: "#3B82F6" },
    { name: "Green", value: "#10B981" },
    { name: "Yellow", value: "#F59E0B" },
    { name: "Purple", value: "#A855F7" },
    { name: "Pink", value: "#EC4899" },
    { name: "Orange", value: "#F97316" },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" suppressHydrationWarning>
          <StickyNote className="h-5 w-5" />
          {mounted && savedNotes.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-bold">
              {savedNotes.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Quick Notes
          </SheetTitle>
          <SheetDescription>
            Create, view, and manage your personal notes
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {currentNote ? "Edit Note" : "New Note"}
            </TabsTrigger>
            <TabsTrigger value="view" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              My Notes ({savedNotes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="mt-4 space-y-4">
            {/* Note Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Note Title</label>
              <Input
                placeholder="Enter note title..."
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-3 border rounded-lg bg-muted/50">
            {/* Bold Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBold}
              title="Bold"
              className="h-8 w-8 p-0"
            >
              <Bold className="h-4 w-4" />
            </Button>

            {/* Font Size */}
            <Select onValueChange={handleFontSize}>
              <SelectTrigger className="h-8 w-[100px]">
                <Type className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Small</SelectItem>
                <SelectItem value="3">Normal</SelectItem>
                <SelectItem value="5">Large</SelectItem>
                <SelectItem value="7">X-Large</SelectItem>
              </SelectContent>
            </Select>

            {/* Text Color */}
            <div className="flex items-center gap-1">
              <Palette className="h-4 w-4 text-muted-foreground" />
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleTextColor(color.value)}
                  className="h-6 w-6 rounded border-2 border-background hover:border-foreground transition-colors"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

            {/* Editor */}
            <div
              ref={editorRef}
              contentEditable
              onInput={saveContent}
              className="min-h-[350px] w-full rounded-lg border p-4 focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              style={{
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
              suppressContentEditableWarning
            />

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {currentNote ? "Update Note" : "Save Note"}
              </Button>
              <Button onClick={handleClear} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Notes are saved locally in your browser
            </p>
          </TabsContent>

          <TabsContent value="view" className="mt-4 space-y-4">
            {savedNotes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <StickyNote className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No notes yet. Create your first note!
                  </p>
                  <Button onClick={handleNewNote} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Note
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {savedNotes.map((note) => (
                  <Card key={note.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{note.title}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(note.updatedAt).toLocaleDateString()} at{" "}
                            {new Date(note.updatedAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewNote(note)}
                            title="View/Edit"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteNote(note.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="text-sm line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: note.content }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

