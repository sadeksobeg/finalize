import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// OpenShot-style keyframe interfaces
export interface Keyframe {
  id: string;
  time: number;
  property: string;
  value: any;
  interpolation: InterpolationType;
  handleLeft?: { x: number; y: number };
  handleRight?: { x: number; y: number };
  selected?: boolean;
}

export interface KeyframeTrack {
  clipId: string;
  property: string;
  keyframes: Keyframe[];
  color: string;
  visible: boolean;
}

export enum InterpolationType {
  LINEAR = 'linear',
  BEZIER = 'bezier',
  CONSTANT = 'constant',
  EASE_IN = 'ease_in',
  EASE_OUT = 'ease_out',
  EASE_IN_OUT = 'ease_in_out'
}

export interface AnimationCurve {
  property: string;
  keyframes: Keyframe[];
  getValue(time: number): any;
}

@Injectable({
  providedIn: 'root'
})
export class KeyframesService {
  private keyframeTracks$ = new BehaviorSubject<Map<string, KeyframeTrack[]>>(new Map());
  private selectedKeyframes$ = new BehaviorSubject<Keyframe[]>([]);
  private clipboardKeyframes: Keyframe[] = [];

  constructor() {}

  getKeyframeTracks(clipId: string): Observable<KeyframeTrack[]> {
    return new Observable(observer => {
      this.keyframeTracks$.subscribe(tracksMap => {
        observer.next(tracksMap.get(clipId) || []);
      });
    });
  }

  getSelectedKeyframes(): Observable<Keyframe[]> {
    return this.selectedKeyframes$.asObservable();
  }

  // OpenShot-style keyframe management
  addKeyframe(clipId: string, property: string, time: number, value: any, interpolation: InterpolationType = InterpolationType.LINEAR): Keyframe {
    const keyframe: Keyframe = {
      id: this.generateKeyframeId(),
      time,
      property,
      value,
      interpolation,
      selected: false
    };

    const currentTracks = this.keyframeTracks$.value;
    let clipTracks = currentTracks.get(clipId) || [];
    
    // Find or create track for this property
    let track = clipTracks.find(t => t.property === property);
    if (!track) {
      track = {
        clipId,
        property,
        keyframes: [],
        color: this.getPropertyColor(property),
        visible: true
      };
      clipTracks.push(track);
    }

    // Insert keyframe in chronological order
    const insertIndex = track.keyframes.findIndex(kf => kf.time > time);
    if (insertIndex === -1) {
      track.keyframes.push(keyframe);
    } else {
      track.keyframes.splice(insertIndex, 0, keyframe);
    }

    currentTracks.set(clipId, clipTracks);
    this.keyframeTracks$.next(currentTracks);

    return keyframe;
  }

  removeKeyframe(clipId: string, keyframeId: string): void {
    const currentTracks = this.keyframeTracks$.value;
    const clipTracks = currentTracks.get(clipId) || [];

    clipTracks.forEach(track => {
      track.keyframes = track.keyframes.filter(kf => kf.id !== keyframeId);
    });

    // Remove empty tracks
    const nonEmptyTracks = clipTracks.filter(track => track.keyframes.length > 0);
    
    if (nonEmptyTracks.length === 0) {
      currentTracks.delete(clipId);
    } else {
      currentTracks.set(clipId, nonEmptyTracks);
    }

    this.keyframeTracks$.next(currentTracks);

    // Remove from selection if selected
    const selectedKeyframes = this.selectedKeyframes$.value;
    this.selectedKeyframes$.next(selectedKeyframes.filter(kf => kf.id !== keyframeId));
  }

  updateKeyframe(clipId: string, keyframeId: string, updates: Partial<Keyframe>): void {
    const currentTracks = this.keyframeTracks$.value;
    const clipTracks = currentTracks.get(clipId) || [];

    for (const track of clipTracks) {
      const keyframe = track.keyframes.find(kf => kf.id === keyframeId);
      if (keyframe) {
        Object.assign(keyframe, updates);
        
        // Re-sort keyframes if time changed
        if (updates.time !== undefined) {
          track.keyframes.sort((a, b) => a.time - b.time);
        }
        
        this.keyframeTracks$.next(currentTracks);
        break;
      }
    }
  }

  // OpenShot-style keyframe selection
  selectKeyframe(keyframe: Keyframe, addToSelection = false): void {
    let selectedKeyframes = this.selectedKeyframes$.value;
    
    if (!addToSelection) {
      // Clear previous selection
      selectedKeyframes.forEach(kf => kf.selected = false);
      selectedKeyframes = [];
    }

    keyframe.selected = true;
    if (!selectedKeyframes.includes(keyframe)) {
      selectedKeyframes.push(keyframe);
    }

    this.selectedKeyframes$.next(selectedKeyframes);
  }

  deselectAllKeyframes(): void {
    const selectedKeyframes = this.selectedKeyframes$.value;
    selectedKeyframes.forEach(kf => kf.selected = false);
    this.selectedKeyframes$.next([]);
  }

