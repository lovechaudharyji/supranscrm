"use client"

import { useState, useEffect } from "react"
import { X, Megaphone, Lightbulb, Heart, Info, Sparkles, Edit, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface AnnouncementData {
  type: 'announcement' | 'thought' | 'motivation' | 'note'
  title: string
  message: string
}

interface AnnouncementBannerProps {
  isAdmin?: boolean
  fixed?: boolean // Control whether banner is fixed or flows with page
}

const announcementTypes = [
  { 
    value: 'announcement', 
    label: 'Announcement', 
    icon: Megaphone, 
    gradient: 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700',
    textGradient: 'bg-gradient-to-r from-blue-100 to-blue-200'
  },
  { 
    value: 'thought', 
    label: 'Thought of the Day', 
    icon: Lightbulb, 
    gradient: 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500',
    textGradient: 'bg-gradient-to-r from-yellow-100 to-orange-100'
  },
  { 
    value: 'motivation', 
    label: 'Motivation', 
    icon: Heart, 
    gradient: 'bg-gradient-to-r from-pink-500 via-rose-500 to-red-500',
    textGradient: 'bg-gradient-to-r from-pink-100 to-rose-100'
  },
  { 
    value: 'note', 
    label: 'Note', 
    icon: Sparkles, 
    gradient: 'bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500',
    textGradient: 'bg-gradient-to-r from-purple-100 to-violet-100'
  },
]

export function AnnouncementBanner({ isAdmin = false, fixed = true }: AnnouncementBannerProps) {
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [formType, setFormType] = useState<string>('announcement')
  const [formTitle, setFormTitle] = useState('')
  const [formMessage, setFormMessage] = useState('')

  useEffect(() => {
    loadAnnouncement()
    const handler = () => setIsEditDialogOpen(true)
    window.addEventListener('open-announcement', handler)
    return () => window.removeEventListener('open-announcement', handler)
  }, [])

  const loadAnnouncement = async () => {
    setIsLoading(true)
    try {
      // Fetch announcement from any active employee (they all have the same announcement)
      const { data, error } = await supabase
        .from('Employee Directory')
        .select('Announcement')
        .eq('status', 'Active')
        .not('Announcement', 'is', null)
        .limit(1)
        .single()

      if (error) {
        if (error.code !== 'PGRST116') { // Not "no rows found"
          console.error('Error loading announcement:', error)
        }
        setAnnouncement(null)
      } else if (data?.Announcement) {
        try {
          const parsed = JSON.parse(data.Announcement) as AnnouncementData
          setAnnouncement(parsed)
        } catch {
          // Invalid JSON, ignore
          setAnnouncement(null)
        }
      }
    } catch (err) {
      console.error('Error loading announcement:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    // Store dismissal in localStorage with timestamp
    if (announcement) {
      localStorage.setItem('dismissed-announcement', Date.now().toString())
    }
  }

  const handleOpenEditDialog = () => {
    if (announcement) {
      setFormType(announcement.type)
      setFormTitle(announcement.title)
      setFormMessage(announcement.message)
    } else {
      setFormType('announcement')
      setFormTitle('')
      setFormMessage('')
    }
    setIsEditDialogOpen(true)
  }

  const handleSaveAnnouncement = async () => {
    if (!formTitle.trim() || !formMessage.trim()) {
      toast.error('Please fill in both title and message')
      return
    }

    setIsSaving(true)
    try {
      const announcementData: AnnouncementData = {
        type: formType as any,
        title: formTitle,
        message: formMessage,
      }

      const announcementJson = JSON.stringify(announcementData)

      // Update ALL active employees with this announcement
      const { error } = await supabase
        .from('Employee Directory')
        .update({ Announcement: announcementJson })
        .eq('status', 'Active')

      if (error) throw error

      setAnnouncement(announcementData)
      setIsDismissed(false)
      setIsEditDialogOpen(false)
      toast.success('Announcement published to all employees!')
      
      // Clear localStorage dismissals
      localStorage.removeItem('dismissed-announcement')
    } catch (error: any) {
      console.error('Error saving announcement:', error)
      const errorMsg = error?.message || 'Unknown error'
      toast.error(`Failed to save announcement: ${errorMsg}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAnnouncement = async () => {
    if (!announcement) return
    if (!confirm('Are you sure you want to delete this announcement for all employees?')) return

    setIsSaving(true)
    try {
      // Clear announcement from ALL active employees
      const { error } = await supabase
        .from('Employee Directory')
        .update({ Announcement: null })
        .eq('status', 'Active')

      if (error) throw error

      setAnnouncement(null)
      setIsDismissed(true)
      toast.success('Announcement deleted successfully!')
    } catch (error: any) {
      console.error('Error deleting announcement:', error)
      toast.error('Failed to delete announcement')
    } finally {
      setIsSaving(false)
    }
  }

  // Check if user dismissed this announcement
  useEffect(() => {
    if (announcement) {
      const dismissedTime = localStorage.getItem('dismissed-announcement')
      if (dismissedTime) {
        const dayInMs = 24 * 60 * 60 * 1000
        const timeSinceDismissal = Date.now() - parseInt(dismissedTime)
        if (timeSinceDismissal < dayInMs) {
          setIsDismissed(true)
        } else {
          localStorage.removeItem('dismissed-announcement')
        }
      }
    }
  }, [announcement])

  if (isLoading) {
    return null
  }

  if (!announcement || isDismissed) {
    // No visible banner; keep the editor mounted for header-triggered opening
    return isAdmin ? <>{renderEditDialog()}</> : null
  }

  const typeConfig = announcementTypes.find(t => t.value === announcement.type)
  const IconComponent = typeConfig?.icon || Info

  return (
    <>
      <div className={cn(
        "w-full border-b transition-all duration-300 overflow-hidden relative rounded-b-lg",
        fixed && "fixed top-0 left-0 right-0 z-50",
        typeConfig?.gradient || 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700',
        "text-white"
      )}>
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
        </div>
        
        {/* Moving gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-slide-left"></div>
        
        <div className="w-full px-3 py-2 relative z-10 overflow-hidden">
          <div className="flex items-start gap-2">
            {/* Fixed icon with label */}
            <div className="flex-shrink-0 mt-0 flex flex-col items-center">
              <div className="p-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                <IconComponent className="h-4 w-4 text-white drop-shadow-sm" />
              </div>
              <span className="text-xs text-white/80 font-medium mt-0.5 drop-shadow-sm">
                {(() => {
                  const selectedType = announcementTypes.find(t => t.value === announcement.type);
                  return selectedType?.label || 'Announcement';
                })()}
              </span>
            </div>
            
            {/* Animated text content container */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex animate-slide-left">
                {/* First copy of content */}
                <div className="flex-shrink-0 whitespace-nowrap mr-8">
                  <h3 className="font-bold text-lg mb-0.5 text-white drop-shadow-sm inline">{announcement.title}</h3>
                  <span className="text-white drop-shadow-sm mx-3">•</span>
                  <p className="text-sm opacity-95 whitespace-pre-wrap text-white drop-shadow-sm inline">{announcement.message}</p>
                </div>
                {/* Second copy of content for continuous loop */}
                <div className="flex-shrink-0 whitespace-nowrap mr-8">
                  <h3 className="font-bold text-lg mb-0.5 text-white drop-shadow-sm inline">{announcement.title}</h3>
                  <span className="text-white drop-shadow-sm mx-3">•</span>
                  <p className="text-sm opacity-95 whitespace-pre-wrap text-white drop-shadow-sm inline">{announcement.message}</p>
                </div>
                {/* Third copy for seamless transition */}
                <div className="flex-shrink-0 whitespace-nowrap mr-8">
                  <h3 className="font-bold text-lg mb-0.5 text-white drop-shadow-sm inline">{announcement.title}</h3>
                  <span className="text-white drop-shadow-sm mx-3">•</span>
                  <p className="text-sm opacity-95 whitespace-pre-wrap text-white drop-shadow-sm inline">{announcement.message}</p>
                </div>
              </div>
            </div>
            
            {/* Fixed buttons container */}
            <div className="flex-shrink-0 flex items-center gap-2">
              {isAdmin && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-white hover:bg-white/20 backdrop-blur-sm rounded-full"
                    onClick={handleOpenEditDialog}
                    title="Edit announcement"
                  >
                    <Edit className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-white hover:bg-white/20 backdrop-blur-sm rounded-full"
                    onClick={handleDeleteAnnouncement}
                    disabled={isSaving}
                    title="Delete announcement"
                  >
                    {isSaving ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <X className="h-5 w-5" />
                    )}
                  </Button>
                </>
              )}
              {!isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white hover:bg-white/20 backdrop-blur-sm rounded-full"
                  onClick={handleDismiss}
                  title="Dismiss"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {fixed && <div className="h-[60px]"></div>}
      {renderEditDialog()}
    </>
  )

  function renderEditDialog() {
    return (
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {(() => {
                const selectedType = announcementTypes.find(t => t.value === formType);
                const IconComp = selectedType?.icon || Megaphone;
                return (
                  <>
                    <div className={`p-2 rounded-lg ${selectedType?.gradient || 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700'}`}>
                      <IconComp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">
                        {announcement ? 'Edit Announcement' : 'Create New Announcement'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Type: <span className="font-medium text-foreground">{selectedType?.label || 'Announcement'}</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              This will be visible to all active employees
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="type">Announcement Type</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger id="type" className="h-12">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const selectedType = announcementTypes.find(t => t.value === formType);
                      const IconComp = selectedType?.icon || Megaphone;
                      return (
                        <>
                          <div className={`p-1.5 rounded-md ${selectedType?.gradient || 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700'}`}>
                            <IconComp className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium">{selectedType?.label || 'Select announcement type'}</span>
                        </>
                      );
                    })()}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {announcementTypes.map((type) => {
                    const IconComp = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-md ${type.gradient}`}>
                            <IconComp className="h-4 w-4 text-white" />
                          </div>
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Announcement Content Header */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
              {(() => {
                const selectedType = announcementTypes.find(t => t.value === formType);
                const IconComp = selectedType?.icon || Megaphone;
                return (
                  <>
                    <div className={`p-2 rounded-lg ${selectedType?.gradient || 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700'}`}>
                      <IconComp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Writing Your {selectedType?.label || 'Announcement'}</div>
                      <div className="text-sm text-muted-foreground">This content will be displayed to all employees</div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Announcement Title</Label>
              <Input
                id="title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Enter announcement title..."
                disabled={isSaving}
                className="h-12"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Announcement Message</Label>
              <Textarea
                id="message"
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                placeholder="Enter announcement message..."
                className="min-h-[150px] resize-none"
                disabled={isSaving}
              />
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className={cn(
                "rounded-lg p-4 border-2 overflow-hidden relative",
                announcementTypes.find(t => t.value === formType)?.gradient || 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700',
                "text-white"
              )}>
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
                </div>
                
                {/* Moving gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-slide-left"></div>
                
                <div className="flex items-start gap-3 relative z-10 overflow-hidden">
                  {/* Fixed icon with label */}
                  <div className="flex-shrink-0 mt-0.5 flex flex-col items-center">
                    <div className="p-1 rounded-full bg-white/20 backdrop-blur-sm">
                      {(() => {
                        const IconComp = announcementTypes.find(t => t.value === formType)?.icon || Info
                        return <IconComp className="h-5 w-5 text-white drop-shadow-sm" />
                      })()}
                    </div>
                    <span className="text-xs text-white/80 font-medium mt-1 drop-shadow-sm">
                      {(() => {
                        const selectedType = announcementTypes.find(t => t.value === formType);
                        return selectedType?.label || 'Announcement';
                      })()}
                    </span>
                  </div>
                  
                  {/* Animated text content container */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="animate-slide-left">
                      <h3 className="font-semibold text-sm mb-1 text-white drop-shadow-sm">
                        {formTitle || 'Your title here...'}
                      </h3>
                      <p className="text-sm opacity-95 whitespace-pre-wrap text-white drop-shadow-sm">
                        {formMessage || 'Your message here...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveAnnouncement} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Megaphone className="h-4 w-4 mr-2" />
                  Publish to All Employees
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
}
