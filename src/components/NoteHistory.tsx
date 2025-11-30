import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  User,
  Tag,
  ArrowUpDown,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotes } from '@/hooks/useNotes';
import { format } from 'date-fns';

export function NoteHistory() {
  const { notes, loading, deleteNote } = useNotes();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTemplate, setFilterTemplate] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'template'>('date');

  // Filter and sort notes
  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           note.transcript?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTemplate = filterTemplate === 'all' || note.template === filterTemplate;
      const matchesStatus = filterStatus === 'all' || note.status === filterStatus;
      return matchesSearch && matchesTemplate && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return a.template.localeCompare(b.template);
    });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalized':
        return 'bg-success/10 text-success border-success/20';
      case 'archived':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  return (
    <div className="mvp-app max-w-7xl mx-auto p-3 lg:p-6 space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold">Note History</h1>
          <p className="text-xs lg:text-sm text-muted-foreground">
            View and manage your clinical notes
          </p>
        </div>
        <Badge variant="outline" className="text-xs lg:text-sm">
          {filteredNotes.length} {filteredNotes.length === 1 ? 'Note' : 'Notes'}
        </Badge>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterTemplate} onValueChange={setFilterTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Templates</SelectItem>
              <SelectItem value="SOAP">SOAP</SelectItem>
              <SelectItem value="SBAR">SBAR</SelectItem>
              <SelectItem value="PIE">PIE</SelectItem>
              <SelectItem value="DAR">DAR</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="finalized">Finalized</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'template')}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="template">Template</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Notes List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notes found</h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm || filterTemplate !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first note to get started'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-base">{note.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {note.template}
                    </Badge>
                    <Badge className={getStatusColor(note.status)}>
                      {note.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(note.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(note.created_at), 'h:mm a')}
                    </div>
                  </div>

                  {note.transcript && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {note.transcript}
                    </p>
                  )}

                  {note.icd10_codes && note.icd10_codes.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {note.icd10_codes.slice(0, 3).map((code: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {code.code}
                        </Badge>
                      ))}
                      {note.icd10_codes.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{note.icd10_codes.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8"
                    onClick={() => toast.info('View feature coming soon')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8"
                    onClick={() => toast.info('Edit feature coming soon')}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}