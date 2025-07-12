import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, interval, takeUntil, debounceTime } from 'rxjs';
import { TimelineService } from './timeline.service';
import { ProjectState } from '../models/studio-enhanced.models';

/**
 * Auto-Save Service
 * Handles automatic project saving with configurable intervals
 */
@Injectable({
  providedIn: 'root'
})
export class AutoSaveService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private saveSubject$ = new Subject<void>();
  private lastSaved$ = new BehaviorSubject<Date | null>(null);
  private isDirty$ = new BehaviorSubject<boolean>(false);
  private autoSaveEnabled$ = new BehaviorSubject<boolean>(true);
  
  private autoSaveInterval = 30; // seconds
  private currentProject: ProjectState | null = null;

  constructor(private timelineService: TimelineService) {
    this.initializeAutoSave();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get lastSaved(): Date | null {
    return this.lastSaved$.value;
  }

  get isDirty(): boolean {
    return this.isDirty$.value;
  }

  get autoSaveEnabled(): boolean {
    return this.autoSaveEnabled$.value;
  }

  /**
   * Initialize auto-save functionality
   */
  private initializeAutoSave(): void {
    // Auto-save timer
    interval(this.autoSaveInterval * 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.autoSaveEnabled$.value && this.isDirty$.value) {
          this.saveProject();
        }
      });

    // Debounced save on changes
    this.saveSubject$
      .pipe(
        debounceTime(2000),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.autoSaveEnabled$.value) {
          this.saveProject();
        }
      });

    // Listen for timeline changes
    this.timelineService.timeline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.markDirty();
      });
  }

  /**
   * Mark project as dirty (needs saving)
   */
  markDirty(): void {
    this.isDirty$.next(true);
    this.saveSubject$.next();
  }

  /**
   * Save project
   */
  async saveProject(): Promise<void> {
    if (!this.currentProject) return;

    try {
      // Get current timeline state
      const timeline = this.timelineService['timelineSubject'].value;
      
      // Update project state
      this.currentProject = {
        ...this.currentProject,
        timeline,
        lastSaved: new Date(),
        isDirty: false,
        version: this.currentProject.version + 1
      };

      // Save to localStorage (replace with actual backend save)
      localStorage.setItem(
        `studio_project_${this.currentProject.id}`, 
        JSON.stringify(this.currentProject)
      );

      this.lastSaved$.next(new Date());
      this.isDirty$.next(false);

      console.log('Project auto-saved successfully');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  /**
   * Load project
   */
  loadProject(projectId: string): ProjectState | null {
    try {
      const saved = localStorage.getItem(`studio_project_${projectId}`);
      if (saved) {
        this.currentProject = JSON.parse(saved);
        this.lastSaved$.next(this.currentProject!.lastSaved);
        this.isDirty$.next(false);
        return this.currentProject;
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    }
    return null;
  }

  /**
   * Create new project
   */
  createProject(name: string): ProjectState {
    this.currentProject = {
      id: `project_${Date.now()}`,
      name,
      lastSaved: new Date(),
      isDirty: false,
      version: 1,
      settings: {
        autoSave: true,
        autoSaveInterval: 30,
        previewQuality: 'medium',
        waveformQuality: 'medium',
        maxUndoSteps: 50,
        defaultTransitionDuration: 1.0,
        snapTolerance: 10
      },
      timeline: this.timelineService['timelineSubject'].value,
      resources: []
    };

    this.isDirty$.next(false);
    return this.currentProject;
  }

  /**
   * Toggle auto-save
   */
  toggleAutoSave(): void {
    this.autoSaveEnabled$.next(!this.autoSaveEnabled$.value);
  }

  /**
   * Set auto-save interval
   */
  setAutoSaveInterval(seconds: number): void {
    this.autoSaveInterval = Math.max(10, seconds); // Minimum 10 seconds
  }

  /**
   * Force save
   */
  forceSave(): Promise<void> {
    return this.saveProject();
  }
}