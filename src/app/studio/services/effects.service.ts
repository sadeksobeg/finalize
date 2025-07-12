import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// OpenShot-style effect interfaces
export interface Effect {
  id: string;
  name: string;
  type: EffectType;
  category: EffectCategory;
  description: string;
  icon: string;
  parameters: EffectParameter[];
  keyframes?: Keyframe[];
  enabled: boolean;
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

export interface Keyframe {
  id: string;
  time: number;
  property: string;
  value: any;
  interpolation: 'linear' | 'bezier' | 'constant';
  easeIn?: number;
  easeOut?: number;
}

export enum EffectType {
  VIDEO = 'video',
  AUDIO = 'audio',
  TRANSITION = 'transition',
  GENERATOR = 'generator'
}

export enum EffectCategory {
  COLOR = 'color',
  DISTORT = 'distort',
  BLUR = 'blur',
  STYLIZE = 'stylize',
  NOISE = 'noise',
  KEYING = 'keying',
  COMPOSITE = 'composite',
  TIME = 'time',
  AUDIO_FILTER = 'audio_filter',
  AUDIO_MIXER = 'audio_mixer'
}

@Injectable({
  providedIn: 'root'
})
export class EffectsService {
  private availableEffects$ = new BehaviorSubject<Effect[]>([]);
  private appliedEffects$ = new BehaviorSubject<Map<string, Effect[]>>(new Map());

  constructor() {
    this.initializeEffects();
  }

  getAvailableEffects(): Observable<Effect[]> {
    return this.availableEffects$.asObservable();
  }

  getAppliedEffects(clipId: string): Observable<Effect[]> {
    return new Observable(observer => {
      this.appliedEffects$.subscribe(effectsMap => {
        observer.next(effectsMap.get(clipId) || []);
      });
    });
  }

  // OpenShot-style built-in effects
  private initializeEffects(): void {
    const effects: Effect[] = [
      // Color Effects
      {
        id: 'brightness',
        name: 'Brightness & Contrast',
        type: EffectType.VIDEO,
        category: EffectCategory.COLOR,
        description: 'Adjust brightness and contrast of the video',
        icon: 'icon-brightness',
        enabled: true,
        order: 0,
        parameters: [
          {
            name: 'brightness',
            type: 'number',
            value: 0,
            defaultValue: 0,
            min: -100,
            max: 100,
            step: 1,
            description: 'Brightness adjustment',
            keyframeable: true
          },
          {
            name: 'contrast',
            type: 'number',
            value: 0,
            defaultValue: 0,
            min: -100,
            max: 100,
            step: 1,
            description: 'Contrast adjustment',
            keyframeable: true
          }
        ]
      },
      {
        id: 'hue_saturation',
        name: 'Hue & Saturation',
        type: EffectType.VIDEO,
        category: EffectCategory.COLOR,
        description: 'Adjust hue, saturation, and lightness',
        icon: 'icon-palette',
        enabled: true,
        order: 0,
        parameters: [
          {
            name: 'hue',
            type: 'number',
            value: 0,
            defaultValue: 0,
            min: -180,
            max: 180,
            step: 1,
            description: 'Hue shift in degrees',
            keyframeable: true
          },
          {
            name: 'saturation',
            type: 'number',
            value: 0,
            defaultValue: 0,
            min: -100,
            max: 100,
            step: 1,
            description: 'Saturation adjustment',
            keyframeable: true
          }
        ]
      },
      {
        id: 'chroma_key',
        name: 'Chroma Key (Green Screen)',
        type: EffectType.VIDEO,
        category: EffectCategory.KEYING,
        description: 'Remove background color for compositing',
        icon: 'icon-key',
        enabled: true,
        order: 0,
        parameters: [
          {
            name: 'key_color',
            type: 'color',
            value: '#00FF00',
            defaultValue: '#00FF00',
            description: 'Color to key out',
            keyframeable: false
          },
          {
            name: 'threshold',
            type: 'number',
            value: 10,
            defaultValue: 10,
            min: 0,
            max: 100,
            step: 1,
            description: 'Color similarity threshold',
            keyframeable: true
          },
          {
            name: 'feather',
            type: 'number',
            value: 5,
            defaultValue: 5,
            min: 0,
            max: 50,
            step: 1,
            description: 'Edge feathering',
            keyframeable: true
          }
        ]
      },
      // Transform Effects
      {
        id: 'scale',
        name: 'Scale',
        type: EffectType.VIDEO,
        category: EffectCategory.DISTORT,
        description: 'Scale and position video',
        icon: 'icon-resize',
        enabled: true,
        order: 0,
        parameters: [
          {
            name: 'scale_x',
            type: 'number',
            value: 100,
            defaultValue: 100,
            min: 1,
            max: 1000,
            step: 1,
            description: 'Horizontal scale percentage',
            keyframeable: true
          },
          {
            name: 'scale_y',
            type: 'number',
            value: 100,
            defaultValue: 100,
            min: 1,
            max: 1000,
            step: 1,
            description: 'Vertical scale percentage',
            keyframeable: true
          },
          {
            name: 'x',
            type: 'number',
            value: 0,
            defaultValue: 0,
            min: -1000,
            max: 1000,
            step: 1,
            description: 'Horizontal position',
            keyframeable: true
          },
          {
            name: 'y',
            type: 'number',
            value: 0,
            defaultValue: 0,
            min: -1000,
            max: 1000,
            step: 1,
            description: 'Vertical position',
            keyframeable: true
          }
        ]
      },
      {
        id: 'rotation',
        name: 'Rotation',
        type: EffectType.VIDEO,
        category: EffectCategory.DISTORT,
        description: 'Rotate video around center point',
        icon: 'icon-rotate',
        enabled: true,
        order: 0,
        parameters: [
          {
            name: 'rotation',
            type: 'number',
            value: 0,
            defaultValue: 0,
            min: -360,
            max: 360,
            step: 1,
            description: 'Rotation angle in degrees',
            keyframeable: true
          }
        ]
      },
      // Blur Effects
      {
        id: 'blur',
        name: 'Blur',
        type: EffectType.VIDEO,
        category: EffectCategory.BLUR,
        description: 'Apply gaussian blur to video',
        icon: 'icon-blur',
        enabled: true,
        order: 0,
        parameters: [
          {
            name: 'horizontal',
            type: 'number',
            value: 0,
            defaultValue: 0,
            min: 0,
            max: 100,
            step: 0.1,
            description: 'Horizontal blur amount',
            keyframeable: true
          },
          {
            name: 'vertical',
            type: 'number',
            value: 0,
            defaultValue: 0,
            min: 0,
            max: 100,
            step: 0.1,
            description: 'Vertical blur amount',
            keyframeable: true
          }
        ]
      }
    ];

    this.availableEffects$.next(effects);
  }

