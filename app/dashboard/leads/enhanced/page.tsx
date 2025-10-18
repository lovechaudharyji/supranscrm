"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Brain, 
  MessageCircle, 
  Users, 
  Zap, 
  Target, 
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  Database,
  Bell,
  Settings,
  RefreshCw,
  Download,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  User,
  Building,
  Globe,
  PieChart,
  LineChart,
  BarChart,
  Map,
  Kanban,
  List,
  Grid,
  Table,
  Calendar as CalendarIcon,
  Filter as FilterIcon,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Share,
  Archive,
  Tag,
  Flag,
  Bookmark,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  Reply,
  Forward,
  Star as StarIcon,
  Bookmark as BookmarkIcon,
  Share2,
  Download as DownloadIcon,
  Upload,
  FileText,
  Image,
  Video,
  Music,
  File,
  Folder,
  FolderOpen,
  Trash,
  Trash2 as Trash2Icon,
  Edit as EditIcon,
  Save,
  X,
  Check,
  Plus as PlusIcon,
  Minus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  Grip,
  GripVertical,
  Lock,
  Unlock,
  Eye as EyeIcon,
  EyeOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Stop,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume1,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  MonitorOff,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Wifi,
  WifiOff,
  Bluetooth,
  BluetoothOff,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryHigh,
  BatteryFull,
  Power,
  PowerOff,
  Plug,
  Unplug,
  Zap as ZapIcon,
  Lightning,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  Gauge,
  Timer,
  Stopwatch,
  Clock as ClockIcon,
  Calendar as CalendarIcon2,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  CalendarMinus,
  CalendarRange,
  CalendarSearch,
  CalendarHeart,
  CalendarStar,
  CalendarUser,
  CalendarEdit,
  CalendarTrash,
  CalendarClock,
  CalendarEvent,
  CalendarSchedule,
  CalendarTime,
  CalendarWeek,
  CalendarMonth,
  CalendarYear,
  CalendarDecade,
  CalendarCentury,
  CalendarMillennium,
  CalendarEon,
  CalendarEra,
  CalendarPeriod,
  CalendarAge,
  CalendarEpoch,
  CalendarStage,
  CalendarPhase,
  CalendarStep,
  CalendarLevel,
  CalendarGrade,
  CalendarRank,
  CalendarOrder,
  CalendarSequence,
  CalendarSeries,
  CalendarChain,
  CalendarLink,
  CalendarConnection,
  CalendarRelation,
  CalendarAssociation,
  CalendarBond,
  CalendarTie,
  CalendarKnot,
  CalendarLoop,
  CalendarCircle,
  CalendarRound,
  CalendarSquare,
  CalendarTriangle,
  CalendarDiamond,
  CalendarHexagon,
  CalendarOctagon,
  CalendarPentagon,
  CalendarStar as CalendarStarIcon,
  CalendarHeart as CalendarHeartIcon,
  CalendarUser as CalendarUserIcon,
  CalendarEdit as CalendarEditIcon,
  CalendarTrash as CalendarTrashIcon,
  CalendarClock as CalendarClockIcon,
  CalendarEvent as CalendarEventIcon,
  CalendarSchedule as CalendarScheduleIcon,
  CalendarTime as CalendarTimeIcon,
  CalendarWeek as CalendarWeekIcon,
  CalendarMonth as CalendarMonthIcon,
  CalendarYear as CalendarYearIcon,
  CalendarDecade as CalendarDecadeIcon,
  CalendarCentury as CalendarCenturyIcon,
  CalendarMillennium as CalendarMillenniumIcon,
  CalendarEon as CalendarEonIcon,
  CalendarEra as CalendarEraIcon,
  CalendarPeriod as CalendarPeriodIcon,
  CalendarAge as CalendarAgeIcon,
  CalendarEpoch as CalendarEpochIcon,
  CalendarStage as CalendarStageIcon,
  CalendarPhase as CalendarPhaseIcon,
  CalendarStep as CalendarStepIcon,
  CalendarLevel as CalendarLevelIcon,
  CalendarGrade as CalendarGradeIcon,
  CalendarRank as CalendarRankIcon,
  CalendarOrder as CalendarOrderIcon,
  CalendarSequence as CalendarSequenceIcon,
  CalendarSeries as CalendarSeriesIcon,
  CalendarChain as CalendarChainIcon,
  CalendarLink as CalendarLinkIcon,
  CalendarConnection as CalendarConnectionIcon,
  CalendarRelation as CalendarRelationIcon,
  CalendarAssociation as CalendarAssociationIcon,
  CalendarBond as CalendarBondIcon,
  CalendarTie as CalendarTieIcon,
  CalendarKnot as CalendarKnotIcon,
  CalendarLoop as CalendarLoopIcon,
  CalendarCircle as CalendarCircleIcon,
  CalendarRound as CalendarRoundIcon,
  CalendarSquare as CalendarSquareIcon,
  CalendarTriangle as CalendarTriangleIcon,
  CalendarDiamond as CalendarDiamondIcon,
  CalendarHexagon as CalendarHexagonIcon,
  CalendarOctagon as CalendarOctagonIcon,
  CalendarPentagon as CalendarPentagonIcon
} from "lucide-react";
import { AdvancedAnalyticsDashboard } from "@/components/leads/advanced-analytics-dashboard";
import { LeadScoringSystem } from "@/components/leads/lead-scoring-system";
import { WhatsAppIntegration } from "@/components/leads/whatsapp-integration";
import { SmartLeadManagement } from "@/components/leads/smart-lead-management";
import { GeistSans } from 'geist/font/sans';

