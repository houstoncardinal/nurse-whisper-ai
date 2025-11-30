import { useState, useEffect } from 'react';
import { Mic, FileText, Download, Settings, Stethoscope, Menu, User, BarChart3, BookOpen, Users, Shield, Brain, MessageSquare, Sparkles } from 'lucide-react';
import { SimpleThemeToggle } from '@/components/ThemeToggle';
import { SyntheticAI } from '@/components/SyntheticAI';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomToolbar } from '@/components/MobileBottomToolbar';
import { SimpleMobileHeader } from '@/components/SimpleMobileHeader';
import { EnhancedMobileHeader } from '@/components/EnhancedMobileHeader';
import { PowerfulHeader } from '@/components/PowerfulHeader';
import { AppSidebarWrapper } from '@/components/AppSidebarWrapper';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MVPHomeScreen } from '@/components/MVPHomeScreen';
import { MVPDraftScreen } from '@/components/MVPDraftScreen';
import { MVPExportScreen } from '@/components/MVPExportScreen';
import { MVPSettingsScreen } from '@/components/MVPSettingsScreen';

import { UserProfile } from '@/components/UserProfile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { advancedTranscriptionService } from '@/lib/advancedTranscriptionService';
import { EnhancedAdminDashboard } from '@/components/EnhancedAdminDashboard';
import { InstructionsPage } from '@/components/InstructionsPage';
import { TeamManagementScreen } from '@/components/TeamManagementScreen';
import { AICopilotScreen } from '@/components/AICopilotScreen';
import { NoteHistory } from '@/components/NoteHistory';
import { AnalyticsScreen } from '@/components/AnalyticsScreen';
import { EducationScreen } from '@/components/EducationScreen';
import { RahaAIScreen } from '@/components/RahaAIScreen';
import { knowledgeBaseService } from '@/lib/knowledgeBase';
import { enhancedAIService } from '@/lib/enhancedAIService';
import { performanceService } from '@/lib/performanceService';
import { intelligentNoteDetectionService } from '@/lib/intelligentNoteDetection';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useNotes } from '@/hooks/useNotes';
import { useAI } from '@/hooks/useAI';

type Screen = 'home' | 'draft' | 'export' | 'settings' | 'profile' | 'analytics' | 'education' | 'team' | 'copilot' | 'history' | 'admin' | 'instructions';

interface NoteContent {
  [key: string]: string;
}

interface UserProfileData {
  name: string;
  email: string;
  role: string;
  credentials: string;
  phone?: string;
  location?: string;
  joinDate: string;
  avatar?: string;
  isSignedIn: boolean;
  preferences: {
    notifications: boolean;
    voiceSpeed: number;
    defaultTemplate: string;
    autoSave: boolean;
    darkMode: boolean;
  };
  stats: {
    totalNotes: number;
    timeSaved: number;
    accuracy: number;
    weeklyGoal: number;
    notesThisWeek: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }>;
}

