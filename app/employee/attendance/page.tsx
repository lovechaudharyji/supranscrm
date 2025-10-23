"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, CheckCircle, XCircle, AlertTriangle, Wifi, Monitor, RefreshCw, User, Table as TableIcon, Calendar as CalendarIcon2, TrendingUp, Clock3, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface AttendanceRecord {
  whalesync_postgres_id?: string;
  employee: string;
  full_name_from_employee: string;
  date: string;
  time_in?: number;
  time_out?: number;
  status: string;
  working_hours?: number;
  employee_id_from_employee?: string;
}

export default function EmployeeAttendancePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [deviceInfo, setDeviceInfo] = useState({
    isPC: false,
    isCompanyWifi: false,
    ipAddress: ''
  });
  const [employeeInfo, setEmployeeInfo] = useState({
    id: '',
    name: '',
    isTechTeam: false,
    photo: ''
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check device restrictions only
  useEffect(() => {
    const checkDevice = () => {
      // Check if it's PC (not mobile)
      const isPC = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      setDeviceInfo({ isPC, isCompanyWifi: true, ipAddress: 'Any Network' });
      
      if (!isPC) {
        toast.error("Attendance can only be marked from PC/laptop");
        return;
      }
    };

    checkDevice();
  }, []);

  // Load employee info and today's attendance
  useEffect(() => {
    loadEmployeeInfo();
  }, []);

  // Ensure employee data is available for attendance marking
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoadingEmployee && !employeeInfo.name) {
        console.log('Setting fallback employee data for attendance marking...');
        setEmployeeInfo({
          id: 'employee-' + Date.now(),
          name: 'Employee',
          isTechTeam: false,
          photo: ''
        });
        setIsLoadingEmployee(false);
      }
    }, 500); // 0.5 second timeout for faster fallback

    return () => clearTimeout(timer);
  }, [isLoadingEmployee, employeeInfo.name]);

  // Load attendance when employee info is available
  useEffect(() => {
    if (employeeInfo.id) {
      loadTodayAttendance();
      loadAttendanceHistory();
    }
  }, [employeeInfo.id]);


  const loadEmployeeInfo = async () => {
    setIsLoadingEmployee(true);
    console.log('Loading employee info...');
    
    try {
      // First, get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }

      if (!user?.email) {
        console.log('No authenticated user found');
        throw new Error('No authenticated user');
      }

      console.log('Authenticated user email:', user.email);

      // Try to find the employee by email in Employee Directory
      const { data: employee, error: employeeError } = await supabase
        .from('Employee Directory')
        .select('whalesync_postgres_id, full_name, job_title, official_email, profile_photo, employment_type, work_mode')
        .eq('official_email', user.email)
        .single();

      console.log('Employee query result:', { employee, employeeError });

      if (employeeError) {
        console.error('Error finding employee:', employeeError);
        // Fallback: create employee info from user data
        const employeeName = user.email.split('@')[0];
        const capitalizedName = employeeName.charAt(0).toUpperCase() + employeeName.slice(1);
        
        console.log('Using fallback employee info:', {
          email: user.email,
          name: capitalizedName
        });

        setEmployeeInfo({
          id: 'employee-' + Date.now(),
          name: capitalizedName,
          isTechTeam: false,
          photo: ''
        });
      } else if (employee) {
        console.log('Found employee in database:', employee);
        setEmployeeInfo({
          id: employee.whalesync_postgres_id,
          name: employee.full_name || user.email.split('@')[0],
          isTechTeam: employee.job_title?.toLowerCase().includes('tech') || 
                     employee.job_title?.toLowerCase().includes('developer') ||
                     employee.job_title?.toLowerCase().includes('engineer') ||
                     false,
          photo: employee.profile_photo || ''
        });
      }

      setIsLoadingEmployee(false);
    } catch (error) {
      console.error('Error loading employee info:', error);
      console.log('Using fallback employee due to error');
      setEmployeeInfo({
        id: 'employee-' + Date.now(),
        name: 'Employee',
        isTechTeam: false,
        photo: ''
      });
      setIsLoadingEmployee(false);
    }
  };

  const loadTodayAttendance = async () => {
    try {
      // Wait for employee info to be loaded
      if (!employeeInfo.id) {
        console.log('No employee ID available for today\'s attendance');
        setAttendance(null);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      console.log('Loading today\'s attendance for employee:', employeeInfo.id, 'date:', today);
      
      // First, try to load from localStorage (more reliable)
      const localAttendance = localStorage.getItem('offline-attendance');
      if (localAttendance) {
        try {
          const parsedAttendance = JSON.parse(localAttendance);
          if (parsedAttendance.date === today) {
            console.log('Found today\'s attendance in localStorage:', parsedAttendance);
            setAttendance(parsedAttendance);
            return;
          }
        } catch (parseError) {
          console.log('Error parsing localStorage attendance:', parseError);
        }
      }

      // Try to load from database as secondary option
      try {
        const { data: attendanceData, error } = await supabase
          .from('Attendance')
          .select('*')
          .eq('employee', employeeInfo.id)
          .eq('date', today)
          .single();

        if (error) {
          console.error('Error loading today\'s attendance from database:', error);
          console.log('Error details:', JSON.stringify(error, null, 2));
          console.log('No attendance found for today');
          setAttendance(null);
          return;
        }

        if (attendanceData) {
          console.log('Today\'s attendance loaded from database:', attendanceData);
          setAttendance(attendanceData);
        } else {
          console.log('No attendance found for today');
          setAttendance(null);
        }
      } catch (dbError) {
        console.error('Database error, using localStorage fallback:', dbError);
        console.log('No attendance found for today');
        setAttendance(null);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
      console.log('Error details:', JSON.stringify(error, null, 2));
      console.log('Setting attendance to null due to catch error');
      setAttendance(null);
    }
  };

  // Load attendance history
  const loadAttendanceHistory = async () => {
    if (!employeeInfo.id) {
      console.log('No employee ID available for attendance history');
      setAttendanceHistory([]);
      setIsLoadingHistory(false);
      return;
    }
    
    setIsLoadingHistory(true);
    try {
      console.log('Loading attendance history for employee:', employeeInfo.id);
      
      // First, try to load from localStorage (more reliable)
      const localAttendance = localStorage.getItem('offline-attendance');
      if (localAttendance) {
        try {
          const parsedAttendance = JSON.parse(localAttendance);
          console.log('Found attendance in localStorage:', parsedAttendance);
          setAttendanceHistory([parsedAttendance]);
          setIsLoadingHistory(false);
          return;
        } catch (parseError) {
          console.log('Error parsing localStorage attendance:', parseError);
        }
      }

      // Try to load from database as secondary option
      try {
        const { data, error } = await supabase
          .from('Attendance')
          .select('*')
          .eq('employee', employeeInfo.id)
          .order('date', { ascending: false })
          .limit(30);

        if (error) {
          console.error('Error loading attendance history from database:', error);
          console.log('Error details:', JSON.stringify(error, null, 2));
          console.log('No attendance history found');
          setAttendanceHistory([]);
          return;
        }

        console.log('Attendance history loaded from database:', data?.length || 0, 'records');
        setAttendanceHistory(data || []);
      } catch (dbError) {
        console.error('Database error, using localStorage fallback:', dbError);
        console.log('No attendance history found');
        setAttendanceHistory([]);
      }
    } catch (error) {
      console.error('Error loading attendance history:', error);
      console.log('Error details:', JSON.stringify(error, null, 2));
      console.log('Setting empty attendance history due to catch error');
      setAttendanceHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const calculateStatus = (checkInTime: string, isTechTeam: boolean): string => {
    const now = new Date();
    const checkIn = new Date(`${now.toISOString().split('T')[0]}T${checkInTime}`);
    
    // Office timings
    const officeStart = new Date(`${now.toISOString().split('T')[0]}T09:30:00`);
    const techStart = new Date(`${now.toISOString().split('T')[0]}T10:00:00`);
    const halfDayCutoff = new Date(`${now.toISOString().split('T')[0]}T12:00:00`);
    
    const startTime = isTechTeam ? techStart : officeStart;
    const gracePeriod = 15; // 15 minutes
    
    // Check if after half day cutoff
    if (checkIn >= halfDayCutoff) {
      return 'Half Day';
    }
    
    // Check if within grace period
    const diffMinutes = (checkIn.getTime() - startTime.getTime()) / (1000 * 60);
    
    if (diffMinutes <= gracePeriod) {
      return 'Present';
    } else {
      return 'Late';
    }
  };

  const handleCheckIn = async () => {
    if (!deviceInfo.isPC) {
      toast.error("Attendance can only be marked from PC/laptop");
      return;
    }

    // Check if already checked in today
    if (attendance && attendance.time_in) {
      toast.error("You have already checked in today!");
      return;
    }

    // Allow attendance marking even without proper employee data
    if (!employeeInfo.id) {
      console.log('No employee ID, using temporary ID');
    }

    setIsLoading(true);
    try {
      const now = new Date();
      const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5);
      const today = now.toISOString().split('T')[0];
      
      const status = calculateStatus(currentTimeStr, employeeInfo.isTechTeam);
      
      const attendanceData = {
        employee: employeeInfo.id || 'employee-' + Date.now(),
        full_name_from_employee: employeeInfo.name || 'Employee',
        date: today,
        time_in: parseFloat(currentTimeStr.replace(':', '.')),
        status: status,
        employee_id_from_employee: employeeInfo.id || 'employee-' + Date.now(),
        working_hours: 0
      };

      console.log('Saving attendance to localStorage:', attendanceData);

      // Save to localStorage first (most reliable)
      localStorage.setItem('offline-attendance', JSON.stringify(attendanceData));
      setAttendance(attendanceData);
      toast.success(`Check-in successful! Status: ${status}`);

      // Try to sync with database in background (optional)
      try {
        const { data, error } = await supabase
          .from('Attendance')
          .insert(attendanceData)
          .select();

        if (error) {
          console.error('Database sync error (non-critical):', error);
          console.log('Error details:', JSON.stringify(error, null, 2));
          console.log('Attendance saved locally, database sync failed');
          return;
        }

        console.log('Attendance synced to database:', data);
        
        // Update the attendance data with the returned ID
        const updatedAttendanceData = {
          ...attendanceData,
          whalesync_postgres_id: data[0]?.whalesync_postgres_id
        };

        setAttendance(updatedAttendanceData);
        console.log('Database sync successful');
      } catch (dbError) {
        console.error('Database sync error (non-critical):', dbError);
        console.log('Attendance saved locally, database sync failed');
      }
    } catch (error) {
      console.error('Error checking in:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      toast.error(`Failed to check in: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!attendance) return;

    // Check if already checked out today
    if (attendance.time_out) {
      toast.error("You have already checked out today!");
      return;
    }

    // Check if not checked in yet
    if (!attendance.time_in) {
      toast.error("Please check in first before checking out!");
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date();
      const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5);
      
      // Calculate working hours
      const checkInTime = new Date(`${attendance.date}T${attendance.time_in?.toString().replace('.', ':')}:00`);
      const checkOutTime = new Date(`${attendance.date}T${currentTimeStr}:00`);
      const workingHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      
      // Check for overtime
      const officeEnd = new Date(`${attendance.date}T18:30:00`);
      const techEnd = new Date(`${attendance.date}T18:00:00`);
      const endTime = employeeInfo.isTechTeam ? techEnd : officeEnd;
      
      let finalStatus = attendance.status;
      if (checkOutTime > endTime) {
        finalStatus = attendance.status + ' (Overtime)';
      }

      console.log('Updating attendance in localStorage:', {
        employee: attendance.employee,
        date: attendance.date,
        time_out: parseFloat(currentTimeStr.replace(':', '.')),
        working_hours: Math.round(workingHours * 100) / 100,
        status: finalStatus
      });

      // Update the local attendance data first (most reliable)
      const updatedAttendance = {
        ...attendance,
        time_out: parseFloat(currentTimeStr.replace(':', '.')),
        working_hours: Math.round(workingHours * 100) / 100,
        status: finalStatus
      };
      
      localStorage.setItem('offline-attendance', JSON.stringify(updatedAttendance));
      setAttendance(updatedAttendance);
      toast.success(`Check-out successful! Working hours: ${Math.round(workingHours * 100) / 100}h`);

      // Try to sync with database in background (optional)
      try {
        let data, error;

        // Try to update using the record ID first
        if (attendance.whalesync_postgres_id) {
          const result = await supabase
            .from('Attendance')
            .update({
              time_out: parseFloat(currentTimeStr.replace(':', '.')),
              working_hours: Math.round(workingHours * 100) / 100,
              status: finalStatus
            })
            .eq('whalesync_postgres_id', attendance.whalesync_postgres_id)
            .select();
          
          data = result.data;
          error = result.error;
        } else {
          // Fallback: find record by employee and date
          const result = await supabase
            .from('Attendance')
            .update({
              time_out: parseFloat(currentTimeStr.replace(':', '.')),
              working_hours: Math.round(workingHours * 100) / 100,
              status: finalStatus
            })
            .eq('employee', attendance.employee)
            .eq('date', attendance.date)
            .select();
          
          data = result.data;
          error = result.error;
        }

        if (error) {
          console.error('Database sync error (non-critical):', error);
          console.log('Error details:', JSON.stringify(error, null, 2));
          console.log('Attendance saved locally, database sync failed');
          return;
        }

        console.log('Attendance synced to database:', data);
        console.log('Database sync successful');
      } catch (dbError) {
        console.error('Database sync error (non-critical):', dbError);
        console.log('Attendance saved locally, database sync failed');
      }
    } catch (error) {
      console.error('Error checking out:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      toast.error(`Failed to check out: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('Present')) return 'bg-green-500';
    if (status.includes('Late')) return 'bg-yellow-500';
    if (status.includes('Half Day')) return 'bg-orange-500';
    if (status.includes('Absent')) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">

        {/* Employee Info & Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-primary" />
                  Employee Info
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadEmployeeInfo}
                  disabled={isLoadingEmployee}
                  className="border-primary/20 hover:bg-primary/10"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingEmployee ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEmployee ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
                  <div>
                    <p className="font-semibold">Loading...</p>
                    <p className="text-sm text-muted-foreground">Setting up attendance system</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={employeeInfo.photo} alt={employeeInfo.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">{employeeInfo.name?.split(' ').map(n => n[0]).join('') || 'E'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{employeeInfo.name || 'Employee'}</p>
                    <p className="text-sm text-muted-foreground">{employeeInfo.isTechTeam ? 'Tech Team' : 'Regular Team'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Monitor className="h-4 w-4 text-primary" />
                Device Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${deviceInfo.isPC ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">{deviceInfo.isPC ? 'PC/Laptop' : 'Mobile Device'}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Any Network Allowed</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                Current Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatTime(currentTime)}</div>
              <div className="text-sm text-muted-foreground">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Today's Attendance
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <TableIcon className="h-4 w-4" />
              Attendance History
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon2 className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
          </TabsList>

          {/* Today's Attendance Tab */}
          <TabsContent value="today" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5" />
                  Today's Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendance ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Check In</p>
                        <p className="text-lg font-semibold">{attendance.time_in ? attendance.time_in.toString().replace('.', ':') : 'Not marked'}</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Check Out</p>
                        <p className="text-lg font-semibold">{attendance.time_out ? attendance.time_out.toString().replace('.', ':') : 'Not marked'}</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="h-8 w-8 bg-blue-600 rounded-full mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={`${getStatusColor(attendance.status)} text-white`}>
                          {attendance.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {attendance.working_hours && (
                      <div className="text-center p-4 border rounded-lg">
                        <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Working Hours</p>
                        <p className="text-2xl font-bold">{attendance.working_hours}h</p>
                      </div>
                    )}

                    <div className="flex justify-center">
                      {!attendance.time_in ? (
                        <Button
                          onClick={handleCheckIn}
                          disabled={isLoading || !deviceInfo.isPC}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Check In Now
                        </Button>
                      ) : !attendance.time_out ? (
                        <div className="space-y-4 w-full max-w-md">
                          <div className="text-center p-4 border rounded-lg">
                            <p className="text-sm text-muted-foreground">Current Time</p>
                            <p className="text-xl font-bold">{formatTime(currentTime)}</p>
                          </div>
                          <Button
                            onClick={handleCheckOut}
                            disabled={isLoading}
                            className="bg-red-600 hover:bg-red-700 w-full"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Check Out Now
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center p-6 border rounded-lg">
                          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                          <p className="text-lg font-semibold">Attendance completed for today</p>
                          <p className="text-sm text-muted-foreground">Great job! See you tomorrow.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="p-6 border rounded-lg">
                      <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                      <p className="text-lg font-semibold">No attendance marked for today</p>
                      <p className="text-sm text-muted-foreground">Ready to start your workday?</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Current Time</p>
                        <p className="text-xl font-bold">{formatTime(currentTime)}</p>
                      </div>
                      <Button
                        onClick={handleCheckIn}
                        disabled={isLoading || !deviceInfo.isPC}
                        className="bg-green-600 hover:bg-green-700 w-full"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Check In Now
                      </Button>
                    </div>
                    
                    {!deviceInfo.isPC && (
                      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-600 font-medium">
                          Please use PC/laptop to mark attendance
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TableIcon className="h-5 w-5" />
                  Attendance History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading attendance history...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Check In</TableHead>
                          <TableHead>Check Out</TableHead>
                          <TableHead>Working Hours</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceHistory.map((record, index) => (
                          <TableRow key={record.whalesync_postgres_id || `attendance-${index}-${record.date}`}>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>{record.time_in ? record.time_in.toString().replace('.', ':') : '-'}</TableCell>
                            <TableCell>{record.time_out ? record.time_out.toString().replace('.', ':') : '-'}</TableCell>
                            <TableCell>{record.working_hours ? `${record.working_hours}h` : '-'}</TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(record.status)} text-white`}>
                                {record.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar View Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon2 className="h-5 w-5" />
                  Calendar View
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                    />
                  </div>
                  <div className="lg:w-80">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Attendance Legend</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Present</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Half Day</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm">Absent</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">Late</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
