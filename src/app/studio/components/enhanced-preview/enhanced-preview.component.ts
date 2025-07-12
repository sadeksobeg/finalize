import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TimelineService } from '../../services/timeline.service';
import { PlaybackState } from '../../models/studio.models';

/**
 * Enhanced Preview Component
 * Professional video preview with full playback controls and fullscreen support
 */
@Component({
  selector: 'app-enhanced-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="enhanced-preview">
      <!-- Preview Header -->
      <div class="preview-header">
        <h3 class="preview-title">Video Preview</h3>
        <div class="preview-controls">
          <button class="btn btn-sm" (click)="toggleFullscreen()" title="Fullscreen">
            <i class="icon-fullscreen"></i>
          </button>
          <button class="btn btn-sm" (click)="resetView()" title="Reset View">
            <i class="icon-reset"></i>
          </button>
          <div class="quality-selector">
            <select [(ngModel)]="previewQuality" (change)="onQualityChange()">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Video Viewport -->
      <div class="video-viewport" #viewport>
        <div class="video-container" [style.transform]="getViewportTransform()">
          <video 
            #videoPlayer
            class="preview-video"
            [src]="currentVideoSrc"
            [muted]="playback.muted"
            [volume]="playback.volume"
            (loadedmetadata)="onVideoLoaded($event)"
            (timeupdate)="onTimeUpdate($event)"
            (ended)="onVideoEnded()"
            (error)="onVideoError($event)"
            (canplay)="onVideoCanPlay()"
            crossorigin="anonymous"
            preload="metadata"
          ></video>
          
          <!-- Video Placeholder -->
          <div class="video-placeholder" *ngIf="!currentVideoSrc">
            <div class="placeholder-icon">
              <i class="icon-video-large"></i>
            </div>
            <h4>No Preview</h4>
            <p>Add clips to timeline to see preview</p>
          </div>
        </div>
        
        <!-- Video Overlay -->
        <div class="video-overlay" *ngIf="currentVideoSrc">
          <!-- Center Play Button -->
          <div class="center-controls" [class.visible]="showCenterControls">
            <button class="play-btn-large" (click)="togglePlayback()">
              <i [class]="playback.playing ? 'icon-pause-large' : 'icon-play-large'"></i>
            </button>
          </div>
          
          <!-- Video Info Overlay -->
          <div class="video-info">
            <div class="timecode">
              {{ formatTime(playback.position) }} / {{ formatTime(videoDuration) }}
            </div>
            <div class="resolution" *ngIf="videoWidth && videoHeight">
              {{ videoWidth }}x{{ videoHeight }}
            </div>
          </div>
          
          <!-- Loading Indicator -->
          <div class="loading-indicator" *ngIf="isVideoLoading">
            <div class="spinner"></div>
            <span>Loading...</span>
          </div>
        </div>
      </div>

      <!-- Enhanced Playback Controls -->
      <div class="playback-controls">
        <!-- Transport Controls -->
        <div class="transport-controls">
          <button class="control-btn" (click)="goToStart()" title="Go to Start">
            <i class="icon-skip-start"></i>
          </button>
          <button class="control-btn" (click)="stepBackward()" title="Previous Frame">
            <i class="icon-step-backward"></i>
          </button>
          <button class="control-btn play-btn" (click)="togglePlayback()" title="Play/Pause">
            <i [class]="playback.playing ? 'icon-pause' : 'icon-play'"></i>
          </button>
          <button class="control-btn" (click)="stepForward()" title="Next Frame">
            <i class="icon-step-forward"></i>
          </button>
          <button class="control-btn" (click)="goToEnd()" title="Go to End">
            <i class="icon-skip-end"></i>
          </button>
        </div>
        
        <!-- Progress Bar -->
        <div class="progress-container">
          <input type="range" 
                 class="progress-bar"
                 min="0" 
                 [max]="videoDuration" 
                 [value]="playback.position"
                 (input)="onProgressChange($event)"
                 (mousedown)="onProgressMouseDown()"
                 (mouseup)="onProgressMouseUp()">
          <div class="progress-time">
            <span>{{ formatTime(playback.position) }}</span>
            <span>{{ formatTime(videoDuration) }}</span>
          </div>
        </div>
        
        <!-- Audio Controls -->
        <div class="audio-controls">
          <button class="control-btn" (click)="toggleMute()" title="Mute/Unmute">
            <i [class]="getMuteIcon()"></i>
          </button>
          <input type="range" 
                 class="volume-slider"
                 min="0" 
                 max="1" 
                 step="0.1"
                 [value]="playback.volume"
                 (input)="onVolumeChange($event)">
          <span class="volume-level">{{ (playback.volume * 100) | number:'1.0-0' }}%</span>
        </div>
        
        <!-- Playback Speed -->
        <div class="speed-controls">
          <label>Speed:</label>
          <select [(ngModel)]="playback.speed" (change)="onSpeedChange()">
            <option value="0.25">0.25x</option>
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
        
        <!-- Loop Control -->
        <div class="loop-controls">
          <button class="control-btn" 
                  [class.active]="playback.loop" 
                  (click)="toggleLoop()" 
                  title="Loop">
            <i class="icon-loop"></i>
          </button>
        </div>
      </div>

      <!-- Zoom Controls -->
      <div class="zoom-controls">
        <button class="btn btn-sm" (click)="zoomOut()" title="Zoom Out">
          <i class="icon-zoom-out"></i>
        </button>
        <span class="zoom-level">{{ (zoomLevel * 100) | number:'1.0-0' }}%</span>
        <button class="btn btn-sm" (click)="zoomIn()" title="Zoom In">
          <i class="icon-zoom-in"></i>
        </button>
        <button class="btn btn-sm" (click)="fitToWindow()" title="Fit to Window">
          <i class="icon-fit"></i>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./enhanced-preview.component.scss']
})
export class EnhancedPreviewComponent implements OnInit, OnDestroy {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  @ViewChild('viewport') viewport!: ElementRef<HTMLDivElement>;

