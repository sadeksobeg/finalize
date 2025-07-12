import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject, takeUntil, fromEvent } from 'rxjs';
import { TimelineService } from '../../services/timeline.service';
import { WaveformService } from '../../services/waveform.service';
import { Timeline, VideoClip, AudioClip, VideoTrack, AudioTrack } from '../../models/studio.models';
import { TimelineState } from '../../models/studio-enhanced.models';

/**
 * Enhanced Timeline Component
 * Professional timeline with waveforms, precise mouse control, and zoom functionality
 */
@Component({
  selector: 'app-enhanced-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="enhanced-timeline" #timelineContainer>
      <!-- Timeline Header -->
      <div class="timeline-header">
        <div class="timeline-controls">
          <button class="btn btn-sm" (click)="addVideoTrack()">
            <i class="icon-plus"></i> Video Track
          </button>
          <button class="btn btn-sm" (click)="addAudioTrack()">
            <i class="icon-plus"></i> Audio Track
          </button>
          <div class="separator"></div>
          <button class="btn btn-sm" [class.active]="timelineState.snapToGrid" (click)="toggleSnap()">
            <i class="icon-magnet"></i> Snap
          </button>
        </div>
        
        <!-- Zoom Controls -->
        <div class="zoom-controls">
          <button class="btn btn-sm" (click)="zoomOut()" [disabled]="timelineState.zoom <= 1">
            <i class="icon-zoom-out"></i>
          </button>
          <span class="zoom-level">{{ (timelineState.zoom * 10) | number:'1.0-0' }}%</span>
          <button class="btn btn-sm" (click)="zoomIn()" [disabled]="timelineState.zoom >= 20">
            <i class="icon-zoom-in"></i>
          </button>
          <button class="btn btn-sm" (click)="fitToWindow()">
            <i class="icon-fit"></i> Fit
          </button>
        </div>
      </div>

      <!-- Timeline Ruler -->
      <div class="timeline-ruler" #timelineRuler>
        <canvas #rulerCanvas 
                class="ruler-canvas"
                (click)="onRulerClick($event)"
                (mousemove)="onRulerMouseMove($event)">
        </canvas>
        
        <!-- Playhead -->
        <div class="playhead" 
             [style.left.px]="playheadPosition"
             (mousedown)="startPlayheadDrag($event)">
          <div class="playhead-line"></div>
          <div class="playhead-handle"></div>
        </div>
        
        <!-- Time Tooltip -->
        <div class="time-tooltip" 
             [style.left.px]="tooltipPosition.x"
             [style.display]="showTooltip ? 'block' : 'none'">
          {{ formatTime(tooltipTime) }}
        </div>
      </div>

      <!-- Timeline Content -->
      <div class="timeline-content" #timelineContent>
        <!-- Track Headers -->
        <div class="track-headers">
          <div *ngFor="let track of timeline.videoTracks; trackBy: trackByTrackId" 
               class="track-header video-track-header">
            <div class="track-info">
              <span class="track-name">{{ track.name }}</span>
              <div class="track-controls">
                <button class="track-btn" 
                        [class.active]="!track.muted" 
                        (click)="toggleTrackMute(track)">
                  <i [class]="track.muted ? 'icon-volume-off' : 'icon-volume-on'"></i>
                </button>
                <button class="track-btn" 
                        [class.active]="track.visible" 
                        (click)="toggleTrackVisibility(track)">
                  <i [class]="track.visible ? 'icon-eye' : 'icon-eye-off'"></i>
                </button>
                <button class="track-btn" 
                        [class.active]="track.locked" 
                        (click)="toggleTrackLock(track)">
                  <i [class]="track.locked ? 'icon-lock' : 'icon-unlock'"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div *ngFor="let track of timeline.audioTracks; trackBy: trackByTrackId" 
               class="track-header audio-track-header">
            <div class="track-info">
              <span class="track-name">{{ track.name }}</span>
              <div class="track-controls">
                <button class="track-btn" 
                        [class.active]="!track.muted" 
                        (click)="toggleTrackMute(track)">
                  <i [class]="track.muted ? 'icon-volume-off' : 'icon-volume-on'"></i>
                </button>
                <button class="track-btn" 
                        [class.active]="track.visible" 
                        (click)="toggleTrackVisibility(track)">
                  <i [class]="track.visible ? 'icon-eye' : 'icon-eye-off'"></i>
                </button>
                <button class="track-btn" 
                        [class.active]="track.locked" 
                        (click)="toggleTrackLock(track)">
                  <i [class]="track.locked ? 'icon-lock' : 'icon-unlock'"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline Tracks -->
        <div class="timeline-tracks" 
             #timelineTracks
             [style.width.px]="timelineWidth"
             (scroll)="onTimelineScroll($event)">
          
          <!-- Video Tracks -->
          <div *ngFor="let track of timeline.videoTracks; let trackIndex = index; trackBy: trackByTrackId" 
               class="timeline-track video-track"
               cdkDropList
               [cdkDropListData]="track.clips"
               (cdkDropListDropped)="onClipDrop($event, track.id)">
            
            <div *ngFor="let clip of track.clips; trackBy: trackByClipId"
                 class="timeline-clip video-clip"
                 [class.selected]="isClipSelected(clip)"
                 [style.left.px]="clip.start * timelineState.zoom"
                 [style.width.px]="clip.duration * timelineState.zoom"
                 cdkDrag
                 [cdkDragData]="clip"
                 (click)="selectClip(clip, $event)"
                 (dblclick)="editClip(clip)"
                 (mousedown)="startClipDrag(clip, $event)">
              
              <!-- Clip Thumbnail -->
              <div class="clip-thumbnail" *ngIf="clip.thumbnail">
                <img [src]="clip.thumbnail" [alt]="clip.name">
              </div>
              
              <!-- Clip Content -->
              <div class="clip-content">
                <div class="clip-name">{{ clip.name }}</div>
                <div class="clip-duration">{{ formatDuration(clip.duration) }}</div>
              </div>
              
              <!-- Resize Handles -->
              <div class="clip-handles" *ngIf="isClipSelected(clip)">
                <div class="handle left" (mousedown)="startResize(clip, 'left', $event)"></div>
                <div class="handle right" (mousedown)="startResize(clip, 'right', $event)"></div>
              </div>
            </div>
          </div>
          
          <!-- Audio Tracks -->
          <div *ngFor="let track of timeline.audioTracks; let trackIndex = index; trackBy: trackByTrackId" 
               class="timeline-track audio-track"
               cdkDropList
               [cdkDropListData]="track.clips"
               (cdkDropListDropped)="onClipDrop($event, track.id)">
            
            <div *ngFor="let clip of track.clips; trackBy: trackByClipId"
                 class="timeline-clip audio-clip"
                 [class.selected]="isClipSelected(clip)"
                 [style.left.px]="clip.start * timelineState.zoom"
                 [style.width.px]="clip.duration * timelineState.zoom"
                 cdkDrag
                 [cdkDragData]="clip"
                 (click)="selectClip(clip, $event)"
                 (dblclick)="editClip(clip)"
                 (mousedown)="startClipDrag(clip, $event)">
              
              <!-- Waveform -->
              <div class="waveform-container" #waveformContainer>
                <canvas class="waveform-canvas" 
                        [attr.data-clip-id]="clip.id"
                        [width]="clip.duration * timelineState.zoom"
                        [height]="40">
                </canvas>
              </div>
              
              <!-- Clip Content -->
              <div class="clip-content">
                <div class="clip-name">{{ clip.name }}</div>
                <div class="clip-duration">{{ formatDuration(clip.duration) }}</div>
              </div>
              
              <!-- Resize Handles -->
              <div class="clip-handles" *ngIf="isClipSelected(clip)">
                <div class="handle left" (mousedown)="startResize(clip, 'left', $event)"></div>
                <div class="handle right" (mousedown)="startResize(clip, 'right', $event)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./enhanced-timeline.component.scss']
})
export class EnhancedTimelineComponent implements OnInit, OnDestroy {
  @ViewChild('timelineContainer') timelineContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('timelineRuler') timelineRuler!: ElementRef<HTMLDivElement>;
  @ViewChild('rulerCanvas') rulerCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('timelineContent') timelineContent!: ElementRef<HTMLDivElement>;
  @ViewChild('timelineTracks') timelineTracks!: ElementRef<HTMLDivElement>;

