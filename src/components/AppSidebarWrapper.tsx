import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Loader2 } from 'lucide-react';

type Screen = 'home' | 'draft' | 'export' | 'settings' | 'profile' | 'analytics' | 'education' | 'team' | 'copilot' | 'history' | 'admin' | 'instructions';

interface AppSidebarWrapperProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function AppSidebarWrapper({ currentScreen, onNavigate }: AppSidebarWrapperProps) {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { data: analytics, loading: analyticsLoading } = useAnalytics();

  if (authLoading) {
    return (
      <div className="w-64 flex items-center justify-center border-r border-border">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const userProfile = {
    name: profile?.full_name || user?.email || 'User',
    role: profile?.job_title || 'Nurse',
    avatar: profile?.avatar_url,
    stats: {
      totalNotes: analytics.totalNotes,
      timeSaved: analytics.timeSaved,
      notesThisWeek: analytics.notesThisWeek,
    },
  };

  return (
    <AppSidebar
      currentScreen={currentScreen}
      onNavigate={onNavigate}
      userProfile={userProfile}
      onSignOut={signOut}
    />
  );
}