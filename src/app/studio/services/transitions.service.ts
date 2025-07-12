import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// OpenShot-style transition interfaces
export interface Transition {
  id: string;
  name: string;
  type: TransitionType;
  category: TransitionCategory;
  description: string;
  icon: string;
  duration: number;
  parameters: TransitionParameter[];
  previewUrl?: string;
  thumbnailUrl?: string;
}

export interface TransitionParameter {
  name: string;
  type: 'number' | 'boolean' | 'color' | 'choice' | 'direction';
  value: any;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  choices?: string[];
  description: string;
}

export interface AppliedTransition {
  id: string;
  transitionId: string;
  clipId: string;
  position: 'in' | 'out' | 'between';
  startTime: number;
  duration: number;
  parameters: TransitionParameter[];
  enabled: boolean;
}

export enum TransitionType {
  FADE = 'fade',
  WIPE = 'wipe',
  SLIDE = 'slide',
  ZOOM = 'zoom',
  ROTATE = 'rotate',
  DISSOLVE = 'dissolve',
  PUSH = 'push',
  SPLIT = 'split',
  IRIS = 'iris',
  CLOCK = 'clock'
}

export enum TransitionCategory {
  BASIC = 'basic',
  WIPES = 'wipes',
  SLIDES = 'slides',
  ZOOMS = 'zooms',
  ROTATIONS = 'rotations',
  ARTISTIC = 'artistic',
  GEOMETRIC = 'geometric'
}

@Injectable({
  providedIn: 'root'
})
export class TransitionsService {
  private availableTransitions$ = new BehaviorSubject<Transition[]>([]);
  private appliedTransitions$ = new BehaviorSubject<Map<string, AppliedTransition[]>>(new Map());

  constructor() {
    this.initializeTransitions();
  }

  getAvailableTransitions(): Observable<Transition[]> {
    return this.availableTransitions$.asObservable();
  }

  getAppliedTransitions(clipId: string): Observable<AppliedTransition[]> {
    return new Observable(observer => {
      this.appliedTransitions$.subscribe(transitionsMap => {
        observer.next(transitionsMap.get(clipId) || []);
      });
    });
  }