  timeline: Timeline = {
    fps: 25,
    width: 1920,
    height: 1080,
    duration: 300,
    position: 0,
    scale: 1,
    videoTracks: [],
    audioTracks: []
  };

  timelineState: TimelineState = {
    zoom: 10, // pixels per second
    scrollPosition: 0,
    playheadPosition: 0,
    selectedClips: [],
    snapToGrid: true,
    gridSize: 1, // seconds
    viewportWidth: 800,
    viewportHeight: 400
  };

  // Mouse interaction state
  showTooltip = false;
  tooltipPosition = { x: 0, y: 0 };
  tooltipTime = 0;
  playheadPosition = 0;
  timelineWidth = 3000;

  // Drag state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartTime = 0;
  private resizeMode: 'left' | 'right' | null = null;
  private selectedClip: VideoClip | AudioClip | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private timelineService: TimelineService,
    private waveformService: WaveformService
  ) {}

  ngOnInit(): void {
    this.timelineService.timeline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(timeline => {
        this.timeline = timeline;
        this.updateTimelineWidth();
        this.renderWaveforms();
      });

    this.timelineService.playback$
      .pipe(takeUntil(this.destroy$))
      .subscribe(playback => {
        this.playheadPosition = playback.position * this.timelineState.zoom;
      });

    // Initialize ruler
    setTimeout(() => this.drawRuler(), 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Timeline Controls
  addVideoTrack(): void {
    this.timelineService.addVideoTrack();
  }

  addAudioTrack(): void {
    this.timelineService.addAudioTrack();
  }

  toggleSnap(): void {
    this.timelineState.snapToGrid = !this.timelineState.snapToGrid;
  }

  // Zoom Controls
  zoomIn(): void {
    this.timelineState.zoom = Math.min(this.timelineState.zoom * 1.5, 100);
    this.updateTimelineWidth();
    this.drawRuler();
  }

  zoomOut(): void {
    this.timelineState.zoom = Math.max(this.timelineState.zoom / 1.5, 1);
    this.updateTimelineWidth();
    this.drawRuler();
  }

  fitToWindow(): void {
    if (this.timeline.duration > 0 && this.timelineContainer) {
      const containerWidth = this.timelineContainer.nativeElement.clientWidth - 200; // Account for track headers
      this.timelineState.zoom = containerWidth / this.timeline.duration;
      this.updateTimelineWidth();
      this.drawRuler();
    }
  }

  // Mouse Events
  onRulerClick(event: MouseEvent): void {
    const rect = this.rulerCanvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const time = x / this.timelineState.zoom;
    this.timelineService.setPlaybackPosition(time);
  }

  onRulerMouseMove(event: MouseEvent): void {
    const rect = this.rulerCanvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const time = x / this.timelineState.zoom;
    
    this.tooltipPosition.x = x;
    this.tooltipTime = time;
    this.showTooltip = true;
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.showTooltip = false;
  }

  // Playhead Dragging
  startPlayheadDrag(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStartX = event.clientX;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.dragStartX;
        const deltaTime = deltaX / this.timelineState.zoom;
        const newTime = Math.max(0, this.timeline.position + deltaTime);
        this.timelineService.setPlaybackPosition(newTime);
        this.dragStartX = e.clientX;
      }
    };

    const handleMouseUp = () => {
      this.isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    event.preventDefault();
  }

  // Clip Management
  selectClip(clip: VideoClip | AudioClip, event: MouseEvent): void {
    const multiSelect = event.ctrlKey || event.metaKey;
    this.timelineService.selectClip(clip.id, multiSelect);
    this.selectedClip = clip;
  }

  isClipSelected(clip: VideoClip | AudioClip): boolean {
    return this.timelineState.selectedClips.includes(clip.id);
  }

  editClip(clip: VideoClip | AudioClip): void {
    // Open clip editor
    console.log('Edit clip:', clip);
  }

  // Clip Dragging
  startClipDrag(clip: VideoClip | AudioClip, event: MouseEvent): void {
    if (event.target !== event.currentTarget) return; // Ignore if clicking on handles
    
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartTime = clip.start;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.dragStartX;
        const deltaTime = deltaX / this.timelineState.zoom;
        let newStart = this.dragStartTime + deltaTime;
        
        // Snap to grid
        if (this.timelineState.snapToGrid) {
          newStart = Math.round(newStart / this.timelineState.gridSize) * this.timelineState.gridSize;
        }
        
        newStart = Math.max(0, newStart);
        this.timelineService.moveClip(clip.id, newStart);
      }
    };

    const handleMouseUp = () => {
      this.isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    event.preventDefault();
  }

  // Clip Resizing
  startResize(clip: VideoClip | AudioClip, mode: 'left' | 'right', event: MouseEvent): void {
    this.isDragging = true;
    this.resizeMode = mode;
    this.dragStartX = event.clientX;
    this.selectedClip = clip;
    
    const originalStart = clip.start;
    const originalDuration = clip.duration;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (this.isDragging && this.selectedClip) {
        const deltaX = e.clientX - this.dragStartX;
        const deltaTime = deltaX / this.timelineState.zoom;
        
        if (this.resizeMode === 'left') {
          let newStart = originalStart + deltaTime;
          let newDuration = originalDuration - deltaTime;
          
          if (this.timelineState.snapToGrid) {
            newStart = Math.round(newStart / this.timelineState.gridSize) * this.timelineState.gridSize;
            newDuration = originalStart + originalDuration - newStart;
          }
          
          if (newStart >= 0 && newDuration > 0.1) {
            this.timelineService.moveClip(this.selectedClip.id, newStart);
            // Update duration logic would go here
          }
        } else if (this.resizeMode === 'right') {
          let newDuration = originalDuration + deltaTime;
          
          if (this.timelineState.snapToGrid) {
            const newEnd = originalStart + newDuration;
            const snappedEnd = Math.round(newEnd / this.timelineState.gridSize) * this.timelineState.gridSize;
            newDuration = snappedEnd - originalStart;
          }
          
          if (newDuration > 0.1) {
            // Update duration logic would go here
          }
        }
      }
    };

    const handleMouseUp = () => {
      this.isDragging = false;
      this.resizeMode = null;
      this.selectedClip = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    event.stopPropagation();
    event.preventDefault();
  }

  // Drag and Drop
  onClipDrop(event: CdkDragDrop<(VideoClip | AudioClip)[]>, trackId: string): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Move clip to different track
      const clip = event.previousContainer.data[event.previousIndex];
      this.timelineService.moveClip(clip.id, clip.start, trackId);
    }
  }

  // Track Controls
  toggleTrackMute(track: VideoTrack | AudioTrack): void {
    track.muted = !track.muted;
  }

  toggleTrackVisibility(track: VideoTrack | AudioTrack): void {
    track.visible = !track.visible;
  }

  toggleTrackLock(track: VideoTrack | AudioTrack): void {
    track.locked = !track.locked;
  }

  // Rendering
  private updateTimelineWidth(): void {
    this.timelineWidth = Math.max(this.timeline.duration * this.timelineState.zoom, 1000);
  }

  private drawRuler(): void {
    const canvas = this.rulerCanvas.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ccc';
    ctx.font = '10px Arial';
    
    const secondWidth = this.timelineState.zoom;
    const majorInterval = this.getMajorInterval();
    
    for (let time = 0; time <= this.timeline.duration; time += majorInterval) {
      const x = time * secondWidth;
      if (x > canvas.width) break;
      
      ctx.beginPath();
      ctx.moveTo(x, canvas.height - 15);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
      
      ctx.fillText(this.formatTime(time), x + 2, canvas.height - 18);
    }
  }

  private getMajorInterval(): number {
    if (this.timelineState.zoom >= 50) return 1;
    if (this.timelineState.zoom >= 20) return 2;
    if (this.timelineState.zoom >= 10) return 5;
    return 10;
  }

  private async renderWaveforms(): Promise<void> {
    for (const track of this.timeline.audioTracks) {
      for (const clip of track.clips) {
        await this.renderClipWaveform(clip);
      }
    }
  }

  private async renderClipWaveform(clip: AudioClip): Promise<void> {
    try {
      const waveformData = await this.waveformService.generateWaveform(clip.resource);
      const canvas = document.querySelector(`canvas[data-clip-id="${clip.id}"]`) as HTMLCanvasElement;
      
      if (canvas && waveformData.length > 0) {
        const ctx = canvas.getContext('2d')!;
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#4a90e2';
        
        const barWidth = width / waveformData.length;
        
        waveformData.forEach((value, index) => {
          const barHeight = value * height * 0.8;
          const x = index * barWidth;
          const y = (height - barHeight) / 2;
          
          ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
        });
      }
    } catch (error) {
      console.error('Failed to render waveform:', error);
    }
  }

  // Utility Methods
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  formatDuration(seconds: number): string {
    return this.formatTime(seconds);
  }

  trackByTrackId(index: number, track: VideoTrack | AudioTrack): string {
    return track.id;
  }

  trackByClipId(index: number, clip: VideoClip | AudioClip): string {
    return clip.id;
  }

  onTimelineScroll(event: Event): void {
    const target = event.target as HTMLElement;
    this.timelineState.scrollPosition = target.scrollLeft;
  }
}