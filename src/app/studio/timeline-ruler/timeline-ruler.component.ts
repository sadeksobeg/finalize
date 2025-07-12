import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timeline-ruler',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timeline-ruler" #rulerContainer>
      <canvas #rulerCanvas 
              class="ruler-canvas"
              (click)="onRulerClick($event)"
              (mousemove)="onRulerMouseMove($event)">
      </canvas>
      <div class="playhead" 
           [style.left.px]="playheadPosition"
           (mousedown)="startDragging($event)">
        <div class="playhead-line"></div>
        <div class="playhead-handle"></div>
      </div>
    </div>
  `,
  styles: [`
    .timeline-ruler {
      position: relative;
      height: 40px;
      background: #2a2a2a;
      border-bottom: 1px solid #404040;
      overflow: hidden;
    }

    .ruler-canvas {
      width: 100%;
      height: 100%;
      cursor: pointer;
    }

    .playhead {
      position: absolute;
      top: 0;
      width: 2px;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    }

    .playhead-line {
      width: 2px;
      height: 100%;
      background: #ff6b35;
      box-shadow: 0 0 4px rgba(255, 107, 53, 0.5);
    }

    .playhead-handle {
      position: absolute;
      top: -5px;
      left: -8px;
      width: 18px;
      height: 18px;
      background: #ff6b35;
      border: 2px solid #fff;
      border-radius: 50%;
      cursor: grab;
      pointer-events: all;
      
      &:active {
        cursor: grabbing;
      }
    }

    .playhead-handle:hover {
      background: #ff8c5a;
    }
  `]
})
export class TimelineRulerComponent implements OnInit, OnDestroy {
  @ViewChild('rulerCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rulerContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  @Input() duration: number = 60; // Total duration in seconds
  @Input() scale: number = 10; // Pixels per second
  @Input() currentTime: number = 0; // Current playhead position in seconds
  @Input() fps: number = 25; // Frames per second

  @Output() timeChanged = new EventEmitter<number>();
  @Output() seeking = new EventEmitter<boolean>();

  playheadPosition: number = 0;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private isDragging = false;

  ngOnInit(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.setupCanvas();
    this.drawRuler();
    this.updatePlayheadPosition();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  ngOnChanges(): void {
    if (this.ctx) {
      this.drawRuler();
      this.updatePlayheadPosition();
    }
  }

  private setupCanvas(): void {
    const container = this.containerRef.nativeElement;
    const rect = container.getBoundingClientRect();
    
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    
    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  private drawRuler(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);
    
    // Set styles
    this.ctx.fillStyle = '#ccc';
    this.ctx.strokeStyle = '#666';
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'center';
    
    // Draw time markers
    const totalWidth = this.duration * this.scale;
    const majorInterval = this.getMajorInterval();
    const minorInterval = majorInterval / 5;
    
    // Draw minor ticks
    for (let time = 0; time <= this.duration; time += minorInterval) {
      const x = time * this.scale;
      if (x > width) break;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, height - 5);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }
    
    // Draw major ticks and labels
    for (let time = 0; time <= this.duration; time += majorInterval) {
      const x = time * this.scale;
      if (x > width) break;
      
      // Draw major tick
      this.ctx.beginPath();
      this.ctx.moveTo(x, height - 15);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
      
      // Draw time label
      const timeLabel = this.formatTime(time);
      this.ctx.fillText(timeLabel, x, height - 18);
    }
  }

  private getMajorInterval(): number {
    // Determine appropriate interval based on scale
    if (this.scale >= 50) return 1; // 1 second intervals
    if (this.scale >= 20) return 2; // 2 second intervals
    if (this.scale >= 10) return 5; // 5 second intervals
    if (this.scale >= 5) return 10; // 10 second intervals
    return 30; // 30 second intervals
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private updatePlayheadPosition(): void {
    this.playheadPosition = this.currentTime * this.scale;
  }

  onRulerClick(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const time = x / this.scale;
    
    this.currentTime = Math.max(0, Math.min(time, this.duration));
    this.updatePlayheadPosition();
    this.timeChanged.emit(this.currentTime);
  }

  onRulerMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const time = x / this.scale;
      
      this.currentTime = Math.max(0, Math.min(time, this.duration));
      this.updatePlayheadPosition();
      this.timeChanged.emit(this.currentTime);
    }
  }

  startDragging(event: MouseEvent): void {
    this.isDragging = true;
    this.seeking.emit(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      this.onRulerMouseMove(e);
    };
    
    const handleMouseUp = () => {
      this.isDragging = false;
      this.seeking.emit(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    event.preventDefault();
  }
}