  // OpenShot-style built-in transitions
  private initializeTransitions(): void {
    const transitions: Transition[] = [
      // Basic Transitions
      {
        id: 'fade_in',
        name: 'Fade In',
        type: TransitionType.FADE,
        category: TransitionCategory.BASIC,
        description: 'Fade from transparent to opaque',
        icon: 'icon-fade-in',
        duration: 1.0,
        parameters: [
          {
            name: 'brightness',
            type: 'number',
            value: 1.0,
            defaultValue: 1.0,
            min: 0,
            max: 2,
            step: 0.1,
            description: 'Final brightness level'
          }
        ]
      },
      {
        id: 'fade_out',
        name: 'Fade Out',
        type: TransitionType.FADE,
        category: TransitionCategory.BASIC,
        description: 'Fade from opaque to transparent',
        icon: 'icon-fade-out',
        duration: 1.0,
        parameters: [
          {
            name: 'brightness',
            type: 'number',
            value: 0.0,
            defaultValue: 0.0,
            min: 0,
            max: 1,
            step: 0.1,
            description: 'Final brightness level'
          }
        ]
      },
      {
        id: 'cross_dissolve',
        name: 'Cross Dissolve',
        type: TransitionType.DISSOLVE,
        category: TransitionCategory.BASIC,
        description: 'Smooth blend between two clips',
        icon: 'icon-dissolve',
        duration: 2.0,
        parameters: []
      },
      // Wipe Transitions
      {
        id: 'wipe_left',
        name: 'Wipe Left',
        type: TransitionType.WIPE,
        category: TransitionCategory.WIPES,
        description: 'Wipe from right to left',
        icon: 'icon-wipe-left',
        duration: 1.5,
        parameters: [
          {
            name: 'softness',
            type: 'number',
            value: 0.1,
            defaultValue: 0.1,
            min: 0,
            max: 1,
            step: 0.01,
            description: 'Edge softness'
          }
        ]
      },
      {
        id: 'wipe_right',
        name: 'Wipe Right',
        type: TransitionType.WIPE,
        category: TransitionCategory.WIPES,
        description: 'Wipe from left to right',
        icon: 'icon-wipe-right',
        duration: 1.5,
        parameters: [
          {
            name: 'softness',
            type: 'number',
            value: 0.1,
            defaultValue: 0.1,
            min: 0,
            max: 1,
            step: 0.01,
            description: 'Edge softness'
          }
        ]
      },
      {
        id: 'wipe_up',
        name: 'Wipe Up',
        type: TransitionType.WIPE,
        category: TransitionCategory.WIPES,
        description: 'Wipe from bottom to top',
        icon: 'icon-wipe-up',
        duration: 1.5,
        parameters: [
          {
            name: 'softness',
            type: 'number',
            value: 0.1,
            defaultValue: 0.1,
            min: 0,
            max: 1,
            step: 0.01,
            description: 'Edge softness'
          }
        ]
      },
      {
        id: 'wipe_down',
        name: 'Wipe Down',
        type: TransitionType.WIPE,
        category: TransitionCategory.WIPES,
        description: 'Wipe from top to bottom',
        icon: 'icon-wipe-down',
        duration: 1.5,
        parameters: [
          {
            name: 'softness',
            type: 'number',
            value: 0.1,
            defaultValue: 0.1,
            min: 0,
            max: 1,
            step: 0.01,
            description: 'Edge softness'
          }
        ]
      },
      // Slide Transitions
      {
        id: 'slide_left',
        name: 'Slide Left',
        type: TransitionType.SLIDE,
        category: TransitionCategory.SLIDES,
        description: 'Slide new clip from right',
        icon: 'icon-slide-left',
        duration: 1.0,
        parameters: []
      },
      {
        id: 'slide_right',
        name: 'Slide Right',
        type: TransitionType.SLIDE,
        category: TransitionCategory.SLIDES,
        description: 'Slide new clip from left',
        icon: 'icon-slide-right',
        duration: 1.0,
        parameters: []
      },
      {
        id: 'slide_up',
        name: 'Slide Up',
        type: TransitionType.SLIDE,
        category: TransitionCategory.SLIDES,
        description: 'Slide new clip from bottom',
        icon: 'icon-slide-up',
        duration: 1.0,
        parameters: []
      },
      {
        id: 'slide_down',
        name: 'Slide Down',
        type: TransitionType.SLIDE,
        category: TransitionCategory.SLIDES,
        description: 'Slide new clip from top',
        icon: 'icon-slide-down',
        duration: 1.0,
        parameters: []
      },
      // Zoom Transitions
      {
        id: 'zoom_in',
        name: 'Zoom In',
        type: TransitionType.ZOOM,
        category: TransitionCategory.ZOOMS,
        description: 'Zoom into the new clip',
        icon: 'icon-zoom-in',
        duration: 1.5,
        parameters: [
          {
            name: 'scale_start',
            type: 'number',
            value: 0.1,
            defaultValue: 0.1,
            min: 0.01,
            max: 1,
            step: 0.01,
            description: 'Starting scale'
          }
        ]
      },
      {
        id: 'zoom_out',
        name: 'Zoom Out',
        type: TransitionType.ZOOM,
        category: TransitionCategory.ZOOMS,
        description: 'Zoom out from the old clip',
        icon: 'icon-zoom-out',
        duration: 1.5,
        parameters: [
          {
            name: 'scale_end',
            type: 'number',
            value: 3.0,
            defaultValue: 3.0,
            min: 1,
            max: 10,
            step: 0.1,
            description: 'Ending scale'
          }
        ]
      },
      // Rotation Transitions
      {
        id: 'rotate_clockwise',
        name: 'Rotate Clockwise',
        type: TransitionType.ROTATE,
        category: TransitionCategory.ROTATIONS,
        description: 'Rotate clockwise transition',
        icon: 'icon-rotate-right',
        duration: 2.0,
        parameters: [
          {
            name: 'rotations',
            type: 'number',
            value: 1,
            defaultValue: 1,
            min: 0.25,
            max: 5,
            step: 0.25,
            description: 'Number of rotations'
          }
        ]
      },
      {
        id: 'rotate_counter_clockwise',
        name: 'Rotate Counter-Clockwise',
        type: TransitionType.ROTATE,
        category: TransitionCategory.ROTATIONS,
        description: 'Rotate counter-clockwise transition',
        icon: 'icon-rotate-left',
        duration: 2.0,
        parameters: [
          {
            name: 'rotations',
            type: 'number',
            value: 1,
            defaultValue: 1,
            min: 0.25,
            max: 5,
            step: 0.25,
            description: 'Number of rotations'
          }
        ]
      }
    ];

    this.availableTransitions$.next(transitions);
  }

