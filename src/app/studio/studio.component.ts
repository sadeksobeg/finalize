import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Enhanced Components
import { EnhancedTimelineComponent } from './components/enhanced-timeline/enhanced-timeline.component';
import { EnhancedPreviewComponent } from './components/enhanced-preview/enhanced-preview.component';
import { EnhancedMediaBinComponent } from './components/enhanced-media-bin/enhanced-media-bin.component';
import { EffectsPanelComponent } from './components/effects-panel/effects-panel.component';
import { TransitionsPanelComponent } from './components/transitions-panel/transitions-panel.component';

// Services
import { TimelineService } from './services/timeline.service';
import { AutoSaveService } from './services/auto-save.service';
import { UploadService } from './services/upload.service';
import { EffectsService } from './services/effects.service';
import { TransitionsService } from './services/transitions.service';

// Models
import { Resource, Timeline, PlaybackState } from './models/studio.models';
import { ProjectState } from './models/studio-enhanced.models';

/**
 * Professional Studio Component
 * Complete video editing interface with all professional features
 */
@Component({
  selector: 'app-studio',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    EnhancedTimelineComponent,
    EnhancedPreviewComponent,
    EnhancedMediaBinComponent,
    EffectsPanelComponent,
    TransitionsPanelComponent
  ],
  template: `
    <div class="professional-studio">
      <!-- Studio Header -->
      <div class="studio-header">
        <!-- Menu Bar -->
        <div class="menu-bar">
          <div class="menu-item" (click)="showMenu('file')">File</div>
          <div class="menu-item" (click)="showMenu('edit')">Edit</div>
          <div class="menu-item" (click)="showMenu('view')">View</div>
          <div class="menu-item" (click)="showMenu('timeline')">Timeline</div>
          <div class="menu-item" (click)="showMenu('effects')">Effects</div>
          <div class="menu-item" (click)="showMenu('help')">Help</div>
        </div>

        <!-- Professional Toolbar -->
        <div class="professional-toolbar">
          <!-- File Operations -->
          <div class="toolbar-group">
            <button class="toolbar-btn" (click)="newProject()" title="New Project (Ctrl+N)">
              <i class="icon-new"></i>
            </button>
            <button class="toolbar-btn" (click)="openProject()" title="Open Project (Ctrl+O)">
              <i class="icon-open"></i>
            </button>
            <button class="toolbar-btn" (click)="saveProject()" title="Save Project (Ctrl+S)">
              <i class="icon-save"></i>
            </button>
            <button class="toolbar-btn" (click)="importMedia()" title="Import Media (Ctrl+I)">
              <i class="icon-import"></i>
            </button>
          </div>
          
          <div class="toolbar-separator"></div>
          
          <!-- Edit Operations -->
          <div class="toolbar-group">
            <button class="toolbar-btn" [disabled]="!canUndo" (click)="undo()" title="Undo (Ctrl+Z)">
              <i class="icon-undo"></i>
            </button>
            <button class="toolbar-btn" [disabled]="!canRedo" (click)="redo()" title="Redo (Ctrl+Y)">
              <i class="icon-redo"></i>
            </button>
            <button class="toolbar-btn" [disabled]="!hasSelection" (click)="cut()" title="Cut (Ctrl+X)">
              <i class="icon-cut"></i>
            </button>
            <button class="toolbar-btn" [disabled]="!hasSelection" (click)="copy()" title="Copy (Ctrl+C)">
              <i class="icon-copy"></i>
            </button>
            <button class="toolbar-btn" [disabled]="!hasClipboard" (click)="paste()" title="Paste (Ctrl+V)">
              <i class="icon-paste"></i>
            </button>
          </div>
          
          <div class="toolbar-separator"></div>
          
          <!-- Tools -->
          <div class="toolbar-group">
            <button class="toolbar-btn" 
                    [class.active]="selectedTool === 'pointer'" 
                    (click)="setTool('pointer')" 
                    title="Selection Tool (V)">
              <i class="icon-pointer"></i>
            </button>
            <button class="toolbar-btn" 
                    [class.active]="selectedTool === 'razor'" 
                    (click)="setTool('razor')" 
                    title="Razor Tool (C)">
              <i class="icon-razor"></i>
            </button>
            <button class="toolbar-btn" 
                    [class.active]="selectedTool === 'hand'" 
                    (click)="setTool('hand')" 
                    title="Hand Tool (H)">
              <i class="icon-hand"></i>
            </button>
            <button class="toolbar-btn" 
                    [class.active]="selectedTool === 'zoom'" 
                    (click)="setTool('zoom')" 
                    title="Zoom Tool (Z)">
              <i class="icon-zoom"></i>
            </button>
          </div>
          
          <div class="toolbar-separator"></div>
          
          <!-- Playback -->
          <div class="toolbar-group">
            <button class="toolbar-btn" (click)="goToStart()" title="Go to Start (Home)">
              <i class="icon-skip-start"></i>
            </button>
            <button class="toolbar-btn" (click)="stepBackward()" title="Previous Frame (Left Arrow)">
              <i class="icon-step-backward"></i>
            </button>
            <button class="toolbar-btn play-btn" (click)="togglePlayback()" title="Play/Pause (Space)">
              <i [class]="playback.playing ? 'icon-pause' : 'icon-play'"></i>
            </button>
            <button class="toolbar-btn" (click)="stepForward()" title="Next Frame (Right Arrow)">
              <i class="icon-step-forward"></i>
            </button>
            <button class="toolbar-btn" (click)="goToEnd()" title="Go to End (End)">
              <i class="icon-skip-end"></i>
            </button>
          </div>
          
          <div class="toolbar-separator"></div>
          
          <!-- Advanced Tools -->
          <div class="toolbar-group">
            <button class="toolbar-btn" 
                    [class.active]="snappingEnabled" 
                    (click)="toggleSnapping()" 
                    title="Toggle Snapping (S)">
              <i class="icon-magnet"></i>
            </button>
            <button class="toolbar-btn" 
                    [class.active]="linkSelection" 
                    (click)="toggleLinkSelection()" 
                    title="Link/Unlink Selection (L)">
              <i [class]="linkSelection ? 'icon-link' : 'icon-unlink'"></i>
            </button>
            <button class="toolbar-btn" (click)="addMarker()" title="Add Marker (M)">
              <i class="icon-marker"></i>
            </button>
          </div>
          
          <div class="toolbar-separator"></div>
          
          <!-- Export -->
          <div class="toolbar-group">
            <button class="toolbar-btn export-btn" (click)="exportProject()" title="Export Video (Ctrl+E)">
              <i class="icon-export"></i>
            </button>
          </div>
          
          <!-- Auto-save Status -->
          <div class="auto-save-status">
            <span class="auto-save-indicator" [class.saving]="autoSaveService.isDirty">
              {{ getAutoSaveStatus() }}
            </span>
            <span class="last-saved" *ngIf="autoSaveService.lastSaved">
              Last saved: {{ formatLastSaved(autoSaveService.lastSaved) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Studio Workspace -->
      <div class="studio-workspace">
        <!-- Left Panel -->
        <div class="left-panel">
          <!-- Panel Tabs -->
          <div class="panel-tabs">
            <button class="tab-btn" 
                    [class.active]="leftPanelTab === 'media'" 
                    (click)="setLeftPanelTab('media')">
              <i class="icon-media"></i>
              Media
            </button>
            <button class="tab-btn" 
                    [class.active]="leftPanelTab === 'effects'" 
                    (click)="setLeftPanelTab('effects')">
              <i class="icon-effects"></i>
              Effects
            </button>
            <button class="tab-btn" 
                    [class.active]="leftPanelTab === 'transitions'" 
                    (click)="setLeftPanelTab('transitions')">
              <i class="icon-transitions"></i>
              Transitions
            </button>
          </div>
          
          <!-- Panel Content -->
          <div class="panel-content">
            <app-enhanced-media-bin 
              *ngIf="leftPanelTab === 'media'"
              (resourceSelected)="onResourceSelected($event)">
            </app-enhanced-media-bin>
            
            <app-effects-panel 
              *ngIf="leftPanelTab === 'effects'"
              [selectedClipId]="selectedClipId">
            </app-effects-panel>
            
            <app-transitions-panel 
              *ngIf="leftPanelTab === 'transitions'"
              [selectedClipId]="selectedClipId">
            </app-transitions-panel>
          </div>
        </div>

        <!-- Center Panel -->
        <div class="center-panel">
          <app-enhanced-preview></app-enhanced-preview>
        </div>

        <!-- Right Panel -->
        <div class="right-panel">
          <!-- Properties Panel -->
          <div class="properties-panel">
            <div class="panel-header">
              <h3>Properties</h3>
            </div>
            <div class="properties-content">
              <div *ngIf="selectedClipId" class="clip-properties">
                <h4>Clip Properties</h4>
                <!-- Clip properties form would go here -->
                <div class="property-group">
                  <label>Position</label>
                  <div class="property-row">
                    <input type="number" placeholder="X" class="property-input">
                    <input type="number" placeholder="Y" class="property-input">
                  </div>
                </div>
                <div class="property-group">
                  <label>Scale</label>
                  <div class="property-row">
                    <input type="number" placeholder="Width %" class="property-input">
                    <input type="number" placeholder="Height %" class="property-input">
                  </div>
                </div>
                <div class="property-group">
                  <label>Rotation</label>
                  <input type="number" placeholder="Degrees" class="property-input">
                </div>
                <div class="property-group">
                  <label>Opacity</label>
                  <input type="range" min="0" max="100" class="property-slider">
                </div>
              </div>
              <div *ngIf="!selectedClipId" class="no-selection">
                <i class="icon-info"></i>
                <p>Select a clip to view properties</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Panel -->
      <div class="timeline-panel">
        <app-enhanced-timeline></app-enhanced-timeline>
      </div>
    </div>
  `,
  styleUrls: ['./studio.component.scss']
})
export class StudioComponent implements OnInit, OnDestroy {
  // Core State
  selectedTool: 'pointer' | 'razor' | 'hand' | 'zoom' = 'pointer';
  leftPanelTab: 'media' | 'effects' | 'transitions' = 'media';
  selectedClipId: string | null = null;
  