const formatSectionName = (section: string): string => {
  return section
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const createTemplateFallback = (template: string, transcript: string): NoteContent => {
  const details = transcript?.trim() || 'No detailed narrative captured during this attempt.';
  const fallback: NoteContent = {};

  const addEpicDefaults = (entries: Array<{ key: string; value: string }>) => {
    entries.forEach(({ key, value }) => {
      fallback[key] = value;
    });
  };

  switch (template) {
    case 'SOAP':
      fallback.Subjective = `Patient reports: ${details}`;
      fallback.Objective = 'Document vital signs, focused assessment findings, and monitoring data.';
      fallback.Assessment = 'Summarize clinical impression based on current shift findings.';
      fallback.Plan = 'Outline nursing interventions, monitoring cadence, and escalation triggers.';
      break;
    case 'SBAR':
      fallback.Situation = `Current concern: ${details}`;
      fallback.Background = 'Include diagnosis, recent changes, and key history.';
      fallback.Assessment = 'Share clinical impression, pertinent positives/negatives, and risk level.';
      fallback.Recommendation = 'Specify needs (orders, labs, consults) and follow-up timing.';
      break;
    case 'PIE':
      fallback.Problem = `Primary issue described: ${details}`;
      fallback.Intervention = 'Document interventions performed this shift with times.';
      fallback.Evaluation = 'Describe patient response and next assessment milestone.';
      break;
    case 'DAR':
      fallback.Data = `Assessment data collected: ${details}`;
      fallback.Action = 'List nursing actions/interventions executed.';
      fallback.Response = 'Summarize patient response and effectiveness of interventions.';
      break;
    case 'shift-assessment':
      addEpicDefaults([
        { key: 'Patient Assessment', value: `Shift highlights: ${details}` },
        { key: 'Vital Signs', value: 'Document BP, HR, RR, Temp, SpO2, pain score with times.' },
        { key: 'Medications', value: 'List scheduled/PRN meds administered, tolerance, and pending doses.' },
        { key: 'Intake & Output', value: 'Capture IV/PO intake, urine/drain outputs, and fluid balance.' },
        { key: 'Treatments', value: 'Note wound care, therapies, procedures, or consults completed.' },
        { key: 'Communication', value: 'Record provider notifications, family updates, and handoff notes.' },
        { key: 'Safety', value: 'Include fall risk status, precautions, devices, or restraints.' },
        { key: 'Narrative', value: details }
      ]);
      break;
    case 'mar':
      addEpicDefaults([
        { key: 'Medication Information', value: `Medication-related note: ${details}` },
        { key: 'Administration Details', value: 'Document dose, route, time, double-checks, and safety checks.' },
        { key: 'Assessment', value: 'Record pre-administration assessments or required labs/vitals.' },
        { key: 'Response', value: 'Describe therapeutic effect and adverse reactions monitoring.' }
      ]);
      break;
    case 'io':
      addEpicDefaults([
        { key: 'Intake', value: 'Track PO, IV, enteral, and blood product intake with totals.' },
        { key: 'Output', value: 'Document urine, drains, stool, emesis, and insensible losses if applicable.' },
        { key: 'Balance', value: 'Summarize net balance and clinical interpretation.' },
        { key: 'Notes', value: details }
      ]);
      break;
    case 'wound-care':
      addEpicDefaults([
        { key: 'Location & Stage', value: `Wound narrative: ${details}` },
        { key: 'Size & Drainage', value: 'Record length/width/depth (cm), tunneling, drainage amount/type.' },
        { key: 'Wound Bed', value: 'Describe granulation/slough/eschar, edges, and peri-wound condition.' },
        { key: 'Interventions', value: 'Include cleansing solutions, dressings applied, and adjunct therapies.' },
        { key: 'Response', value: 'Document tolerance, pain, progress, and next dressing change time.' }
      ]);
      break;
    case 'safety-checklist':
      addEpicDefaults([
        { key: 'Fall Risk', value: `Risk summary: ${details}` },
        { key: 'Restraints', value: 'Note type, justification, assessments, and alternatives tried.' },
        { key: 'Isolation', value: 'Indicate isolation type/PPE requirements or note “Standard precautions”.' },
        { key: 'Patient ID', value: 'Confirm two patient identifiers matched before interventions.' },
        { key: 'Code Status', value: 'Document current code status and family/provider awareness.' }
      ]);
      break;
    case 'med-surg':
      addEpicDefaults([
        { key: 'Patient Education', value: `Education delivered: ${details}` },
        { key: 'Discharge Readiness', value: 'List checklist items completed and pending barriers.' },
        { key: 'Pain Management', value: 'Note pain scores, medication response, and multimodal strategies.' },
        { key: 'Mobility', value: 'Describe activity tolerance, assistance needed, and PT/OT involvement.' }
      ]);
      break;
    case 'icu':
      addEpicDefaults([
        { key: 'Hemodynamics', value: `Critical care focus: ${details}` },
        { key: 'Ventilator', value: 'Document mode, settings, ABG trends, and lung-protective strategies.' },
        { key: 'Devices', value: 'List invasive lines, drains, pacing wires, and integrity checks.' },
        { key: 'Drips', value: 'Include vasoactive, sedation, insulin, or other titrated infusions.' },
        { key: 'Sedation', value: 'Record RASS/SAS scores, sedation goals, and spontaneous awakening trials.' }
      ]);
      break;
    case 'nicu':
      addEpicDefaults([
        { key: 'Thermoregulation', value: `Infant status: ${details}` },
        { key: 'Feeding', value: 'Document feeding type, route, volumes, and tolerance.' },
        { key: 'Bonding', value: 'Describe parental presence, skin-to-skin, and education given.' },
        { key: 'Weight', value: 'Include daily weights and percent change from birth weight.' },
        { key: 'Development', value: 'Note tone, reflexes, positioning, and developmental care provided.' }
      ]);
      break;
    case 'mother-baby':
      addEpicDefaults([
        { key: 'Maternal Assessment', value: `Postpartum summary: ${details}` },
        { key: 'Newborn Assessment', value: 'Document VS, feeding cues, elimination, and screenings.' },
        { key: 'Feeding', value: 'Include latch quality, volumes, frequency, and lactation support.' },
        { key: 'Education', value: 'Highlight teaching topics (safe sleep, warning signs, follow-up).' }
      ]);
      break;
    default:
      fallback.Note = details;
      break;
  }

  return fallback;
};

export function MVPApp() {
  console.log('MVPApp rendering...');
  
  // Initialize hooks for real functionality
  const { user, profile, loading: authLoading, updateProfile: updateUserProfile, signOut } = useAuth();
  const { createNote } = useNotes();
  const { generateNote } = useAI();
  
  // Screen navigation
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  
  // Authentication state (kept for modal state only)
  
  // AI Assistant state
  const [showAI, setShowAI] = useState(false); // Start hidden - only show when clicked
  const [aiMinimized, setAiMinimized] = useState(true); // Start minimized when shown
  
  // User profile state - derived from Supabase auth
  const userProfile = {
    name: profile?.full_name || user?.email || 'Guest User',
    email: user?.email || '',
    role: profile?.job_title || 'Not Signed In',
    credentials: '',
    joinDate: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
    isSignedIn: !!user,
    preferences: {
      notifications: true,
      voiceSpeed: 50,
      defaultTemplate: 'SOAP',
      autoSave: true,
      darkMode: false
    },
    stats: {
      totalNotes: 0,
      timeSaved: 0,
      accuracy: 99.2,
      weeklyGoal: 50,
      notesThisWeek: 0
    },
    achievements: []
  };
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Voice recognition state
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  
  // Note data
  const [transcript, setTranscript] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('SOAP');
  const [noteContent, setNoteContent] = useState<NoteContent>({});
  const [editedNoteContent, setEditedNoteContent] = useState<NoteContent>({});
  const [templateLocked, setTemplateLocked] = useState(false);
  
  // Handle template change from home screen
  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);
    setTemplateLocked(true);
  };

  const handleSettingsChange = (settings: any) => {
    // Settings are now saved to database via profile updates
    toast.success('Settings saved successfully!');
  };

  // Initialize app
  useEffect(() => {
    // Load saved settings
    const savedSettings = localStorage.getItem('nursescribe_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setSelectedTemplate(settings.defaultTemplate || 'SOAP');
    }

    // Initialize analytics
    const analytics = JSON.parse(localStorage.getItem('nursescribe_analytics') || '{"totalNotes": 0, "totalTimeSaved": 0}');
    localStorage.setItem('nursescribe_analytics', JSON.stringify(analytics));

    // Initialize performance monitoring
    const performanceMetrics = performanceService.getMetrics();
    console.log('Performance metrics initialized:', performanceMetrics);
    
    // Prefetch knowledge base data
    performanceService.prefetch('knowledge-base-stats', () => 
      Promise.resolve(knowledgeBaseService.getKnowledgeStats())
    );

    // Initialize advanced transcription service
    const initializeTranscription = async () => {
      try {
        const isSupported = advancedTranscriptionService.isSupported();
        setVoiceSupported(isSupported);

        if (isSupported) {
          // Configure for medical transcription
          advancedTranscriptionService.setConfig({
            language: 'en-US',
            continuous: true,
            interimResults: true,
            maxAlternatives: 3,
            medicalContext: true,
            autoCorrect: true,
            punctuate: true
          });

          // Set up callbacks
          advancedTranscriptionService.setCallbacks({
            onResult: (result) => {
              if (result.isFinal) {
                // Final transcription with all enhancements applied
                setFinalTranscript(result.text);
                setTranscript(result.text);
                setInterimTranscript('');
                setIsProcessing(false);
                
                // Analyze the enhanced transcript
                const analysis = enhancedAIService.analyzeInput(result.text);
                const medicalTermsCount = analysis.medicalTerms.length;
                
                toast.success('🎯 Advanced Transcription Complete!', {
                  description: `Confidence: ${Math.round(result.confidence * 100)}% | Medical terms: ${medicalTermsCount} | ${result.words.length} words`
                });
              } else {
                // Interim results with real-time corrections
                setInterimTranscript(result.text);
                setTranscript(finalTranscript + ' ' + result.text);
              }
            },
            onError: (error) => {
              console.error('Transcription error:', error);
              setIsRecording(false);
              setIsProcessing(false);
              toast.error(error);
            },
            onStart: () => {
              console.log('🎤 Advanced transcription started');
              setIsRecording(true);
              setRecordingTime(0);
              setInterimTranscript('');
              setFinalTranscript('');
              setTranscript('');
              
              // Clear the service's accumulated transcript
              advancedTranscriptionService.clearTranscript();
              
              // Start recording timer
              const interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
              }, 1000);
              setRecordingInterval(interval);
              
              toast.success('🎤 Listening...', {
                description: 'Speak clearly - AI is processing your words',
                duration: 2000,
              });
            },
            onEnd: async () => {
              console.log('🎤 Advanced transcription ended');
              setIsRecording(false);
              
              // Clear recording timer
              if (recordingInterval) {
                clearInterval(recordingInterval);
                setRecordingInterval(null);
              }
              
              // Get the accumulated transcript from the service
              const currentTranscript = advancedTranscriptionService.getFinalTranscript();
              console.log('📝 Final accumulated transcript:', currentTranscript);
              console.log('📝 Transcript length:', currentTranscript.length);
              
              // Store in state for display
              setTranscript(currentTranscript);
              setFinalTranscript(currentTranscript);
              
              // Auto-generate note if we have a transcript
              if (currentTranscript && currentTranscript.trim()) {
                console.log('🤖 Auto-generating note from transcript');
                console.log('🤖 Selected template:', selectedTemplate);
                
                // Show processing state
                setIsProcessing(true);
                toast.info('🤖 Generating note...', {
                  description: `Creating ${selectedTemplate} note from your recording`,
                  duration: 2000,
                });
                
                try {
                  // Call real AI edge function
                  console.log('🤖 Calling AI edge function...');
                  const aiResult = await generateNote(currentTranscript, selectedTemplate);
                  
                  if (!aiResult.success || Object.keys(aiResult.content).length === 0) {
                    console.warn('⚠️ AI generation failed, using template fallback');
                    const fallbackContent = createTemplateFallback(selectedTemplate, currentTranscript);
                    setNoteContent(fallbackContent);
                    setEditedNoteContent(fallbackContent);
                    
                    toast.warning('⚠️ Using basic template', {
                      description: 'AI unavailable - please review carefully'
                    });
                  } else {
                    console.log('✅ AI generated content:', aiResult.content);
                    setNoteContent(aiResult.content);
                    setEditedNoteContent(aiResult.content);
                    
                    // Save to database in background
                    toast.success('💾 Saving note...', {
                      description: 'Your note is being saved',
                      duration: 1000,
                    });
                    
                    try {
                      await createNote({
                        title: `${selectedTemplate} Note - ${new Date().toLocaleDateString()}`,
                        template: selectedTemplate,
                        content: aiResult.content,
                        transcript: currentTranscript,
                        status: 'draft',
                      });
                      console.log('✅ Note saved to database');
                    } catch (dbError) {
                      console.error('Failed to save to database:', dbError);
                      toast.error('Failed to save note', {
                        description: 'Note is still available for editing'
                      });
                    }
                    
                    toast.success('🎯 Note Ready!', {
                      description: `${selectedTemplate} note created successfully`,
                      duration: 2000,
                    });
                  }
                  
                  // Auto-navigate to draft after short delay
                  setTimeout(() => {
                    setIsProcessing(false);
                    handleNavigate('draft');
                  }, 1000);
                  
                } catch (error: any) {
                  console.error('❌ AI generation failed:', error);
                  console.error('❌ Error details:', error.message, error.stack);
                  
                  // Create fallback content even on error
                  const fallbackContent = createTemplateFallback(selectedTemplate, currentTranscript);
                  setNoteContent(fallbackContent);
                  setEditedNoteContent(fallbackContent);
                  
                  toast.warning('⚠️ Basic note created', {
                    description: 'AI unavailable - please review and edit carefully',
                    duration: 3000,
                  });
                  
                  // Still navigate to draft
                  setTimeout(() => {
                    setIsProcessing(false);
                    handleNavigate('draft');
                  }, 1000);
                } finally {
                  setIsProcessing(false);
                }
              } else {
                // No transcript captured
                console.warn('⚠️ No transcript captured');
                toast.error('No speech detected', {
                  description: 'Please try recording again',
                });
                setIsProcessing(false);
              }
            }
          });
          
          console.log('✅ Advanced Transcription Service initialized successfully');
          console.log('🔬 Features enabled: Medical terminology, Auto-correct, Smart punctuation');
        } else {
          toast.error('Voice recognition not supported in this browser');
        }
      } catch (error) {
        console.error('Failed to initialize advanced transcription:', error);
        toast.error('Failed to initialize voice recognition');
      }
    };

    initializeTranscription();

    return () => {
      // Cleanup recording interval
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
      
      // Stop any ongoing transcription
      if (advancedTranscriptionService.getIsListening()) {
        advancedTranscriptionService.stopListening();
      }
    };
  }, []);

  // Handle screen navigation
  const handleNavigate = (screen: string) => {
    if (screen === 'history') {
      setCurrentScreen('history' as Screen);
      return;
    }
    if (screen === 'profile') {
      setCurrentScreen('profile' as Screen);
      return;
    }
    if (screen === 'analytics') {
      setCurrentScreen('analytics' as Screen);
      return;
    }
    if (screen === 'education') {
      setCurrentScreen('education' as Screen);
      return;
    }
    if (screen === 'team') {
      setCurrentScreen('team' as Screen);
      return;
    }
    if (screen === 'copilot') {
      setCurrentScreen('copilot' as Screen);
      return;
    }
    if (screen === 'admin') {
      setCurrentScreen('admin' as Screen);
      return;
    }

    setCurrentScreen(screen as Screen);
  };

  // Authentication is now handled by /auth page and useAuth hook
  const handleSignOut = async () => {
    await signOut();
    setCurrentScreen('home');
  };

  const handleUpdateProfile = async (updates: Partial<UserProfileData>) => {
    await updateUserProfile({
      full_name: updates.name,
      job_title: updates.role,
      department: updates.location,
    });
  };

  // Start recording with real voice recognition
  const handleStartRecording = async () => {
    console.log('🎤 Starting voice recording...');
    
    if (!voiceSupported) {
      toast.error('Voice recognition not supported in this browser');
      return;
    }

    // Prevent rapid toggling
    if (isRecording || isProcessing) {
      console.log('🎤 Already recording or processing, ignoring request');
      return;
    }

    try {
      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone permission granted');
      
      // Stop the stream as we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      // Now start advanced transcription
      await advancedTranscriptionService.startListening();
      console.log('✅ Advanced transcription started successfully');
      
    } catch (error: any) {
      console.error('❌ Failed to start voice recognition:', error);
      
      let errorMessage = 'Failed to start voice recognition';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is being used by another application. Please close other apps and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Microphone constraints cannot be satisfied. Please try a different microphone.';
      }
      
      toast.error(errorMessage);
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  // Stop recording with real voice recognition
  const handleStopRecording = () => {
    console.log('🎤 Stopping voice recording...');
    
    // Only stop if actually recording or listening
    if (!isRecording && !advancedTranscriptionService.getIsListening()) {
      console.log('🎤 Not currently recording, ignoring stop request');
      return;
    }
    
    console.log('🎤 Force stopping transcription...');
    
    // Force stop the recording
    setIsRecording(false);
    setIsProcessing(false);
    
    // Stop the transcription service
    if (advancedTranscriptionService.getIsListening()) {
      advancedTranscriptionService.stopListening();
    }
    
    // Clear any timers
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
    
    console.log('✅ Voice recording stopped successfully');
  };

  // Helper function to check if text is already formatted
  const isPreFormattedNote = (text: string, template: string): boolean => {
    const lowerText = text.toLowerCase();
    
    if (template === 'SOAP') {
      return (lowerText.includes('s:') || lowerText.includes('subjective:')) &&
             (lowerText.includes('o:') || lowerText.includes('objective:')) &&
             (lowerText.includes('a:') || lowerText.includes('assessment:')) &&
             (lowerText.includes('p:') || lowerText.includes('plan:'));
    } else if (template === 'SBAR') {
      return lowerText.includes('situation:') && lowerText.includes('background:') &&
             lowerText.includes('assessment:') && lowerText.includes('recommendation:');
    } else if (template === 'PIE') {
      return lowerText.includes('problem:') && lowerText.includes('intervention:') &&
             lowerText.includes('evaluation:');
    } else if (template === 'DAR') {
      return lowerText.includes('data:') && lowerText.includes('action:') &&
             lowerText.includes('response:');
    }
    
    return false;
  };

  // Helper function to parse pre-formatted note
  const parsePreFormattedNote = (text: string, template: string): NoteContent => {
    const noteContent: NoteContent = {};
    
    if (template === 'SOAP') {
      // Parse SOAP sections
      const sMatch = text.match(/(?:S:|Subjective:)\s*([\s\S]*?)(?=\n\s*(?:O:|Objective:)|$)/i);
      const oMatch = text.match(/(?:O:|Objective:)\s*([\s\S]*?)(?=\n\s*(?:A:|Assessment:)|$)/i);
      const aMatch = text.match(/(?:A:|Assessment:)\s*([\s\S]*?)(?=\n\s*(?:P:|Plan:)|$)/i);
      const pMatch = text.match(/(?:P:|Plan:)\s*([\s\S]*?)$/i);
      
      if (sMatch) noteContent.Subjective = sMatch[1].trim();
      if (oMatch) noteContent.Objective = oMatch[1].trim();
      if (aMatch) noteContent.Assessment = aMatch[1].trim();
      if (pMatch) noteContent.Plan = pMatch[1].trim();
    } else if (template === 'SBAR') {
      const sitMatch = text.match(/Situation:\s*([\s\S]*?)(?=\nBackground:|$)/i);
      const bgMatch = text.match(/Background:\s*([\s\S]*?)(?=\nAssessment:|$)/i);
      const assMatch = text.match(/Assessment:\s*([\s\S]*?)(?=\nRecommendation:|$)/i);
      const recMatch = text.match(/Recommendation:\s*([\s\S]*?)$/i);
      
      if (sitMatch) noteContent.Situation = sitMatch[1].trim();
      if (bgMatch) noteContent.Background = bgMatch[1].trim();
      if (assMatch) noteContent.Assessment = assMatch[1].trim();
      if (recMatch) noteContent.Recommendation = recMatch[1].trim();
    } else if (template === 'PIE') {
      const probMatch = text.match(/Problem:\s*([\s\S]*?)(?=\nIntervention:|$)/i);
      const intMatch = text.match(/Intervention:\s*([\s\S]*?)(?=\nEvaluation:|$)/i);
      const evalMatch = text.match(/Evaluation:\s*([\s\S]*?)$/i);
      
      if (probMatch) noteContent.Problem = probMatch[1].trim();
      if (intMatch) noteContent.Intervention = intMatch[1].trim();
      if (evalMatch) noteContent.Evaluation = evalMatch[1].trim();
    } else if (template === 'DAR') {
      const dataMatch = text.match(/Data:\s*([\s\S]*?)(?=\nAction:|$)/i);
      const actMatch = text.match(/Action:\s*([\s\S]*?)(?=\nResponse:|$)/i);
      const respMatch = text.match(/Response:\s*([\s\S]*?)$/i);
      
      if (dataMatch) noteContent.Data = dataMatch[1].trim();
      if (actMatch) noteContent.Action = actMatch[1].trim();
      if (respMatch) noteContent.Response = respMatch[1].trim();
    }
    
    return noteContent;
  };

  // Handle manual text input with AI enhancement and intelligent detection
  const handleManualTextSubmit = async (text: string) => {
    setIsProcessing(true);
    
    try {
      // Step 1: Intelligent note type detection
      const detectedType = intelligentNoteDetectionService.detectNoteType(text);
      
      // Auto-select detected template if confidence is high
      if (detectedType.confidence > 0.6 && !templateLocked && detectedType.template !== selectedTemplate) {
        setSelectedTemplate(detectedType.template);
        setTemplateLocked(false);
        toast.info(`🤖 Auto-detected ${detectedType.template} format`, {
          description: detectedType.reasoning
        });
      }
      
      // Step 2: Check if text is already formatted
      const isPreFormatted = isPreFormattedNote(text, detectedType.template);
      
      if (isPreFormatted) {
        // Parse pre-formatted note directly
        console.log('Pre-formatted note detected, parsing directly');
        const parsedContent = parsePreFormattedNote(text, detectedType.template);
        
        // Extract fields for display
        const extractedFields = intelligentNoteDetectionService.extractFields(text);
        
        // Show extracted vitals if found
        if (Object.keys(extractedFields.vitalSigns).length > 0) {
          const vitalsCount = Object.keys(extractedFields.vitalSigns).length;
          toast.success(`📊 Extracted ${vitalsCount} vital signs`, {
            description: 'Pre-formatted note parsed'
          });
        }
        
        setTranscript(text);
        setFinalTranscript(text);
        setInterimTranscript('');
        setNoteContent(parsedContent);
        setEditedNoteContent(parsedContent);
        
        console.log('Parsed pre-formatted content:', parsedContent);
        
        toast.success('✅ Pre-formatted Note Parsed!', {
          description: `${detectedType.template} sections extracted successfully`
        });
        
        handleNavigate('draft');
        return;
      }
      
      // Step 3: Extract and pre-fill fields
      const extractedFields = intelligentNoteDetectionService.extractFields(text);
      
      // Show extracted vitals if found
      if (Object.keys(extractedFields.vitalSigns).length > 0) {
        const vitalsCount = Object.keys(extractedFields.vitalSigns).length;
        toast.success(`📊 Extracted ${vitalsCount} vital signs`, {
          description: 'Pre-filled in your note'
        });
      }
      
      // Step 4: Optimize voice input using knowledge base
      const optimizedText = enhancedAIService.optimizeVoiceInput(text);
      
      // Step 5: Generate enhanced note using AI service with detected template
      const aiPrompt = {
        template: selectedTemplate as any,
        input: optimizedText,
        context: {
          chiefComplaint: extractedFields.symptoms[0] || optimizedText.substring(0, 100),
          medicalHistory: extractedFields.medications.map((m: any) => typeof m === 'string' ? m : m.name || m.medicationName || ''),
          currentMedications: extractedFields.medications.map((m: any) => typeof m === 'string' ? m : m.name || m.medicationName || '')
        }
      };

      const generatedNote = await performanceService.queueRequest(() => 
        enhancedAIService.generateNote(aiPrompt)
      );

      // Set the generated content
      setTranscript(text);
      setFinalTranscript(text);
      setInterimTranscript('');
      
      // Store AI-generated note content with proper capitalization for sections
      const noteContent: NoteContent = {};
      Object.entries(generatedNote.sections).forEach(([section, data]) => {
        const sectionKey = formatSectionName(section);
        noteContent[sectionKey] = data.content;
      });

      if (Object.keys(noteContent).length === 0) {
        console.warn('⚠️ No sections returned for manual text generation, using template fallback');
        Object.assign(noteContent, createTemplateFallback(selectedTemplate, text));
      }
      
      console.log('Generated note content:', noteContent);
      setNoteContent(noteContent);
      setEditedNoteContent(noteContent);

      // Show comprehensive success message
      toast.success('🎯 Intelligent Note Generated!', {
        description: `${detectedType.template} format | ${extractedFields.symptoms.length} symptoms | ${Object.keys(extractedFields.vitalSigns).length} vitals detected`
      });

      // Navigate to draft screen
      handleNavigate('draft');
      
    } catch (error) {
      console.error('AI note generation failed:', error);
      
      // Fallback to basic processing
      setTranscript(text);
      setFinalTranscript(text);
      setInterimTranscript('');
      
      const fallbackContent = createTemplateFallback(selectedTemplate, text);
      setNoteContent(fallbackContent);
      setEditedNoteContent(fallbackContent);
      
      toast.success('Text processed!', {
        description: 'Ready to review your note (basic mode)'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle paste text input with AI enhancement
  const handlePasteTextSubmit = async (text: string) => {
    setIsProcessing(true);
    
    try {
      // Optimize and analyze pasted text
      const optimizedText = enhancedAIService.optimizeVoiceInput(text);
      
      // Generate enhanced note using AI service
      const aiPrompt = {
        template: selectedTemplate as 'SOAP' | 'SBAR' | 'PIE' | 'DAR',
        input: optimizedText,
        context: {
          chiefComplaint: 'Pasted from EHR'
        }
      };

      const generatedNote = await performanceService.queueRequest(() => 
        enhancedAIService.generateNote(aiPrompt)
      );

      // Set the generated content
      setTranscript(text);
      setFinalTranscript(text);
      setInterimTranscript('');
      
      // Store AI-generated note content with proper capitalization
      const noteContent: NoteContent = {};
      Object.entries(generatedNote.sections).forEach(([section, data]) => {
        const sectionKey = formatSectionName(section);
        noteContent[sectionKey] = data.content;
      });

      if (Object.keys(noteContent).length === 0) {
        console.warn('⚠️ No sections returned for pasted text, using template fallback');
        Object.assign(noteContent, createTemplateFallback(selectedTemplate, text));
      }
      
      console.log('Generated note content from paste:', noteContent);
      console.log('Number of sections:', Object.keys(noteContent).length);
      
      setNoteContent(noteContent);
      setEditedNoteContent(noteContent);

      // Show success with AI insights
      toast.success('AI-Enhanced Note Generated!', {
        description: `Confidence: ${Math.round(generatedNote.overallConfidence * 100)}% | ICD-10: ${generatedNote.icd10Suggestions.suggestions.length} suggestions`
      });

      // Navigate to draft screen
      handleNavigate('draft');
      
    } catch (error) {
      console.error('AI note generation failed:', error);
      
      // Fallback to basic processing
      setTranscript(text);
      setFinalTranscript(text);
      setInterimTranscript('');
      
      const fallbackContent = createTemplateFallback(selectedTemplate, text);
      setNoteContent(fallbackContent);
      setEditedNoteContent(fallbackContent);
      
      toast.success('Text imported!', {
        description: 'Ready to review your note (basic mode)'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle new note creation
  const handleNewNote = () => {
    setTranscript('');
    setFinalTranscript('');
    setInterimTranscript('');
    setIsRecording(false);
    setIsProcessing(false);
    setRecordingTime(0);
    setCurrentScreen('home');
    setTemplateLocked(false);
    
    // Stop any ongoing transcription
    if (advancedTranscriptionService.getIsListening()) {
      advancedTranscriptionService.stopListening();
    }
    
    toast.info('Starting new note');
  };

  // Handle note editing
  const handleEditNote = (section: string, content: string) => {
    setEditedNoteContent(prev => ({
      ...prev,
      [section]: content
    }));
  };

  // Regenerate note
  const handleRegenerateNote = () => {
    setIsProcessing(true);
    
    // Simulate regeneration
    setTimeout(() => {
      setIsProcessing(false);
      toast.success('Note regenerated!', {
        description: 'AI has updated your note content'
      });
    }, 1500);
  };

  // Handle export completion
  const handleExportComplete = () => {
    // Update analytics
    const analytics = JSON.parse(localStorage.getItem('nursescribe_analytics') || '{"totalNotes": 0, "totalTimeSaved": 0}');
    analytics.totalNotes += 1;
    analytics.totalTimeSaved += 15; // Estimate 15 minutes saved
    localStorage.setItem('nursescribe_analytics', JSON.stringify(analytics));

    // Reset for new note
    setTimeout(() => {
      setCurrentScreen('home');
      setTranscript('');
      setNoteContent({});
      setEditedNoteContent({});
      setRecordingTime(0);
    }, 2000);
  };

  // Render current screen
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
            <MVPHomeScreen
              onNavigate={handleNavigate}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onManualTextSubmit={handleManualTextSubmit}
              onPasteTextSubmit={handlePasteTextSubmit}
              onTemplateChange={handleTemplateChange}
              isRecording={isRecording}
              isProcessing={isProcessing}
              recordingTime={recordingTime}
              transcript={transcript}
              selectedTemplate={selectedTemplate}
              interimTranscript={interimTranscript}
              voiceSupported={voiceSupported}
            />
        );
      
      case 'draft':
        return (
          <MVPDraftScreen
            onNavigate={handleNavigate}
            transcript={transcript}
            selectedTemplate={selectedTemplate}
            noteContent={noteContent}
            onEditNote={handleEditNote}
            onRegenerateNote={handleRegenerateNote}
            isProcessing={isProcessing}
          />
        );
      
      case 'export':
        return (
          <MVPExportScreen
            onNavigate={handleNavigate}
            noteContent={editedNoteContent}
            selectedTemplate={selectedTemplate}
            onExportComplete={handleExportComplete}
          />
        );
      
      case 'settings':
        return (
          <MVPSettingsScreen
            onNavigate={handleNavigate}
            onSettingsChange={handleSettingsChange}
          />
        );

      case 'profile':
        return (
          <UserProfile
            user={userProfile}
            onUpdate={handleUpdateProfile}
            onSignOut={handleSignOut}
          />
        );

      case 'history':
        return <NoteHistory />;

      case 'analytics':
        return <AnalyticsScreen />;

      case 'education':
        return <EducationScreen />;

      case 'team':
        return <TeamManagementScreen />;

      case 'copilot':
        return <AICopilotScreen />;

      case 'admin':
        return <EnhancedAdminDashboard />;

      case 'instructions':
        return <InstructionsPage onNavigate={handleNavigate} />;


      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-x-hidden">
      {/* Desktop Layout */}
      <div className="hidden lg:block overflow-x-hidden">
        <SidebarProvider>
          <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-x-hidden w-full">
            {/* Desktop Sidebar with Real Data */}
            <AppSidebarWrapper
              currentScreen={currentScreen}
              onNavigate={handleNavigate}
            />

            {/* Desktop Main Content */}
            <div className="flex-1 flex flex-col overflow-x-hidden">
            {/* Desktop Header */}
            <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
              <div className="px-8 py-6">
                <div className="flex items-center justify-between gap-4">
                  <SidebarTrigger className="-ml-2" />
                  <div className="flex-1">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900">
                      {currentScreen === 'home' && 'Start New Note'}
                      {currentScreen === 'draft' && 'Draft Preview'}
                      {currentScreen === 'export' && 'Export Note'}
                      {currentScreen === 'settings' && 'Settings'}
                      {currentScreen === 'profile' && 'Profile'}
                      {currentScreen === 'history' && 'Note History'}
                      {currentScreen === 'analytics' && 'Analytics Dashboard'}
                      {currentScreen === 'education' && 'Education Mode'}
                      {currentScreen === 'team' && 'Team Collaboration'}
                      {currentScreen === 'copilot' && 'AI Nurse Copilot'}
                      </h2>
                      <p className="text-slate-600 mt-1">
                      {currentScreen === 'home' && 'Create professional nursing documentation with AI assistance'}
                      {currentScreen === 'draft' && 'Review and edit your AI-generated note'}
                      {currentScreen === 'export' && 'Save and share your completed note'}
                      {currentScreen === 'settings' && 'Configure your app preferences and settings'}
                      {currentScreen === 'profile' && 'Manage your account and personal information'}
                      {currentScreen === 'history' && 'View and manage your past notes'}
                      {currentScreen === 'analytics' && 'Track your performance and productivity metrics'}
                      {currentScreen === 'education' && 'Practice with synthetic cases and improve your skills'}
                      {currentScreen === 'team' && 'Collaborate and share notes with your team'}
                      {currentScreen === 'copilot' && 'AI-powered care planning, bedside assist, and predictive insights'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Status Indicators */}
                    {isRecording && (
                      <Badge className="bg-red-50 text-red-600 border-red-200 px-3 py-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                        Recording
                      </Badge>
                    )}
                    {isProcessing && (
                      <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200 px-3 py-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse" />
                        Processing
                      </Badge>
                    )}
                    <Badge className="bg-green-50 text-green-600 border-green-200 px-3 py-1">
                      <Shield className="h-3 w-3 mr-1" />
                      HIPAA Compliant
                    </Badge>
                  </div>
                </div>
              </div>
            </header>

            {/* Desktop Content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
              {renderCurrentScreen()}
            </main>
            </div>
          </div>
        </SidebarProvider>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden">
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
          {/* Enhanced Mobile Header */}
          <EnhancedMobileHeader
            onNewNote={handleNewNote}
            onNavigate={handleNavigate}
            isRecording={isRecording}
            isProcessing={isProcessing}
            userProfile={{
              name: userProfile.name,
              role: userProfile.role,
              email: userProfile.email,
              isSignedIn: userProfile.isSignedIn
            }}
            onSignIn={() => window.location.href = '/auth'}
            onSignOut={handleSignOut}
          />

          {/* Mobile/Tablet Content */}
          <main className="flex-1 overflow-hidden pb-20 md:pb-0">
            {renderCurrentScreen()}
          </main>

          {/* Mobile Bottom Toolbar */}
          <div className="md:hidden">
              <MobileBottomToolbar
                currentScreen={currentScreen}
                onNavigate={handleNavigate}
              isRecording={isRecording}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </div>

      {/* Synthetic AI Assistant */}
      {showAI && (
        <SyntheticAI
          isMinimized={aiMinimized}
          onToggleMinimize={() => setAiMinimized(!aiMinimized)}
          onClose={() => setShowAI(false)}
          currentContext={{
            screen: currentScreen,
            template: selectedTemplate,
            hasTranscript: !!transcript,
            hasNote: Object.keys(noteContent).length > 0
          }}
          onAction={(action, data) => {
            // Handle AI actions
            switch(action) {
              case 'selectTemplate':
                setSelectedTemplate(data.template || data);
                toast.success(`Template changed to ${data.template || data}`);
                break;
              case 'startVoiceRecording':
                handleStartRecording();
                break;
              case 'stopVoiceRecording':
                handleStopRecording();
                break;
              case 'generateNote':
                if (transcript) {
                  handleNavigate('draft');
                } else {
                  toast.info('Please record or enter text first');
                }
                break;
              case 'export':
                handleNavigate('export');
                break;
              case 'checkCompliance':
                toast.info('Compliance check: All required fields present ✓');
                break;
              case 'clearNote':
                handleNewNote();
                break;
              case 'openICD10Search':
                toast.info('ICD-10 search feature coming soon!');
                break;
              case 'openVitalSigns':
                toast.info('Vital signs form coming soon!');
                break;
              default:
                console.warn('Unknown AI action:', action);
            }
          }}
        />
      )}
    </div>
  );
}
