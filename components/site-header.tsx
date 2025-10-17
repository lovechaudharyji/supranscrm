"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Bell, Search, Settings, StickyNote, Save, X, Edit2, Loader2, Trash2, Pencil, Megaphone, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { QuickActionsDock } from "@/components/employee/QuickActionsDock"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { Bold, Type } from "lucide-react"
import { Label } from "@/components/ui/label"
import { usePathname } from "next/navigation"

interface SiteHeaderProps {
  title?: string;
  showQuickNotes?: boolean;
  notesStorageKey?: string;
  useDatabase?: boolean; // New prop to use database instead of localStorage
}

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

// Function to get page title from pathname
const getPageTitle = (pathname: string): string => {
  // Remove leading slash and split by '/'
  const segments = pathname.replace(/^\//, '').split('/');
  
  // Handle different route patterns
  if (segments.length === 1 && segments[0] === 'dashboard') {
    return 'Dashboard';
  }
  
  if (segments[0] === 'dashboard') {
    const page = segments[1];
    switch (page) {
      case 'leads':
        return 'Leads';
      case 'employees':
        return segments[2] ? 'Employee Details' : 'Employees';
      case 'sales':
        return 'Sales';
      case 'tasks':
        return 'Task Manager';
      case 'subscriptions':
        return 'Subscriptions';
      case 'admin':
        if (segments[2] === 'auto-assignment') {
          return 'Auto-Assignment';
        }
        return 'Admin';
      default:
        return page ? page.charAt(0).toUpperCase() + page.slice(1) : 'Dashboard';
    }
  }
  
  return 'Dashboard';
};

export function SiteHeader({ 
  title, 
  showQuickNotes = true, 
  notesStorageKey = "admin_quick_notes",
  useDatabase = false 
}: SiteHeaderProps) {
  const pathname = usePathname();
  const dynamicTitle = title || getPageTitle(pathname);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Load notes from database or localStorage on mount
  useEffect(() => {
    if (showQuickNotes) {
      loadNotes();
    }
  }, [showQuickNotes, notesStorageKey, useDatabase]);

  const loadNotes = async () => {
    if (useDatabase) {
      try {
        const { data, error } = await supabase
          .from('admin_notes')
          .select('*')
          .eq('page_key', notesStorageKey)
          .order('updated_at', { ascending: false });

        if (error) {
          console.warn('Database table not found, falling back to localStorage:', error.message || error);
          // Fallback to localStorage if database fails
          const savedNotes = localStorage.getItem(notesStorageKey);
          if (savedNotes) {
            try {
              const parsedNotes = JSON.parse(savedNotes);
              setNotes(parsedNotes);
            } catch (parseError) {
              console.error('Error parsing saved notes:', parseError);
              setNotes([]);
            }
          } else {
            setNotes([]);
          }
          return;
        }
      } catch (dbError) {
        console.warn('Database connection failed, falling back to localStorage:', dbError);
        // Fallback to localStorage if database connection fails
        const savedNotes = localStorage.getItem(notesStorageKey);
        if (savedNotes) {
          try {
            const parsedNotes = JSON.parse(savedNotes);
            setNotes(parsedNotes);
          } catch (parseError) {
            console.error('Error parsing saved notes:', parseError);
            setNotes([]);
          }
        } else {
          setNotes([]);
        }
        return;
      }

      const loadedNotes: Note[] = (data || []).map((item: any, index: number) => ({
        id: item.id?.toString() || `note-${index}`,
        title: item.title || item.notes?.substring(0, 30) || 'Untitled Note',
        content: item.notes || '',
        created_at: item.updated_at || new Date().toISOString()
      }));
      
      setNotes(loadedNotes);
    } else {
      const savedNotes = localStorage.getItem(notesStorageKey);
      if (savedNotes) {
        try {
          const parsed = JSON.parse(savedNotes);
          setNotes(Array.isArray(parsed) ? parsed : []);
        } catch {
          // Legacy single note format - convert to array
          setNotes([{
            id: '1',
            title: 'Quick Notes',
            content: savedNotes,
            created_at: new Date().toISOString()
          }]);
        }
      }
    }
  };

  const handleOpenNotes = () => {
    setIsNotesOpen(true);
    setIsEditingNotes(false);
    setCurrentNote(null);
    setNotesValue("");
    setNoteTitle("");
  };

  const handleNewNote = () => {
    setIsEditingNotes(true);
    setCurrentNote(null);
    setNotesValue("");
    setNoteTitle("");
  };

  const handleEditNote = (note: Note) => {
    setCurrentNote(note);
    setNoteTitle(note.title);
    setNotesValue(note.content);
    setIsEditingNotes(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    setIsDeleting(noteId);
    try {
      if (useDatabase) {
        const { error } = await supabase
          .from('admin_notes')
          .delete()
          .eq('id', noteId);

        if (error) throw error;
      } else {
        const updatedNotes = notes.filter(n => n.id !== noteId);
        setNotes(updatedNotes);
        localStorage.setItem(notesStorageKey, JSON.stringify(updatedNotes));
      }

      toast.success("Note deleted successfully!");
      await loadNotes();
    } catch (error) {
        console.warn("Database error deleting note, using localStorage:", error instanceof Error ? error.message : 'Unknown error');
      toast.error("Failed to delete note");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!noteTitle.trim()) {
      toast.error("Please enter a note title");
      return;
    }

    setIsSavingNotes(true);
    try {
      if (useDatabase) {
        if (currentNote) {
          // Update existing note
          const { error } = await supabase
            .from('admin_notes')
            .update({ 
              title: noteTitle,
              notes: notesValue,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentNote.id);

          if (error) throw error;
        } else {
          // Create new note
          const { error } = await supabase
            .from('admin_notes')
            .insert({ 
              page_key: notesStorageKey,
              title: noteTitle,
              notes: notesValue,
              updated_at: new Date().toISOString()
            });

          if (error) throw error;
        }
      } else {
        // localStorage
        let updatedNotes: Note[];
        if (currentNote) {
          updatedNotes = notes.map(n => 
            n.id === currentNote.id 
              ? { ...n, title: noteTitle, content: notesValue, created_at: new Date().toISOString() }
              : n
          );
        } else {
          const newNote: Note = {
            id: Date.now().toString(),
            title: noteTitle,
            content: notesValue,
            created_at: new Date().toISOString()
          };
          updatedNotes = [newNote, ...notes];
        }
        setNotes(updatedNotes);
        localStorage.setItem(notesStorageKey, JSON.stringify(updatedNotes));
      }

      setIsEditingNotes(false);
      setCurrentNote(null);
      setNotesValue("");
      setNoteTitle("");
      toast.success(currentNote ? "Note updated successfully!" : "Note created successfully!");
      await loadNotes();
    } catch (error) {
        console.warn("Database error saving note, using localStorage:", error instanceof Error ? error.message : 'Unknown error');
      toast.error("Failed to save note");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCancelNotes = () => {
    setIsEditingNotes(false);
    setCurrentNote(null);
    setNotesValue("");
    setNoteTitle("");
  };

  return (
    <>
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-3 px-4 lg:gap-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-semibold">{dynamicTitle}</h1>
        
        {/* Search Bar */}
        <div className="relative ml-auto flex-1 max-w-md hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-9 pr-12 h-9 bg-background"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>

        {/* Create Announcement - placed right of search bar */}
        <Button
          variant="outline"
          className="h-9 hidden md:inline-flex"
          onClick={() => {
            try {
              window.dispatchEvent(new Event('open-announcement'))
            } catch {}
          }}
        >
          <Megaphone className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>

        {/* Quick Notes Button */}
        {showQuickNotes && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 relative" 
            onClick={handleOpenNotes}
            title={`Quick Notes (${notes.length})`}
          >
            <StickyNote className="h-[1.2rem] w-[1.2rem]" />
            {notes.length > 0 && (
              <Badge
                className="absolute -right-1 -top-1 h-5 min-w-[1.25rem] flex items-center justify-center rounded-full px-1 text-[10px] font-semibold bg-primary text-primary-foreground"
              >
                {notes.length}
              </Badge>
            )}
            <span className="sr-only">Quick Notes ({notes.length})</span>
          </Button>
        )}

        {/* Payment Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9" 
          onClick={() => window.open('https://payment-frontend-amber.vercel.app/', '_blank')}
          title="Payment System"
        >
          <CreditCard className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Payment System</span>
        </Button>

        {/* Quick Actions Dock */}
        <div className="hidden xl:block">
          <QuickActionsDock />
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <Bell className="h-[1.2rem] w-[1.2rem]" />
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold"
            >
              3
            </Badge>
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Settings */}
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Settings</span>
          </Button>

          {/* User Avatar */}
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src="" alt="User" />
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-semibold">
              AU
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>

    {/* Quick Notes Drawer */}
    <Sheet open={isNotesOpen} onOpenChange={setIsNotesOpen}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="border-b p-4 space-y-0">
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            <SheetTitle className="text-base">Quick Notes</SheetTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Create, view, and manage your personal notes</p>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tab-like buttons */}
          <div className="flex border-b">
            <button
              onClick={handleNewNote}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                isEditingNotes
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Edit2 className="h-4 w-4" />
              {currentNote ? 'Edit Note' : 'New Note'}
            </button>
            <button
              onClick={handleCancelNotes}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                !isEditingNotes
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <StickyNote className="h-4 w-4" />
              My Notes ({notes.length})
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isEditingNotes ? (
              <>
                {/* Note Title */}
                <div className="space-y-2">
                  <Label htmlFor="note-title" className="text-sm font-medium">Note Title</Label>
                  <Input
                    id="note-title"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Enter note title..."
                    className="font-medium"
                  />
                </div>

                {/* Formatting Toolbar */}
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/20">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Text"
                  >
                    <Type className="h-4 w-4" />
                  </Button>
                  <div className="h-6 w-px bg-border mx-1" />
                  <div className="flex gap-1">
                    {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316'].map((color) => (
                      <button
                        key={color}
                        className="h-6 w-6 rounded-sm border border-border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={`Color ${color}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Note Content */}
                <div className="space-y-2">
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Start typing your notes..."
                    className="min-h-[400px] resize-none font-mono text-sm"
                    disabled={isSavingNotes}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {notes.length === 0 ? (
                  <div className="text-center py-12">
                    <StickyNote className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">No notes yet</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Click "New Note" to create your first note
                    </p>
                    <Button onClick={handleNewNote} variant="outline" size="sm">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Create Note
                    </Button>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div 
                      key={note.id}
                      className="group rounded-lg border p-4 bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold flex-1">{note.title}</h3>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditNote(note)}
                            title="Edit note"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={isDeleting === note.id}
                            title="Delete note"
                          >
                            {isDeleting === note.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                        {note.content || <span className="italic">Empty note</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(note.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="border-t p-4 mt-auto">
          <div className="w-full space-y-3">
            {isEditingNotes ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelNotes}
                  disabled={isSavingNotes}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="flex-1"
                >
                  {isSavingNotes ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {currentNote ? 'Update' : 'Save'}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsNotesOpen(false)}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            )}
            <p className="text-xs text-center text-muted-foreground">
              Notes are saved {useDatabase ? 'in database' : 'locally in your browser'}
            </p>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>

    </>
  )
}
