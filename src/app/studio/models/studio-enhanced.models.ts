/**
 * Enhanced Studio Models for Professional Video Editing
 * Comprehensive type definitions for all studio components
 */

export interface VideoClipEnhanced extends VideoClip {
  // Enhanced properties for professional editing
  waveformData?: number[];
  waveformUrl?: string;
  thumbnails?: string[]; // Multiple thumbnails for scrubbing
  markers?: ClipMarker[];
  audioTracks?: AudioTrack[];
  videoTracks?: VideoTrack[];
  metadata?: VideoMetadata;
  processingStatus?: 'uploading' | 'processing' | 'ready' | 'error';
  uploadProgress?: number;
}

export interface VideoMetadata {
  codec: string;
  bitrate: number;
  frameRate: number;
  aspectRatio: string;
  colorSpace: string;
  audioCodec?: string;
  audioChannels?: number;
  audioSampleRate?: number;
  fileSize: number;
  createdAt: Date;
  modifiedAt: Date;
}

export interface TimelineState {
  zoom: number; // Pixels per second
  scrollPosition: number;
  playheadPosition: number;
  selectedClips: string[];
  snapToGrid: boolean;
  gridSize: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface StudioSettings {
  autoSave: boolean;
  autoSaveInterval: number; // seconds
  previewQuality: 'low' | 'medium' | 'high';
  waveformQuality: 'low' | 'medium' | 'high';
  maxUndoSteps: number;
  defaultTransitionDuration: number;
  snapTolerance: number;
}

export interface ProjectState {
  id: string;
  name: string;
  lastSaved: Date;
  isDirty: boolean;
  version: number;
  settings: StudioSettings;
  timeline: Timeline;
  resources: Resource[];
}

// Re-export existing models
export * from './studio.models';