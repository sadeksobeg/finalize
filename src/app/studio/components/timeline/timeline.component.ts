import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { TimelineService } from '../../services/timeline.service';
import { Timeline } from '../../models/studio.models';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timeline-container">
      <div class="timeline-header">
        <h3>OpenShot Timeline</h3>
        <div class="timeline-controls">
          <button class="btn btn-sm" (click)="addVideoTrack()">Add Video Track</button>
          <button class="btn btn-sm" (click)="addAudioTrack()">Add Audio Track</button>
        </div>
      </div>
      <div class="timeline-content">
        <p>Timeline functionality is being implemented...</p>
        <p>Tracks: {{ timeline.videoTracks.length }} video, {{ timeline.audioTracks.length }} audio</p>
      </div>
    </div>
  `,
  styles: [`
    .timeline-container {
      height: 300px;
      background: #2a2a2a;
      color: white;
      padding: 16px;
    }
    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .timeline-controls {
      display: flex;
      gap: 8px;
    }
    .btn {
      padding: 8px 12px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn:hover {
      background: #45a049;
    }
    .timeline-content {
      background: #333;
      padding: 16px;
      border-radius: 4px;
    }
  `]
})
export class TimelineComponent implements OnInit, OnDestroy {
  timeline: Timeline = {
    fps: 25,
    width: 1920,
    height: 1080,
    duration: 0,
    position: 0,
    scale: 1,
    videoTracks: [],
    audioTracks: []
  };

  private destroy$ = new Subject<void>();

  constructor(private timelineService: TimelineService) {}

  ngOnInit(): void {
    this.timelineService.timeline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(timeline => {
        this.timeline = timeline;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addVideoTrack(): void {
    this.timelineService.addVideoTrack();
  }

  addAudioTrack(): void {
    this.timelineService.addAudioTrack();
  }
}