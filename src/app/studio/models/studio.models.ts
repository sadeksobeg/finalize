// OpenShot-inspired data models for professional video editing
export interface VideoTrack {
  id: string;
  name: string;
  locked: boolean;
  visible: boolean; // Changed from 'hidden' to 'visible' for OpenShot consistency
  muted: boolean;
  clips: VideoClip[];
  height?: number;
  color?: string;
  blendMode?: string;
  opacity?: number;
}

export interface AudioTrack {
  id: string;
  name: string;
  locked: boolean;
  visible: boolean;
  muted: boolean;
  clips: AudioClip[];
  height?: number;
  volume?: number;
  color?: string;
}

export interface VideoClip {
  id: string;
  name: string;
  resource: string;
  in: number;
  out: number;
  start: number;
  duration: number;
  trackIndex: number;
  selected?: boolean;
  color?: string;
  thumbnail?: string;
  waveform?: string; // Audio waveform for video clips
  effects?: Effect[]; // OpenShot-style effects
  keyframes?: Keyframe[]; // Animation keyframes
  properties: ClipProperties;
  // OpenShot-specific properties
  speed?: number;
  reverse?: boolean;
  linked?: boolean; // Linked to audio clip
  transitionIn?: Transition;
  transitionOut?: Transition;
  markers?: ClipMarker[];
  enabled?: boolean;
  alpha?: number; // Transparency
  blendMode?: string;
}

export interface AudioClip {
  id: string;
  name: string;
  resource: string;
  in: number;
  out: number;
  start: number;
  duration: number;
  trackIndex: number;
  selected?: boolean;
  volume: number;
  waveform?: number[];
  effects?: Effect[]; // Audio effects
  keyframes?: Keyframe[]; // Volume/pan keyframes
  // OpenShot-specific properties
  speed?: number;
  reverse?: boolean;
  linked?: boolean; // Linked to video clip
  transitionIn?: Transition;
  transitionOut?: Transition;
  markers?: ClipMarker[];
  enabled?: boolean;
  pan?: number; // Audio panning
  pitch?: number; // Pitch adjustment
}

// OpenShot-style Effect (replaces Filter)
export interface Effect {
  id: string;
  name: string;
  type: string;
  category: string;
  enabled: boolean;
  parameters: EffectParameter[];
  keyframes?: Keyframe[];
  order: number;
}

export interface EffectParameter {
  name: string;
  type: 'number' | 'boolean' | 'color' | 'text' | 'choice' | 'file';
  value: any;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  choices?: string[];
  description: string;
  keyframeable: boolean;
}

// OpenShot-style Keyframe system
export interface Keyframe {
  id: string;
  time: number;
  property: string;
  value: any;
  interpolation: 'linear' | 'bezier' | 'constant';
  handleLeft?: { x: number; y: number };
  handleRight?: { x: number; y: number };
  selected?: boolean;
}

// OpenShot-style Transitions
export interface Transition {
  id: string;
  name: string;
  type: string;
  duration: number;
  parameters: EffectParameter[];
  enabled: boolean;
}

// OpenShot-style Clip Markers
export interface ClipMarker {
  id: string;
  time: number;
  name: string;
  color: string;
  description?: string;
}

// Legacy Filter interface for backward compatibility
export interface Filter {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  parameters: { [key: string]: any };
}

export interface ClipProperties {
  position: { x: number; y: number };
  scale: { x: number; y: number };
  rotation: number;
  opacity: number;
  blend_mode: string;
}

export interface Timeline {
  fps: number;
  width: number;
  height: number;
  duration: number;
  position: number;
  scale: number;
  videoTracks: VideoTrack[];
  audioTracks: AudioTrack[];
}

export interface Project {
  name: string;
  timeline: Timeline;
  resources: Resource[];
  filters: Filter[];
}

// OpenShot-style Resource (Media)
export interface Resource {
  id: string;
  name: string;
  path: string;
  type: 'video' | 'audio' | 'image' | 'title' | 'color';
  duration?: number;
  fps?: number;
  width?: number;
  height?: number;
  thumbnail?: string;
  waveform?: number[];
  // OpenShot-specific properties
  fileSize?: number;
  format?: string;
  codec?: string;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  hasAlpha?: boolean;
  colorSpace?: string;
  imported?: Date;
  tags?: string[];
  folder?: string;
  metadata?: { [key: string]: any };
}

export interface PlaybackState {
  playing: boolean;
  position: number;
  speed: number;
  loop: boolean;
  volume: number;
  muted: boolean;
}

export interface ViewportState {
  zoom: number;
  offset: { x: number; y: number };
  grid: boolean;
  safe_areas: boolean;
  rulers: boolean;
}