  // Transition management methods
  applyTransition(clipId: string, transitionId: string, position: 'in' | 'out' | 'between', startTime: number, duration?: number): AppliedTransition | null {
    const availableTransitions = this.availableTransitions$.value;
    const transitionTemplate = availableTransitions.find(t => t.id === transitionId);
    
    if (!transitionTemplate) return null;

    const appliedTransition: AppliedTransition = {
      id: this.generateTransitionId(),
      transitionId,
      clipId,
      position,
      startTime,
      duration: duration || transitionTemplate.duration,
      parameters: transitionTemplate.parameters.map(param => ({ ...param })),
      enabled: true
    };

    const currentTransitions = this.appliedTransitions$.value;
    const clipTransitions = currentTransitions.get(clipId) || [];
    clipTransitions.push(appliedTransition);
    currentTransitions.set(clipId, clipTransitions);
    
    this.appliedTransitions$.next(currentTransitions);
    return appliedTransition;
  }

  removeTransition(clipId: string, transitionId: string): void {
    const currentTransitions = this.appliedTransitions$.value;
    const clipTransitions = currentTransitions.get(clipId) || [];
    const updatedTransitions = clipTransitions.filter(transition => transition.id !== transitionId);
    
    if (updatedTransitions.length === 0) {
      currentTransitions.delete(clipId);
    } else {
      currentTransitions.set(clipId, updatedTransitions);
    }
    
    this.appliedTransitions$.next(currentTransitions);
  }

  updateTransitionParameter(clipId: string, transitionId: string, parameterName: string, value: any): void {
    const currentTransitions = this.appliedTransitions$.value;
    const clipTransitions = currentTransitions.get(clipId) || [];
    const transition = clipTransitions.find(t => t.id === transitionId);
    
    if (transition) {
      const parameter = transition.parameters.find(p => p.name === parameterName);
      if (parameter) {
        parameter.value = value;
        this.appliedTransitions$.next(currentTransitions);
      }
    }
  }

  updateTransitionDuration(clipId: string, transitionId: string, duration: number): void {
    const currentTransitions = this.appliedTransitions$.value;
    const clipTransitions = currentTransitions.get(clipId) || [];
    const transition = clipTransitions.find(t => t.id === transitionId);
    
    if (transition) {
      transition.duration = Math.max(0.1, duration);
      this.appliedTransitions$.next(currentTransitions);
    }
  }

  toggleTransition(clipId: string, transitionId: string): void {
    const currentTransitions = this.appliedTransitions$.value;
    const clipTransitions = currentTransitions.get(clipId) || [];
    const transition = clipTransitions.find(t => t.id === transitionId);
    
    if (transition) {
      transition.enabled = !transition.enabled;
      this.appliedTransitions$.next(currentTransitions);
    }
  }

  private generateTransitionId(): string {
    return 'transition-' + Math.random().toString(36).substr(2, 9);
  }
}