  // Effect management methods
  applyEffect(clipId: string, effectId: string): Effect | null {
    const availableEffects = this.availableEffects$.value;
    const effectTemplate = availableEffects.find(e => e.id === effectId);
    
    if (!effectTemplate) return null;

    // Create a copy of the effect with unique ID
    const appliedEffect: Effect = {
      ...effectTemplate,
      id: `${effectId}_${Date.now()}`,
      parameters: effectTemplate.parameters.map(param => ({ ...param }))
    };

    const currentEffects = this.appliedEffects$.value;
    const clipEffects = currentEffects.get(clipId) || [];
    clipEffects.push(appliedEffect);
    currentEffects.set(clipId, clipEffects);
    
    this.appliedEffects$.next(currentEffects);
    return appliedEffect;
  }

  removeEffect(clipId: string, effectId: string): void {
    const currentEffects = this.appliedEffects$.value;
    const clipEffects = currentEffects.get(clipId) || [];
    const updatedEffects = clipEffects.filter(effect => effect.id !== effectId);
    
    if (updatedEffects.length === 0) {
      currentEffects.delete(clipId);
    } else {
      currentEffects.set(clipId, updatedEffects);
    }
    
    this.appliedEffects$.next(currentEffects);
  }

  updateEffectParameter(clipId: string, effectId: string, parameterName: string, value: any): void {
    const currentEffects = this.appliedEffects$.value;
    const clipEffects = currentEffects.get(clipId) || [];
    const effect = clipEffects.find(e => e.id === effectId);
    
    if (effect) {
      const parameter = effect.parameters.find(p => p.name === parameterName);
      if (parameter) {
        parameter.value = value;
        this.appliedEffects$.next(currentEffects);
      }
    }
  }

  toggleEffect(clipId: string, effectId: string): void {
    const currentEffects = this.appliedEffects$.value;
    const clipEffects = currentEffects.get(clipId) || [];
    const effect = clipEffects.find(e => e.id === effectId);
    
    if (effect) {
      effect.enabled = !effect.enabled;
      this.appliedEffects$.next(currentEffects);
    }
  }

  reorderEffects(clipId: string, fromIndex: number, toIndex: number): void {
    const currentEffects = this.appliedEffects$.value;
    const clipEffects = currentEffects.get(clipId) || [];
    
    if (fromIndex >= 0 && fromIndex < clipEffects.length && 
        toIndex >= 0 && toIndex < clipEffects.length) {
      const [movedEffect] = clipEffects.splice(fromIndex, 1);
      clipEffects.splice(toIndex, 0, movedEffect);
      
      // Update order values
      clipEffects.forEach((effect, index) => {
        effect.order = index;
      });
      
      currentEffects.set(clipId, clipEffects);
      this.appliedEffects$.next(currentEffects);
    }
  }
}