  playback: PlaybackState = {
    playing: false,
    position: 0,
    speed: 1,
    loop: false,
    volume: 1,
    muted: false
  };

  currentVideoSrc = '';
  videoDuration = 0;
  videoWidth = 0;
  videoHeight = 0;
  zoomLevel = 1;
  panOffset = { x: 0, y: 0 };
  previewQuality: 'low' | 'medium' | 'high' = 'medium';
  
  // UI State
  showCenterControls = false;
  isVideoLoading = false;
  isProgressSeeking = false;

  private destroy$ = new Subject<void>();
  private hideControlsTimeout: any;

  constructor(private timelineService: TimelineService) {}

  ngOnInit(): void {
    this.timelineService.playback$
      .pipe(takeUntil(this.destroy$))
      .subscribe(playback => {
        this.playback = playback;
        this.updateVideoPlayback();
      });

    this.timelineService.timeline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(timeline => {
        this.updatePreviewFromTimeline(timeline);
      });

    // Show/hide center controls on mouse movement
    this.setupControlsVisibility();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout);
    }
  }

  private setupControlsVisibility(): void {
    const showControls = () => {
      this.showCenterControls = true;
      if (this.hideControlsTimeout) {
        clearTimeout(this.hideControlsTimeout);
      }
      this.hideControlsTimeout = setTimeout(() => {
        if (!this.playback.playing) {
          this.showCenterControls = false;
        }
      }, 3000);
    };

    // Show controls on mouse enter
    if (this.viewport) {
      this.viewport.nativeElement.addEventListener('mouseenter', showControls);
      this.viewport.nativeElement.addEventListener('mousemove', showControls);
      this.viewport.nativeElement.addEventListener('mouseleave', () => {
        this.showCenterControls = false;
      });
    }
  }

  private updateVideoPlayback(): void {
    if (!this.videoPlayer?.nativeElement) return;
    
    const video = this.videoPlayer.nativeElement;
    
    if (this.playback.playing && video.paused) {
      video.play().catch(console.error);
    } else if (!this.playback.playing && !video.paused) {
      video.pause();
    }
    
    // Sync position if not seeking
    if (!this.isProgressSeeking && Math.abs(video.currentTime - this.playback.position) > 0.1) {
      video.currentTime = this.playback.position;
    }
    
    video.playbackRate = this.playback.speed;
    video.volume = this.playback.volume;
    video.muted = this.playback.muted;
    video.loop = this.playback.loop;
  }

  private updatePreviewFromTimeline(timeline: any): void {
    // Find the clip at current position
    const currentClip = this.findClipAtPosition(timeline, this.playback.position);
    
    if (currentClip && currentClip.resource !== this.currentVideoSrc) {
      this.loadVideo(currentClip.resource);
      
      // Update video position relative to clip
      setTimeout(() => {
        if (this.videoPlayer?.nativeElement) {
          const clipTime = this.playback.position - currentClip.start + currentClip.in;
          this.videoPlayer.nativeElement.currentTime = clipTime;
        }
      }, 100);
    } else if (!currentClip) {
      this.currentVideoSrc = '';
    }
  }

  private findClipAtPosition(timeline: any, position: number): any {
    // Check video tracks first
    for (const track of timeline.videoTracks) {
      for (const clip of track.clips) {
        if (position >= clip.start && position < clip.start + clip.duration) {
          return clip;
        }
      }
    }
    return null;
  }

  private loadVideo(src: string): void {
    this.isVideoLoading = true;
    this.currentVideoSrc = src;
  }

  // Video Events
  onVideoLoaded(event: Event): void {
    const video = event.target as HTMLVideoElement;
    this.videoDuration = video.duration;
    this.videoWidth = video.videoWidth;
    this.videoHeight = video.videoHeight;
    this.isVideoLoading = false;
    this.fitToWindow();
  }

  onVideoCanPlay(): void {
    this.isVideoLoading = false;
  }

  onTimeUpdate(event: Event): void {
    const video = event.target as HTMLVideoElement;
    
    // Update timeline position if playing
    if (this.playback.playing && !this.isProgressSeeking) {
      this.timelineService.setPlaybackPosition(video.currentTime);
    }
  }

  onVideoEnded(): void {
    if (!this.playback.loop) {
      this.timelineService.pause();
    }
  }

  onVideoError(event: Event): void {
    console.error('Video playback error:', event);
    this.isVideoLoading = false;
    this.currentVideoSrc = '';
  }

  // Playback Controls
  togglePlayback(): void {
    this.timelineService.togglePlayback();
  }

  goToStart(): void {
    this.timelineService.setPlaybackPosition(0);
  }

  goToEnd(): void {
    this.timelineService.setPlaybackPosition(this.videoDuration);
  }

  stepBackward(): void {
    const frameTime = 1 / 25; // Assuming 25fps
    const newTime = Math.max(0, this.playback.position - frameTime);
    this.timelineService.setPlaybackPosition(newTime);
  }

  stepForward(): void {
    const frameTime = 1 / 25; // Assuming 25fps
    const newTime = Math.min(this.videoDuration, this.playback.position + frameTime);
    this.timelineService.setPlaybackPosition(newTime);
  }

  // Progress Control
  onProgressChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const time = parseFloat(target.value);
    this.timelineService.setPlaybackPosition(time);
  }

  onProgressMouseDown(): void {
    this.isProgressSeeking = true;
  }

  onProgressMouseUp(): void {
    this.isProgressSeeking = false;
  }

  // Audio Controls
  toggleMute(): void {
    this.playback.muted = !this.playback.muted;
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.muted = this.playback.muted;
    }
  }

  onVolumeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.playback.volume = parseFloat(target.value);
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.volume = this.playback.volume;
    }
  }

  getMuteIcon(): string {
    if (this.playback.muted || this.playback.volume === 0) {
      return 'icon-volume-mute';
    } else if (this.playback.volume < 0.5) {
      return 'icon-volume-low';
    } else {
      return 'icon-volume-high';
    }
  }

  // Speed Control
  onSpeedChange(): void {
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.playbackRate = this.playback.speed;
    }
  }

  // Loop Control
  toggleLoop(): void {
    this.playback.loop = !this.playback.loop;
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.loop = this.playback.loop;
    }
  }

  // Quality Control
  onQualityChange(): void {
    // Implement quality change logic
    console.log('Quality changed to:', this.previewQuality);
  }

  // Viewport Controls
  zoomIn(): void {
    this.zoomLevel = Math.min(this.zoomLevel * 1.2, 5);
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.1);
  }

  fitToWindow(): void {
    if (!this.viewport?.nativeElement || !this.videoWidth || !this.videoHeight) return;
    
    const container = this.viewport.nativeElement;
    const containerWidth = container.clientWidth - 40;
    const containerHeight = container.clientHeight - 40;
    
    const scaleX = containerWidth / this.videoWidth;
    const scaleY = containerHeight / this.videoHeight;
    
    this.zoomLevel = Math.min(scaleX, scaleY, 1);
    this.panOffset = { x: 0, y: 0 };
  }

  resetView(): void {
    this.zoomLevel = 1;
    this.panOffset = { x: 0, y: 0 };
  }

  toggleFullscreen(): void {
    if (!this.viewport?.nativeElement) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.viewport.nativeElement.requestFullscreen();
    }
  }

  getViewportTransform(): string {
    return `scale(${this.zoomLevel}) translate(${this.panOffset.x}px, ${this.panOffset.y}px)`;
  }

  // Utility Methods
  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}