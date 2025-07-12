import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { StudioMediaService } from './media.service';
import { Resource } from '../models/studio.models';

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

/**
 * Professional Upload Service
 * Handles multi-file uploads with progress tracking and drag-and-drop support
 */
@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private uploadQueue$ = new BehaviorSubject<UploadProgress[]>([]);
  private uploadComplete$ = new Subject<Resource>();

  constructor(private mediaService: StudioMediaService) {}

  get uploads$(): Observable<UploadProgress[]> {
    return this.uploadQueue$.asObservable();
  }

  get uploadComplete(): Observable<Resource> {
    return this.uploadComplete$.asObservable();
  }

  /**
   * Upload multiple files with progress tracking
   */
  async uploadFiles(files: FileList | File[]): Promise<void> {
    const fileArray = Array.from(files);
    const uploads: UploadProgress[] = fileArray.map(file => ({
      fileId: this.generateFileId(),
      fileName: file.name,
      progress: 0,
      status: 'pending'
    }));

    // Add to queue
    const currentQueue = this.uploadQueue$.value;
    this.uploadQueue$.next([...currentQueue, ...uploads]);

    // Process uploads
    for (let i = 0; i < fileArray.length; i++) {
      await this.processFileUpload(fileArray[i], uploads[i]);
    }
  }

  /**
   * Process individual file upload
   */
  private async processFileUpload(file: File, uploadProgress: UploadProgress): Promise<void> {
    try {
      // Validate file
      if (!this.isValidMediaFile(file)) {
        this.updateUploadStatus(uploadProgress.fileId, 'error', 0, 'Invalid file type');
        return;
      }

      // Start upload
      this.updateUploadStatus(uploadProgress.fileId, 'uploading', 10);

      // Simulate upload progress (replace with actual upload logic)
      await this.simulateUploadProgress(uploadProgress.fileId);

      // Process with media service
      this.updateUploadStatus(uploadProgress.fileId, 'processing', 90);
      
      const resource = await this.mediaService.addResource(file);
      
      this.updateUploadStatus(uploadProgress.fileId, 'complete', 100);
      this.uploadComplete$.next(resource);

      // Remove from queue after delay
      setTimeout(() => {
        this.removeFromQueue(uploadProgress.fileId);
      }, 2000);

    } catch (error) {
      console.error('Upload failed:', error);
      this.updateUploadStatus(
        uploadProgress.fileId, 
        'error', 
        0, 
        error instanceof Error ? error.message : 'Upload failed'
      );
    }
  }

  /**
   * Simulate upload progress (replace with real upload implementation)
   */
  private async simulateUploadProgress(fileId: string): Promise<void> {
    for (let progress = 20; progress <= 80; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      this.updateUploadStatus(fileId, 'uploading', progress);
    }
  }

  /**
   * Update upload status
   */
  private updateUploadStatus(
    fileId: string, 
    status: UploadProgress['status'], 
    progress: number, 
    error?: string
  ): void {
    const queue = this.uploadQueue$.value;
    const index = queue.findIndex(upload => upload.fileId === fileId);
    
    if (index >= 0) {
      queue[index] = { ...queue[index], status, progress, error };
      this.uploadQueue$.next([...queue]);
    }
  }

  /**
   * Remove upload from queue
   */
  private removeFromQueue(fileId: string): void {
    const queue = this.uploadQueue$.value;
    const filtered = queue.filter(upload => upload.fileId !== fileId);
    this.uploadQueue$.next(filtered);
  }

  /**
   * Validate media file type
   */
  private isValidMediaFile(file: File): boolean {
    const validTypes = [
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
    ];
    
    return validTypes.some(type => file.type.startsWith(type.split('/')[0])) ||
           validTypes.includes(file.type);
  }

  /**
   * Generate unique file ID
   */
  private generateFileId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Cancel upload
   */
  cancelUpload(fileId: string): void {
    this.updateUploadStatus(fileId, 'error', 0, 'Cancelled by user');
    setTimeout(() => this.removeFromQueue(fileId), 1000);
  }

  /**
   * Clear completed uploads
   */
  clearCompleted(): void {
    const queue = this.uploadQueue$.value;
    const filtered = queue.filter(upload => 
      upload.status !== 'complete' && upload.status !== 'error'
    );
    this.uploadQueue$.next(filtered);
  }
}