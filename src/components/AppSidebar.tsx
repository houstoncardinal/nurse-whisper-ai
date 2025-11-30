import { useState } from 'react';
import { 
  Home, FileText, Download, Settings, User, BarChart3, 
  BookOpen, Users, Shield, Brain, History, Stethoscope,
  ChevronRight, Clock, TrendingUp, CheckCircle
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

type Screen = 'home' | 'draft' | 'export' | 'settings' | 'profile' | 'analytics' | 'education' | 'team' | 'copilot' | 'history' | 'admin' | 'instructions';

interface AppSidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  userProfile: {
    name: string;
    role: string;
    avatar?: string;
    stats?: {
      totalNotes: number;
      timeSaved: number;
      notesThisWeek: number;
    };
  };
}

const mainNavItems = [
  { id: 'home' as Screen, title: 'New Note', icon: Home, badge: null },
  { id: 'draft' as Screen, title: 'Draft Preview', icon: FileText, badge: null },
  { id: 'export' as Screen, title: 'Export', icon: Download, badge: null },
  { id: 'history' as Screen, title: 'History', icon: History, badge: null },
];

const toolsItems = [
  { id: 'copilot' as Screen, title: 'AI Copilot', icon: Brain, badge: 'AI' },
  { id: 'analytics' as Screen, title: 'Analytics', icon: BarChart3, badge: null },
  { id: 'education' as Screen, title: 'Education', icon: BookOpen, badge: null },
];

const adminItems = [
  { id: 'team' as Screen, title: 'Team', icon: Users, badge: null },
  { id: 'admin' as Screen, title: 'Admin', icon: Shield, badge: 'Admin' },
];

const bottomItems = [
  { id: 'settings' as Screen, title: 'Settings', icon: Settings, badge: null },
  { id: 'profile' as Screen, title: 'Profile', icon: User, badge: null },
];

export function AppSidebar({ currentScreen, onNavigate, userProfile }: AppSidebarProps) {
  const { state } = useSidebar();
  const [expandedGroup, setExpandedGroup] = useState<string | null>('main');

  const isActive = (id: Screen) => currentScreen === id;
  const collapsed = state === 'collapsed';

  const NavItem = ({ item }: { item: typeof mainNavItems[0] }) => (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => onNavigate(item.id)}
        isActive={isActive(item.id)}
        className="h-10 hover:bg-accent/50 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold transition-all"
      >
        <item.icon className={collapsed ? "h-5 w-5" : "h-4 w-4 mr-3"} />
        {!collapsed && (
          <span className="flex-1">{item.title}</span>
        )}
        {!collapsed && item.badge && (
          <Badge variant="secondary" className="text-xs">
            {item.badge}
          </Badge>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar
      className={collapsed ? "w-16" : "w-64"}
      collapsible="icon"
    >
      {/* Header */}
      <SidebarHeader className="border-b border-border/50 pb-4">
        <div className="px-4 pt-4 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <Stethoscope className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Raha
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 mx-auto">
              <Stethoscope className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="px-4 pt-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-semibold">
                  {userProfile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{userProfile.name}</p>
                <p className="text-xs text-muted-foreground truncate">{userProfile.role}</p>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="px-2 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Main</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        {/* Tools */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Tools</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        {/* Admin */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Administration</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Stats */}
        {!collapsed && userProfile.stats && (
          <>
            <Separator className="my-4" />
            <div className="px-4 py-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Quick Stats
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Time Saved
                  </span>
                  <span className="font-semibold text-foreground">{userProfile.stats.timeSaved}h</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3 w-3" />
                    This Week
                  </span>
                  <span className="font-semibold text-foreground">{userProfile.stats.notesThisWeek}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3" />
                    Total Notes
                  </span>
                  <span className="font-semibold text-foreground">{userProfile.stats.totalNotes}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border/50 pt-4 pb-4">
        <SidebarMenu>
          {bottomItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </SidebarMenu>
        
        {!collapsed && (
          <div className="px-4 pt-3">
            <div className="flex items-center gap-2 p-2 bg-success/10 rounded-lg border border-success/20">
              <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
              <span className="text-xs font-medium text-success">HIPAA Compliant</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
