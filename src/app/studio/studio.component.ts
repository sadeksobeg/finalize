import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { MediaService } from '../proxy/medias/media.service';
import { MediaDto } from '../proxy/medias/models';

@Component({
  selector: 'app-studio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './studio.component.html',
  styleUrls: ['./studio.component.css']
})
export class StudioComponent implements OnInit, OnDestroy {
  @ViewChild('videoPreview', { static: false }) videoPreview!: ElementRef<HTMLVideoElement>;
  @ViewChild('timeline', { static: false }) timeline!: ElementRef<HTMLDivElement>;

  // Core Properties
  selectedTool: 'pointer' | 'razor' | 'text' = 'pointer';
  snappingEnabled = true;
  leftTab: 'files' | 'effects' | 'transitions' = 'files';
  
  // Media Properties
  mediaFiles: MediaDto[] = [];
  selectedFile: MediaDto | null = null;
  filesView: 'list' | 'thumbnails' = 'list';
  
  // Preview Properties
  previewMode: 'fit' | 'fill' | 'actual' = 'fit';
  previewWidth = 640;
  previewHeight = 360;
  
  // Timeline Properties
  timelineZoom = 50;
  currentTime = 0;
  duration = 0;
  tracks: any[] = [
    { id: 1, name: 'Track 1', type: 'video', clips: [], muted: false, visible: true, locked: false },
    { id: 2, name: 'Track 2', type: 'video', clips: [], muted: false, visible: true, locked: false },
    { id: 3, name: 'Track 3', type: 'audio', clips: [], muted: false, visible: true, locked: false }
  ];
  selectedClips: any[] = [];
  
  // Playback Properties
  playback = {
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false
  };
  
  // History Properties
  canUndo = false;
  canRedo = false;
  history: any[] = [];
  historyIndex = -1;
  
  // Effects and Transitions
  availableEffects: any[] = [
    { name: 'Blur', category: 'Video', icon: '🌫️' },
    { name: 'Brightness', category: 'Video', icon: '☀️' },
    { name: 'Contrast', category: 'Video', icon: '🔆' },
    { name: 'Fade In', category: 'Audio', icon: '📈' },
    { name: 'Fade Out', category: 'Audio', icon: '📉' }
  ];
  
  availableTransitions: any[] = [
    { name: 'Fade', icon: '🔄' },
    { name: 'Dissolve', icon: '💫' },
    { name: 'Wipe', icon: '🧹' },
    { name: 'Slide', icon: '➡️' }
  ];

  // Selected clip properties
  selectedClip: any = null;
  clipProperties = {
    position: { x: 0, y: 0 },
    scale: { x: 100, y: 100 },
    rotation: 0,
    opacity: 100,
    volume: 100
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private http: HttpClient,
    private mediaService: MediaService
  ) {}