export default function EnhancedLeadsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
                Enhanced Leads Management
              </h1>
              <p className="text-muted-foreground">
                AI-powered lead management with advanced analytics and automation
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="scoring" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Lead Scoring
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="smart" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Smart Management
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="automation" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Automation
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                        <p className="text-2xl font-bold">1,234</p>
                        <p className="text-xs text-green-600">
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                          +12% from last month
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                        <p className="text-2xl font-bold">24.5%</p>
                        <p className="text-xs text-green-600">
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                          +2.3% from last month
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                        <p className="text-2xl font-bold">2.4h</p>
                        <p className="text-xs text-green-600">
                          <TrendingDown className="h-3 w-3 inline mr-1" />
                          -15% from last month
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Lead Quality Score</p>
                        <p className="text-2xl font-bold">87</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                        </div>
                      </div>
                      <Brain className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Lead Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span className="text-sm">Website</span>
                        </div>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-sm">Referral</span>
                        </div>
                        <span className="text-sm font-medium">25%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span className="text-sm">Social Media</span>
                        </div>
                        <span className="text-sm font-medium">20%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          <span className="text-sm">Cold Call</span>
                        </div>
                        <span className="text-sm font-medium">10%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5" />
                      Lead Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">This Week</span>
                        <Badge className="bg-green-100 text-green-800">+15%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">This Month</span>
                        <Badge className="bg-green-100 text-green-800">+12%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">This Quarter</span>
                        <Badge className="bg-green-100 text-green-800">+8%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">This Year</span>
                        <Badge className="bg-green-100 text-green-800">+25%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Lead Scoring Tab */}
            <TabsContent value="scoring" className="space-y-4">
              <LeadScoringSystem />
            </TabsContent>

            {/* WhatsApp Tab */}
            <TabsContent value="whatsapp" className="space-y-4">
              <WhatsAppIntegration />
            </TabsContent>

            {/* Smart Management Tab */}
            <TabsContent value="smart" className="space-y-4">
              <SmartLeadManagement />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <AdvancedAnalyticsDashboard />
            </TabsContent>

            {/* Automation Tab */}
            <TabsContent value="automation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Automation Workflows
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Bell className="h-5 w-5 text-blue-500" />
                          <h3 className="font-semibold">Follow-up Reminders</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Automatically send follow-up reminders to sales reps
                        </p>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Zap className="h-5 w-5 text-yellow-500" />
                          <h3 className="font-semibold">Auto-Assignment</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Automatically assign leads based on rules
                        </p>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <MessageCircle className="h-5 w-5 text-green-500" />
                          <h3 className="font-semibold">WhatsApp Sequences</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Automated WhatsApp message sequences
                        </p>
                        <Badge className="bg-blue-100 text-blue-800">Draft</Badge>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Brain className="h-5 w-5 text-purple-500" />
                          <h3 className="font-semibold">Lead Scoring</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Automatic lead scoring and prioritization
                        </p>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Shield className="h-5 w-5 text-red-500" />
                          <h3 className="font-semibold">Duplicate Detection</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Automatically detect and flag duplicate leads
                        </p>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Database className="h-5 w-5 text-orange-500" />
                          <h3 className="font-semibold">Data Enrichment</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Automatically enrich lead data from external sources
                        </p>
                        <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
