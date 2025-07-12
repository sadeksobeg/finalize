import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import { StudioMediaService } from '../../services/media.service';
import { UploadService, UploadProgress } from '../../services/upload.service';
import { Resource } from '../../models/studio.models';

/**
 * Enhanced Media Bin Component
 * Professional media management with drag-and-drop upload and advanced filtering
 */
@Component({
  selector: 'app-enhanced-media-bin',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="enhanced-media-bin">
      <!-- Media Bin Header -->
      <div class="media-bin-header">
        <h3 class="panel-title">Project Media</h3>
        <div class="media-bin-controls">
          <input 
            type="file" 
            #fileInput 
            style="display: none;" 
            multiple
            accept="video/*,audio/*,image/*"
            (change)="onFilesSelected($event)"
          />
          <button class="btn btn-primary" (click)="fileInput.click()">
            <i class="icon-import"></i>
            Import Media
          </button>
          <button class="btn btn-secondary" (click)="clearAll()">
            <i class="icon-trash"></i>
            Clear All
          </button>
          <button class="btn btn-secondary" (click)="toggleView()">
            <i [class]="viewMode === 'grid' ? 'icon-list' : 'icon-grid'"></i>
            {{ viewMode === 'grid' ? 'List' : 'Grid' }}
          </button>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="search-filter-section">
        <div class="search-container">
          <div class="search-input-wrapper">
            <i class="icon-search"></i>
            <input 
              type="text" 
              placeholder="Search media files..." 
              [(ngModel)]="searchQuery"
              (input)="filterMedia()"
              class="search-input"
            />
          </div>
          <div class="filter-controls">
            <select class="filter-select" [(ngModel)]="selectedTypeFilter" (change)="filterMedia()">
              <option value="">All Types</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="image">Image</option>
            </select>
            <select class="filter-select" [(ngModel)]="sortBy" (change)="sortMedia()">
              <option value="name">Name</option>
              <option value="date">Date Added</option>
              <option value="size">File Size</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Upload Progress -->
      <div class="upload-progress-section" *ngIf="uploads.length > 0">
        <div class="upload-header">
          <h4>Uploading Files</h4>
          <button class="btn btn-sm" (click)="clearCompletedUploads()">
            <i class="icon-clear"></i>
            Clear Completed
          </button>
        </div>
        <div class="upload-list">
          <div *ngFor="let upload of uploads" class="upload-item" [class]="upload.status">
            <div class="upload-info">
              <span class="file-name">{{ upload.fileName }}</span>
              <span class="upload-status">{{ getStatusText(upload.status) }}</span>
            </div>
            <div class="upload-progress">
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="upload.progress"></div>
              </div>
              <span class="progress-text">{{ upload.progress }}%</span>
            </div>
            <button *ngIf="upload.status === 'uploading'" 
                    class="btn btn-xs cancel-btn" 
                    (click)="cancelUpload(upload.fileId)">
              <i class="icon-cancel"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Drag and Drop Zone -->
      <div class="drop-zone" 
           [class.dragover]="isDragOver"
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave($event)"
           (drop)="onDrop($event)"
           *ngIf="filteredResources.length === 0 && uploads.length === 0">
        <div class="drop-zone-content">
          <div class="drop-icon">
            <i class="icon-upload-large"></i>
          </div>
          <h3>Drop Media Files Here</h3>
          <p>Or click "Import Media" to browse files</p>
          <div class="supported-formats">
            <span>Supported: MP4, MOV, AVI, MP3, WAV, JPG, PNG</span>
          </div>
        </div>
      </div>

      <!-- Media Content -->
      <div class="media-bin-content" *ngIf="filteredResources.length > 0">
        <!-- Grid View -->
        <div class="media-grid" *ngIf="viewMode === 'grid'" cdkDropList id="media-bin">
          <div *ngFor="let resource of filteredResources; trackBy: trackByResourceId"
               class="media-item"
               [class.selected]="selectedResource?.id === resource.id"
               (click)="selectResource(resource)"
               (dblclick)="loadToPreview(resource)"
               cdkDrag
               [cdkDragData]="{ resource: resource }">

            <div class="media-thumbnail">
              <img *ngIf="resource.thumbnail" 
                   [src]="resource.thumbnail" 
                   [alt]="resource.name"
                   class="thumbnail-image"
                   loading="lazy"
                   (error)="onThumbnailError($event, resource)">
              <div *ngIf="!resource.thumbnail" class="thumbnail-placeholder">
                <i [class]="getMediaIcon(resource.type)"></i>
              </div>

              <div class="media-overlay">
                <div class="media-type-badge" [class]="'type-' + resource.type">
                  {{ resource.type.toUpperCase() }}
                </div>
                <div class="media-duration" *ngIf="resource.duration">
                  {{ formatDuration(resource.duration) }}
                </div>
              </div>

              <div class="play-button" *ngIf="resource.type === 'video' || resource.type === 'audio'">
                <i class="icon-play"></i>
              </div>
            </div>

            <div class="media-info">
              <div class="media-name" [title]="resource.name">{{ resource.name }}</div>
              <div class="media-details">
                <span *ngIf="resource.width && resource.height">
                  {{ resource.width }}x{{ resource.height }}
                </span>
                <span *ngIf="resource.fps"> • {{ resource.fps }}fps</span>
                <span *ngIf="resource.duration"> • {{ formatDuration(resource.duration) }}</span>
              </div>
            </div>

            <div class="media-actions">
              <button class="action-btn preview-btn"
                      (click)="$event.stopPropagation(); loadToPreview(resource)"
                      title="Load to Preview">
                <i class="icon-play"></i>
              </button>
              <button class="action-btn remove-btn"
                      (click)="$event.stopPropagation(); removeResource(resource)"
                      title="Remove">
                <i class="icon-trash"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div class="media-list" *ngIf="viewMode === 'list'">
          <div class="list-header">
            <div class="col-thumbnail">Preview</div>
            <div class="col-name">Name</div>
            <div class="col-type">Type</div>
            <div class="col-duration">Duration</div>
            <div class="col-resolution">Resolution</div>
            <div class="col-actions">Actions</div>
          </div>
          <div *ngFor="let resource of filteredResources; trackBy: trackByResourceId"
               class="list-item"
               [class.selected]="selectedResource?.id === resource.id"
               (click)="selectResource(resource)"
               (dblclick)="loadToPreview(resource)"
               cdkDrag
               [cdkDragData]="{ resource: resource }">
            
            <div class="col-thumbnail">
              <div class="list-thumbnail">
                <img *ngIf="resource.thumbnail" 
                     [src]="resource.thumbnail" 
                     [alt]="resource.name"
                     loading="lazy">
                <i *ngIf="!resource.thumbnail" [class]="getMediaIcon(resource.type)"></i>
              </div>
            </div>
            <div class="col-name">
              <span class="resource-name" [title]="resource.name">{{ resource.name }}</span>
            </div>
            <div class="col-type">
              <span class="type-badge" [class]="'type-' + resource.type">
                {{ resource.type }}
              </span>
            </div>
            <div class="col-duration">
              {{ resource.duration ? formatDuration(resource.duration) : '-' }}
            </div>
            <div class="col-resolution">
              {{ resource.width && resource.height ? resource.width + 'x' + resource.height : '-' }}
            </div>
            <div class="col-actions">
              <button class="action-btn preview-btn"
                      (click)="$event.stopPropagation(); loadToPreview(resource)"
                      title="Load to Preview">
                <i class="icon-play"></i>
              </button>
              <button class="action-btn remove-btn"
                      (click)="$event.stopPropagation(); removeResource(resource)"
                      title="Remove">
                <i class="icon-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Media Statistics -->
      <div class="media-stats" *ngIf="resources.length > 0">
        <div class="stats-item">
          <span class="stats-label">Total Files:</span>
          <span class="stats-value">{{ resources.length }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">Videos:</span>
          <span class="stats-value">{{ getTypeCount('video') }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">Audio:</span>
          <span class="stats-value">{{ getTypeCount('audio') }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">Images:</span>
          <span class="stats-value">{{ getTypeCount('image') }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./enhanced-media-bin.component.scss']
})
export class EnhancedMediaBinComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Output() resourceSelected = new EventEmitter<Resource>();

  resources: Resource[] = [];
  filteredResources: Resource[] = [];
  selectedResource: Resource | null = null;
  uploads: UploadProgress[] = [];
  
  // UI State
  viewMode: 'grid' | 'list' = 'grid';
  searchQuery = '';
  selectedTypeFilter = '';
  sortBy = 'name';
  isDragOver = false;

  private destroy$ = new Subject<void>();

  constructor(
    private mediaService: StudioMediaService,
    private uploadService: UploadService
  ) {}

  ngOnInit(): void {
    this.mediaService.resources$
      .pipe(takeUntil(this.destroy$))
      .subscribe(resources => {
        this.resources = resources;
        this.filterMedia();
      });

    this.uploadService.uploads$
      .pipe(takeUntil(this.destroy$))
      .subscribe(uploads => {
        this.uploads = uploads;
      });

    this.uploadService.uploadComplete
      .pipe(takeUntil(this.destroy$))
      .subscribe(resource => {
        // Resource automatically added via mediaService
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // File Selection and Upload
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    
    if (files && files.length > 0) {
      this.uploadService.uploadFiles(files);
    }
    
    // Reset input
    input.value = '';
  }

  // Drag and Drop
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadService.uploadFiles(files);
    }
  }

  // Resource Management
  selectResource(resource: Resource): void {
    this.selectedResource = this.selectedResource?.id === resource.id ? null : resource;
    if (this.selectedResource) {
      this.resourceSelected.emit(this.selectedResource);
    }
  }

  loadToPreview(resource: Resource): void {
    this.resourceSelected.emit(resource);
  }

  removeResource(resource: Resource): void {
    if (confirm(`Remove "${resource.name}" from project?`)) {
      this.mediaService.removeResource(resource.id);
      if (this.selectedResource?.id === resource.id) {
        this.selectedResource = null;
      }
    }
  }

  clearAll(): void {
    if (this.resources.length === 0) return;
    
    if (confirm('Remove all media files from project? This cannot be undone.')) {
      this.resources.forEach(resource => {
        this.mediaService.removeResource(resource.id);
      });
      this.selectedResource = null;
    }
  }

  // Upload Management
  cancelUpload(fileId: string): void {
    this.uploadService.cancelUpload(fileId);
  }

  clearCompletedUploads(): void {
    this.uploadService.clearCompleted();
  }

  getStatusText(status: UploadProgress['status']): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'uploading': return 'Uploading';
      case 'processing': return 'Processing';
      case 'complete': return 'Complete';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  }

  // View Management
  toggleView(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  // Filtering and Sorting
  filterMedia(): void {
    let filtered = [...this.resources];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.name.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (this.selectedTypeFilter) {
      filtered = filtered.filter(resource =>
        resource.type === this.selectedTypeFilter
      );
    }

    this.filteredResources = filtered;
    this.sortMedia();
  }

  sortMedia(): void {
    this.filteredResources.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return (b.imported?.getTime() || 0) - (a.imported?.getTime() || 0);
        case 'size':
          return (b.fileSize || 0) - (a.fileSize || 0);
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        default:
          return 0;
      }
    });
  }

  // Utility Methods
  formatDuration(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  getMediaIcon(type: string): string {
    switch (type) {
      case 'video': return 'icon-video';
      case 'audio': return 'icon-audio';
      case 'image': return 'icon-image';
      default: return 'icon-file';
    }
  }

  onThumbnailError(event: Event, resource: Resource): void {
    console.warn(`Thumbnail failed to load for ${resource.name}`);
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  trackByResourceId(index: number, resource: Resource): string {
    return resource.id;
  }

  getTypeCount(type: string): number {
    return this.resources.filter(resource => resource.type === type).length;
  }
}