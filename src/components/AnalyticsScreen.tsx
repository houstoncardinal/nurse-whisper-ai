import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  FileText,
  Target,
  Calendar,
  Loader2,
  PieChart,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAnalytics } from '@/hooks/useAnalytics';

export function AnalyticsScreen() {
  const { data, loading, refresh } = useAnalytics();
  const [timeRange, setTimeRange] = useState('7days');

  const metrics = [
    {
      title: 'Total Notes',
      value: data.totalNotes.toString(),
      change: data.notesThisWeek,
      trend: 'up' as const,
      icon: FileText,
      color: 'text-primary',
      description: `${data.notesThisWeek} this week`,
    },
    {
      title: 'Time Saved',
      value: `${data.timeSaved}h`,
      change: 0,
      trend: 'neutral' as const,
      icon: Clock,
      color: 'text-success',
      description: 'Estimated time saved',
    },
    {
      title: 'This Month',
      value: data.notesThisMonth.toString(),
      change: 0,
      trend: 'neutral' as const,
      icon: Calendar,
      color: 'text-accent',
      description: 'Notes created this month',
    },
    {
      title: 'Avg Per Note',
      value: `${data.avgNoteTime}min`,
      change: 0,
      trend: 'neutral' as const,
      icon: Target,
      color: 'text-warning',
      description: 'Average documentation time',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mvp-app max-w-7xl mx-auto p-3 lg:p-6 space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-xs lg:text-sm text-muted-foreground">
            Track your documentation metrics and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refresh}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{metric.title}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </div>
              <div className={`p-2 rounded-lg bg-muted ${metric.color}`}>
                <metric.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Weekly Activity */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Weekly Activity</h2>
        <div className="space-y-3">
          {data.weeklyActivity.map((day) => (
            <div key={day.day} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{day.day}</span>
                <span className="text-muted-foreground">{day.notes} notes</span>
              </div>
              <Progress
                value={(day.notes / Math.max(...data.weeklyActivity.map(d => d.notes), 1)) * 100}
                className="h-2"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Template Breakdown */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Template Usage</h2>
          <PieChart className="h-5 w-5 text-muted-foreground" />
        </div>
        {Object.keys(data.templateBreakdown).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No notes created yet
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(data.templateBreakdown).map(([template, count]) => {
              const percentage = (count / data.totalNotes) * 100;
              return (
                <div key={template} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{template}</Badge>
                      <span className="text-muted-foreground">{count} notes</span>
                    </div>
                    <span className="font-medium">{Math.round(percentage)}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Insights */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Insights</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
            <TrendingUp className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Great Progress!</p>
              <p className="text-xs text-muted-foreground">
                You've created {data.notesThisWeek} notes this week, saving approximately {Math.round((data.notesThisWeek * 15) / 60 * 10) / 10} hours.
              </p>
            </div>
          </div>

          {data.totalNotes >= 10 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Target className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Milestone Reached</p>
                <p className="text-xs text-muted-foreground">
                  You've documented {data.totalNotes} clinical notes. Keep up the excellent work!
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}