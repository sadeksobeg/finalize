import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timeline-zoom',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timeline-zoom">
      <button class="zoom-btn" (click)="zoomOut()" [disabled]="scale <= minScale" title="Zoom Out">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5,14H14.71L14.43,13.73C15.41,12.59 16,11.11 16,9.5A6.5,6.5 0 0,0 9.5,3A6.5,6.5 0 0,0 3,9.5A6.5,6.5 0 0,0 9.5,16C11.11,16 12.59,15.41 13.73,14.43L14,14.71V15.5L19,20.49L20.49,19L15.5,14M9.5,14A4.5,4.5 0 0,1 5,9.5A4.5,4.5 0 0,1 9.5,5A4.5,4.5 0 0,1 14,9.5A4.5,4.5 0 0,1 9.5,14M7,9H12V10H7V9Z"/>
        </svg>
      </button>
      
      <div class="zoom-slider-container">
        <input type="range" 
               class="zoom-slider"
               [min]="minScale" 
               [max]="maxScale" 
               [step]="scaleStep"
               [value]="scale"
               (input)="onScaleChange($event)"
               title="Timeline Zoom">
        <div class="zoom-labels">
          <span class="zoom-label">{{ formatScale(minScale) }}</span>
          <span class="zoom-label current">{{ formatScale(scale) }}</span>
          <span class="zoom-label">{{ formatScale(maxScale) }}</span>
        </div>
      </div>
      
      <button class="zoom-btn" (click)="zoomIn()" [disabled]="scale >= maxScale" title="Zoom In">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5,14H14.71L14.43,13.73C15.41,12.59 16,11.11 16,9.5A6.5,6.5 0 0,0 9.5,3A6.5,6.5 0 0,0 3,9.5A6.5,6.5 0 0,0 9.5,16C11.11,16 12.59,15.41 13.73,14.43L14,14.71V15.5L19,20.49L20.49,19L15.5,14M9.5,14A4.5,4.5 0 0,1 5,9.5A4.5,4.5 0 0,1 9.5,5A4.5,4.5 0 0,1 14,9.5A4.5,4.5 0 0,1 9.5,14M7,9V10H9V12H10V10H12V9H10V7H9V9H7Z"/>
        </svg>
      </button>
      
      <button class="zoom-btn fit-btn" (click)="fitToWindow()" title="Fit to Window">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9,9H15V15H9V9M11,11V13H13V11H11M2,2V8H4V4H8V2H2M22,2H16V4H20V8H22V2M2,22H8V20H4V16H2V22M22,22V16H20V20H16V22H22Z"/>
        </svg>
      </button>
    </div>
  `,
  styles: [`
    .timeline-zoom {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #2a2a2a;
      border-radius: 6px;
      border: 1px solid #404040;
    }

    .zoom-btn {
      background: transparent;
      border: 1px solid #555;
      color: #ccc;
      padding: 6px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: #404040;
        color: #fff;
        border-color: #666;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .fit-btn {
      border-color: #4a90e2;
      color: #4a90e2;

      &:hover:not(:disabled) {
        background: rgba(74, 144, 226, 0.1);
        border-color: #5ba0f2;
        color: #5ba0f2;
      }
    }

    .zoom-slider-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .zoom-slider {
      width: 120px;
      height: 4px;
      background: #404040;
      border-radius: 2px;
      outline: none;
      cursor: pointer;

      &::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        background: #4a90e2;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);

        &:hover {
          background: #5ba0f2;
        }
      }

      &::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: #4a90e2;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);

        &:hover {
          background: #5ba0f2;
        }
      }
    }

    .zoom-labels {
      display: flex;
      justify-content: space-between;
      width: 120px;
      font-size: 10px;
      color: #888;
    }

    .zoom-label {
      &.current {
        color: #4a90e2;
        font-weight: 500;
      }
    }
  `]
})
export class TimelineZoomComponent {
  @Input() scale: number = 10;
  @Input() minScale: number = 1;
  @Input() maxScale: number = 100;
  @Input() scaleStep: number = 1;
  @Input() duration: number = 60;
  @Input() containerWidth: number = 800;

  @Output() scaleChanged = new EventEmitter<number>();

  zoomIn(): void {
    const newScale = Math.min(this.scale + this.scaleStep, this.maxScale);
    if (newScale !== this.scale) {
      this.scale = newScale;
      this.scaleChanged.emit(this.scale);
    }
  }

  zoomOut(): void {
    const newScale = Math.max(this.scale - this.scaleStep, this.minScale);
    if (newScale !== this.scale) {
      this.scale = newScale;
      this.scaleChanged.emit(this.scale);
    }
  }

  onScaleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newScale = parseFloat(target.value);
    if (newScale !== this.scale) {
      this.scale = newScale;
      this.scaleChanged.emit(this.scale);
    }
  }

  fitToWindow(): void {
    if (this.duration > 0 && this.containerWidth > 0) {
      const newScale = Math.max(this.containerWidth / this.duration, this.minScale);
      const clampedScale = Math.min(newScale, this.maxScale);
      if (clampedScale !== this.scale) {
        this.scale = clampedScale;
        this.scaleChanged.emit(this.scale);
      }
    }
  }

  formatScale(scale: number): string {
    if (scale < 1) return `${(scale * 100).toFixed(0)}%`;
    if (scale >= 10) return `${scale.toFixed(0)}x`;
    return `${scale.toFixed(1)}x`;
  }
}