  // UI State
  snappingEnabled = true;
  linkSelection = false;
  hasSelection = false;
  hasClipboard = false;
  canUndo = false;
  canRedo = false;
  
  // Playback State
  playback: PlaybackState = {
    playing: false,
    position: 0,
    speed: 1,
    loop: false,
    volume: 1,
    muted: false
  };
  
  // Project State
  currentProject: ProjectState | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private timelineService: TimelineService,
    public autoSaveService: AutoSaveService,
    private uploadService: UploadService,
    private effectsService: EffectsService,
    private transitionsService: TransitionsService
  ) {}

  ngOnInit(): void {
    // Subscribe to timeline changes
    this.timelineService.timeline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(timeline => {
        this.updateUIState(timeline);
      });

    // Subscribe to playback changes
    this.timelineService.playback$
      .pipe(takeUntil(this.destroy$))
      .subscribe(playback => {
        this.playback = playback;
      });

    // Subscribe to selected clips
    this.timelineService.selectedClips$
      .pipe(takeUntil(this.destroy$))
      .subscribe(clips => {
        this.hasSelection = clips.length > 0;
        this.selectedClipId = clips.length === 1 ? clips[0].id : null;
      });

    // Initialize project
    this.initializeProject();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeProject(): void {
    this.currentProject = this.autoSaveService.createProject('Untitled Project');
  }

  private updateUIState(timeline: Timeline): void {
    // Update UI state based on timeline changes
    this.autoSaveService.markDirty();
  }

  // Menu Actions
  showMenu(menu: string): void {
    console.log('Show menu:', menu);
    // Implement menu logic
  }

  // File Operations
  newProject(): void {
    if (this.autoSaveService.isDirty) {
      if (confirm('You have unsaved changes. Create new project anyway?')) {
        this.timelineService.clearTimeline();
        this.currentProject = this.autoSaveService.createProject('Untitled Project');
      }
    } else {
      this.timelineService.clearTimeline();
      this.currentProject = this.autoSaveService.createProject('Untitled Project');
    }
  }

  openProject(): void {
    // Implement project opening logic
    console.log('Open project');
  }

  saveProject(): void {
    this.autoSaveService.forceSave();
  }

  importMedia(): void {
    // Trigger file input from media bin
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'video/*,audio/*,image/*';
    fileInput.onchange = (event: any) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        this.uploadService.uploadFiles(files);
      }
    };
    fileInput.click();
  }

  exportProject(): void {
    console.log('Export project');
    // Implement export logic
  }

  // Edit Operations
  undo(): void {
    console.log('Undo');
    // Implement undo logic
  }

  redo(): void {
    console.log('Redo');
    // Implement redo logic
  }

  cut(): void {
    console.log('Cut');
    // Implement cut logic
  }

  copy(): void {
    console.log('Copy');
    // Implement copy logic
  }

  paste(): void {
    console.log('Paste');
    // Implement paste logic
  }

  // Tool Selection
  setTool(tool: 'pointer' | 'razor' | 'hand' | 'zoom'): void {
    this.selectedTool = tool;
  }

  // Playback Controls
  togglePlayback(): void {
    this.timelineService.togglePlayback();
  }

  goToStart(): void {
    this.timelineService.setPlaybackPosition(0);
  }

  goToEnd(): void {
    // Implement go to end logic
  }

  stepBackward(): void {
    const frameTime = 1 / 25; // Assuming 25fps
    const newTime = Math.max(0, this.playback.position - frameTime);
    this.timelineService.setPlaybackPosition(newTime);
  }

  stepForward(): void {
    const frameTime = 1 / 25; // Assuming 25fps
    this.timelineService.setPlaybackPosition(this.playback.position + frameTime);
  }

  // Advanced Tools
  toggleSnapping(): void {
    this.snappingEnabled = !this.snappingEnabled;
  }

  toggleLinkSelection(): void {
    this.linkSelection = !this.linkSelection;
  }

  addMarker(): void {
    console.log('Add marker at:', this.playback.position);
    // Implement marker logic
  }

  // Panel Management
  setLeftPanelTab(tab: 'media' | 'effects' | 'transitions'): void {
    this.leftPanelTab = tab;
  }

  // Event Handlers
  onResourceSelected(resource: Resource): void {
    // Add resource to timeline or load in preview
    this.timelineService.addResourceToTimeline(resource);
  }

  // Auto-save Status
  getAutoSaveStatus(): string {
    if (this.autoSaveService.isDirty) {
      return 'Saving...';
    }
    return this.autoSaveService.autoSaveEnabled ? 'Auto-save On' : 'Auto-save Off';
  }

  formatLastSaved(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return date.toLocaleDateString();
  }

  // Keyboard Shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'n':
          event.preventDefault();
          this.newProject();
          break;
        case 'o':
          event.preventDefault();
          this.openProject();
          break;
        case 's':
          event.preventDefault();
          this.saveProject();
          break;
        case 'i':
          event.preventDefault();
          this.importMedia();
          break;
        case 'z':
          event.preventDefault();
          if (event.shiftKey) {
            this.redo();
          } else {
            this.undo();
          }
          break;
        case 'y':
          event.preventDefault();
          this.redo();
          break;
        case 'x':
          event.preventDefault();
          this.cut();
          break;
        case 'c':
          event.preventDefault();
          this.copy();
          break;
        case 'v':
          event.preventDefault();
          this.paste();
          break;
        case 'e':
          event.preventDefault();
          this.exportProject();
          break;
      }
    } else {
      switch (event.key.toLowerCase()) {
        case ' ':
          event.preventDefault();
          this.togglePlayback();
          break;
        case 'v':
          this.setTool('pointer');
          break;
        case 'c':
          this.setTool('razor');
          break;
        case 'h':
          this.setTool('hand');
          break;
        case 'z':
          this.setTool('zoom');
          break;
        case 's':
          this.toggleSnapping();
          break;
        case 'l':
          this.toggleLinkSelection();
          break;
        case 'm':
          this.addMarker();
          break;
        case 'home':
          this.goToStart();
          break;
        case 'end':
          this.goToEnd();
          break;
        case 'arrowleft':
          this.stepBackward();
          break;
        case 'arrowright':
          this.stepForward();
          break;
      }
    }
  }
}