  deleteSelectedKeyframes(): void {
    const selectedKeyframes = this.selectedKeyframes$.value;
    const currentTracks = this.keyframeTracks$.value;

    selectedKeyframes.forEach(keyframe => {
      for (const [clipId, tracks] of currentTracks.entries()) {
        for (const track of tracks) {
          track.keyframes = track.keyframes.filter(kf => kf.id !== keyframe.id);
        }
        // Remove empty tracks
        const nonEmptyTracks = tracks.filter(track => track.keyframes.length > 0);
        if (nonEmptyTracks.length === 0) {
          currentTracks.delete(clipId);
        } else {
          currentTracks.set(clipId, nonEmptyTracks);
        }
      }
    });

    this.keyframeTracks$.next(currentTracks);
    this.selectedKeyframes$.next([]);
  }

  // OpenShot-style keyframe clipboard operations
  copySelectedKeyframes(): void {
    this.clipboardKeyframes = this.selectedKeyframes$.value.map(kf => ({
      ...kf,
      id: this.generateKeyframeId() // Generate new ID for paste
    }));
  }

  pasteKeyframes(clipId: string, timeOffset: number): void {
    if (this.clipboardKeyframes.length === 0) return;

    const baseTime = Math.min(...this.clipboardKeyframes.map(kf => kf.time));
    
    this.clipboardKeyframes.forEach(keyframe => {
      const newTime = timeOffset + (keyframe.time - baseTime);
      this.addKeyframe(clipId, keyframe.property, newTime, keyframe.value, keyframe.interpolation);
    });
  }

  // Animation curve evaluation (OpenShot-style interpolation)
  getAnimationCurve(clipId: string, property: string): AnimationCurve | null {
    const tracks = this.keyframeTracks$.value.get(clipId) || [];
    const track = tracks.find(t => t.property === property);
    
    if (!track || track.keyframes.length === 0) return null;

    return {
      property,
      keyframes: track.keyframes,
      getValue: (time: number) => this.interpolateValue(track.keyframes, time)
    };
  }

  private interpolateValue(keyframes: Keyframe[], time: number): any {
    if (keyframes.length === 0) return null;
    if (keyframes.length === 1) return keyframes[0].value;

    // Find surrounding keyframes
    let leftKeyframe = keyframes[0];
    let rightKeyframe = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (keyframes[i].time <= time && keyframes[i + 1].time >= time) {
        leftKeyframe = keyframes[i];
        rightKeyframe = keyframes[i + 1];
        break;
      }
    }

    // If time is before first or after last keyframe
    if (time <= leftKeyframe.time) return leftKeyframe.value;
    if (time >= rightKeyframe.time) return rightKeyframe.value;

    // Interpolate between keyframes
    const t = (time - leftKeyframe.time) / (rightKeyframe.time - leftKeyframe.time);
    
    switch (leftKeyframe.interpolation) {
      case InterpolationType.CONSTANT:
        return leftKeyframe.value;
      
      case InterpolationType.LINEAR:
        return this.linearInterpolate(leftKeyframe.value, rightKeyframe.value, t);
      
      case InterpolationType.BEZIER:
        return this.bezierInterpolate(leftKeyframe, rightKeyframe, t);
      
      case InterpolationType.EASE_IN:
        return this.easeInInterpolate(leftKeyframe.value, rightKeyframe.value, t);
      
      case InterpolationType.EASE_OUT:
        return this.easeOutInterpolate(leftKeyframe.value, rightKeyframe.value, t);
      
      case InterpolationType.EASE_IN_OUT:
        return this.easeInOutInterpolate(leftKeyframe.value, rightKeyframe.value, t);
      
      default:
        return this.linearInterpolate(leftKeyframe.value, rightKeyframe.value, t);
    }
  }

  private linearInterpolate(a: any, b: any, t: number): any {
    if (typeof a === 'number' && typeof b === 'number') {
      return a + (b - a) * t;
    }
    return t < 0.5 ? a : b;
  }

  private bezierInterpolate(left: Keyframe, right: Keyframe, t: number): any {
    // Simplified bezier interpolation
    const easeT = this.cubicBezier(0.25, 0.1, 0.25, 1, t);
    return this.linearInterpolate(left.value, right.value, easeT);
  }

  private easeInInterpolate(a: any, b: any, t: number): any {
    const easeT = t * t;
    return this.linearInterpolate(a, b, easeT);
  }

  private easeOutInterpolate(a: any, b: any, t: number): any {
    const easeT = 1 - Math.pow(1 - t, 2);
    return this.linearInterpolate(a, b, easeT);
  }

  private easeInOutInterpolate(a: any, b: any, t: number): any {
    const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    return this.linearInterpolate(a, b, easeT);
  }

  private cubicBezier(x1: number, y1: number, x2: number, y2: number, t: number): number {
    // Simplified cubic bezier calculation
    const u = 1 - t;
    return 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t;
  }

  private generateKeyframeId(): string {
    return 'keyframe-' + Math.random().toString(36).substr(2, 9);
  }

  private getPropertyColor(property: string): string {
    const colors: { [key: string]: string } = {
      'scale_x': '#ff6b6b',
      'scale_y': '#4ecdc4',
      'x': '#45b7d1',
      'y': '#96ceb4',
      'rotation': '#feca57',
      'opacity': '#ff9ff3',
      'brightness': '#54a0ff',
      'contrast': '#5f27cd',
      'hue': '#00d2d3',
      'saturation': '#ff9f43'
    };
    
    return colors[property] || '#6c5ce7';
  }
}
