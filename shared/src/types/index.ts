// Core types for AI Meeting Companion

export interface MeetingSession {
  id: string;
  title?: string;
  platform: MeetingPlatform;
  startTime: Date;
  endTime?: Date;
  participants: Participant[];
  status: SessionStatus;
  settings: SessionSettings;
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
  role?: ParticipantRole;
  joinTime: Date;
  leaveTime?: Date;
  isHost: boolean;
  isMuted: boolean;
  hasVideo: boolean;
}

export interface TranscriptSegment {
  id: string;
  sessionId: string;
  speakerId?: string;
  speakerName?: string;
  text: string;
  timestamp: Date;
  confidence: number;
  language?: string;
  duration?: number;
}

export interface MeetingAnalysis {
  sessionId: string;
  summary: string;
  actionItems: ActionItem[];
  keyTopics: Topic[];
  sentiment: SentimentAnalysis;
  jargonTerms: JargonTerm[];
  insights: Insight[];
  generatedAt: Date;
}

export interface ActionItem {
  id: string;
  text: string;
  assignee?: string;
  dueDate?: Date;
  priority: Priority;
  status: ActionItemStatus;
  extractedAt: Date;
  context?: string;
}

export interface Topic {
  id: string;
  name: string;
  keywords: string[];
  relevanceScore: number;
  timeSpent: number;
  segments: string[]; // transcript segment IDs
}

export interface SentimentAnalysis {
  overall: SentimentScore;
  timeline: SentimentTimePoint[];
  participants: ParticipantSentiment[];
}

export interface SentimentScore {
  positive: number;
  neutral: number;
  negative: number;
  compound: number;
}

export interface SentimentTimePoint {
  timestamp: Date;
  sentiment: SentimentScore;
  context?: string;
}

export interface ParticipantSentiment {
  participantId: string;
  sentiment: SentimentScore;
  engagement: number;
}

export interface JargonTerm {
  term: string;
  definition: string;
  category?: string;
  confidence: number;
  occurrences: number;
  context: string[];
}

export interface Insight {
  type: InsightType;
  title: string;
  description: string;
  confidence: number;
  relevantSegments: string[];
  actionable: boolean;
}

export interface SessionSettings {
  autoTranscribe: boolean;
  realTimeAnalysis: boolean;
  saveTranscripts: boolean;
  detectJargon: boolean;
  sentimentAnalysis: boolean;
  participantConsent: boolean;
  language: string;
  privacyMode: PrivacyMode;
}

// Enums
export enum MeetingPlatform {
  ZOOM = 'zoom',
  GOOGLE_MEET = 'google_meet',
  MICROSOFT_TEAMS = 'microsoft_teams',
  GENERIC = 'generic'
}

export enum SessionStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
  ERROR = 'error'
}

export enum ParticipantRole {
  HOST = 'host',
  PRESENTER = 'presenter',
  PARTICIPANT = 'participant',
  OBSERVER = 'observer'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum ActionItemStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum InsightType {
  DECISION = 'decision',
  CONCERN = 'concern',
  OPPORTUNITY = 'opportunity',
  RISK = 'risk',
  FOLLOW_UP = 'follow_up',
  BLOCKER = 'blocker'
}

export enum PrivacyMode {
  FULL = 'full',
  ANONYMOUS = 'anonymous',
  LOCAL_ONLY = 'local_only'
}

// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface TranscriptionRequest {
  audioData: ArrayBuffer;
  sessionId: string;
  format: AudioFormat;
  language?: string;
}

export interface TranscriptionResponse {
  transcript: TranscriptSegment;
  confidence: number;
  language: string;
}

export interface AnalysisRequest {
  sessionId: string;
  transcriptSegments: TranscriptSegment[];
  analysisTypes: AnalysisType[];
}

export interface AnalysisResponse {
  analysis: Partial<MeetingAnalysis>;
  processingTime: number;
}

export enum AudioFormat {
  WEBM = 'webm',
  MP3 = 'mp3',
  WAV = 'wav',
  OGG = 'ogg'
}

export enum AnalysisType {
  SUMMARY = 'summary',
  ACTION_ITEMS = 'action_items',
  SENTIMENT = 'sentiment',
  JARGON = 'jargon',
  TOPICS = 'topics',
  INSIGHTS = 'insights'
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: MessageType;
  payload: any;
  timestamp: Date;
  sessionId?: string;
}

export enum MessageType {
  // Client to Server
  JOIN_SESSION = 'join_session',
  LEAVE_SESSION = 'leave_session',
  AUDIO_CHUNK = 'audio_chunk',
  REQUEST_ANALYSIS = 'request_analysis',
  
  // Server to Client
  SESSION_JOINED = 'session_joined',
  SESSION_LEFT = 'session_left',
  TRANSCRIPT_UPDATE = 'transcript_update',
  ANALYSIS_UPDATE = 'analysis_update',
  ERROR = 'error',
  
  // Bidirectional
  HEARTBEAT = 'heartbeat'
}

// Extension-specific types
export interface ExtensionState {
  isActive: boolean;
  currentSession?: MeetingSession;
  isRecording: boolean;
  serverUrl: string;
  apiKey?: string;
  settings: SessionSettings;
}

export interface ContentScriptMessage {
  type: ContentMessageType;
  payload: any;
}

export enum ContentMessageType {
  INIT_SIDEBAR = 'init_sidebar',
  UPDATE_TRANSCRIPT = 'update_transcript',
  UPDATE_ANALYSIS = 'update_analysis',
  SHOW_NOTIFICATION = 'show_notification',
  TOGGLE_RECORDING = 'toggle_recording'
}
