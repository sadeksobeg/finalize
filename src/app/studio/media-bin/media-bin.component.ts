import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import { StudioMediaService } from '../services/media.service';
import { Resource } from '../models/studio.models';

@Component({
  selector: 'app-media-bin',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './media-bin.component.html',
  styleUrl: './media-bin.component.scss'
})
export class MediaBinComponent implements OnInit, OnDestroy {
  @Output() resourceSelected = new EventEmitter<Resource>();

  resources: Resource[] = [];
  selectedResource: Resource | null = null;
  private destroy$ = new Subject<void>();

  constructor(private mediaService: StudioMediaService) { }

  ngOnInit(): void {
    this.mediaService.resources$
      .pipe(takeUntil(this.destroy$))
      .subscribe(resources => {
        this.resources = resources;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByResourceId(index: number, resource: Resource): string {
    return resource.id;
  }

  selectResource(resource: Resource): void {
    this.selectedResource = resource;
    this.resourceSelected.emit(resource);
  }

  loadToPreview(resource: Resource): void {
    this.resourceSelected.emit(resource);
  }

  removeResource(resource: Resource): void {
    this.mediaService.removeResource(resource.id);
  }

  formatDuration(duration: number): string {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