  ngOnInit(): void {
    this.loadMediaFiles();
    this.initializeTimeline();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Menu Actions
  showMenu(menu: string): void {
    console.log('Show menu:', menu);
  }

  newProject(): void {
    console.log('New project');
  }

  openProject(): void {
    console.log('Open project');
  }

  saveProject(): void {
    console.log('Save project');
  }

  importMedia(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'video/*,audio/*,image/*';
    input.onchange = (event: any) => {
      const files = event.target.files;
      for (let file of files) {
        this.addMediaFile(file);
      }
    };
    input.click();
  }

  exportProject(): void {
    console.log('Export project');
  }

  // Tool Actions
  setTool(tool: 'pointer' | 'razor' | 'text'): void {
    this.selectedTool = tool;
  }

  toggleSnapping(): void {
    this.snappingEnabled = !this.snappingEnabled;
  }

  // History Actions
  undo(): void {
    if (this.canUndo) {
      this.historyIndex--;
      this.canUndo = this.historyIndex > 0;
      this.canRedo = true;
    }
  }

  redo(): void {
    if (this.canRedo) {
      this.historyIndex++;
      this.canRedo = this.historyIndex < this.history.length - 1;
      this.canUndo = true;
    }
  }

  // Tab Management
  setLeftTab(tab: 'files' | 'effects' | 'transitions'): void {
    this.leftTab = tab;
  }

  // Media Management
  private loadMediaFiles(): void {
    // Load media files from backend using the real API
    this.mediaService.getList({
      skipCount: 0,
      maxResultCount: 100,
      sorting: 'creationTime desc'
    }).subscribe({
      next: (response) => {
        console.log('Loaded media files:', response);
        this.mediaFiles = response.items || [];
      },
      error: (error) => {
        console.error('Error loading media files:', error);
        // Initialize with empty array if API fails
        this.mediaFiles = [];
      }
    });
  }

  private addMediaFile(file: File): void {
    // For now, just create a temporary media object for local files
    // In a real implementation, you would upload this to the backend first
    const mediaFile: MediaDto = {
      id: Date.now().toString(),
      title: file.name,
      description: `Local file: ${file.name}`,
      video: URL.createObjectURL(file),
      projectId: '',
      sourceLanguage: 'en',
      destinationLanguage: 'ar'
    };
    this.mediaFiles.push(mediaFile);
  }

  selectFile(file: MediaDto): void {
    this.selectedFile = file;
    if (file.video && this.videoPreview) {
      this.videoPreview.nativeElement.src = file.video;
    }
  }

  // Timeline Management
  private initializeTimeline(): void {
    // Initialize timeline with default settings
    this.duration = 300; // 5 minutes default
  }

  addToTimeline(file: MediaDto): void {
    // Add file to the first available track
    const track = this.tracks.find(t => t.type === 'video');
    if (track) {
      const clip = {
        id: Date.now(),
        name: file.title || 'Untitled',
        file: file,
        startTime: 0,
        duration: 10, // Default duration, would be calculated from actual video
        track: track.id
      };
      track.clips.push(clip);
      console.log('Added clip to timeline:', clip);
    }
  }

  // Playback Controls
  togglePlayback(): void {
    this.playback.playing = !this.playback.playing;
    if (this.videoPreview) {
      if (this.playback.playing) {
        this.videoPreview.nativeElement.play();
      } else {
        this.videoPreview.nativeElement.pause();
      }
    }
  }

  goToStart(): void {
    this.currentTime = 0;
    this.playback.currentTime = 0;
    if (this.videoPreview) {
      this.videoPreview.nativeElement.currentTime = 0;
    }
  }

  goToEnd(): void {
    this.currentTime = this.duration;
    this.playback.currentTime = this.duration;
    if (this.videoPreview) {
      this.videoPreview.nativeElement.currentTime = this.duration;
    }
  }

  stepBackward(): void {
    this.currentTime = Math.max(0, this.currentTime - 1);
    this.playback.currentTime = this.currentTime;
    if (this.videoPreview) {
      this.videoPreview.nativeElement.currentTime = this.currentTime;
    }
  }

  stepForward(): void {
    this.currentTime = Math.min(this.duration, this.currentTime + 1);
    this.playback.currentTime = this.currentTime;
    if (this.videoPreview) {
      this.videoPreview.nativeElement.currentTime = this.currentTime;
    }
  }

  toggleMute(): void {
    this.playback.muted = !this.playback.muted;
    if (this.videoPreview) {
      this.videoPreview.nativeElement.muted = this.playback.muted;
    }
  }

  // Track Management
  toggleTrackMute(track: any): void {
    track.muted = !track.muted;
  }

  toggleTrackVisibility(track: any): void {
    track.visible = !track.visible;
  }

  toggleTrackLock(track: any): void {
    track.locked = !track.locked;
  }

  // Clip Management
  selectClip(clip: any): void {
    this.selectedClip = clip;
    this.selectedClips = [clip];
  }

  isClipSelected(clip: any): boolean {
    return this.selectedClips.includes(clip);
  }

  // Zoom Controls
  zoomIn(): void {
    this.timelineZoom = Math.min(200, this.timelineZoom + 10);
  }

  zoomOut(): void {
    this.timelineZoom = Math.max(10, this.timelineZoom - 10);
  }

  // Keyboard Shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.ctrlKey) {
      switch (event.key) {
        case 'z':
          event.preventDefault();
          this.undo();
          break;
        case 'y':
          event.preventDefault();
          this.redo();
          break;
        case 's':
          event.preventDefault();
          this.saveProject();
          break;
      }
    } else {
      switch (event.key) {
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
        case 't':
          this.setTool('text');
          break;
      }
    }
  }
}
