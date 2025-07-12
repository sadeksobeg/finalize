import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import { TransitionsService, Transition, TransitionCategory } from '../../services/transitions.service';

@Component({
  selector: 'app-transitions-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="transitions-panel">
      <!-- OpenShot-style Transitions Header -->
      <div class="panel-header">
        <h3 class="panel-title">
          <i class="icon-transition"></i>
          Transitions
        </h3>
        <div class="panel-controls">
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search transitions..."
            [(ngModel)]="searchTerm"
            (input)="filterTransitions()"
          />
        </div>
      </div>

      <!-- Transition Categories -->
      <div class="transitions-categories">
        <button 
          class="category-btn"
          [class.active]="selectedCategory === 'all'"
          (click)="selectCategory('all')"
        >
          All
        </button>
        <button 
          class="category-btn"
          *ngFor="let category of categories"
          [class.active]="selectedCategory === category.key"
          (click)="selectCategory(category.key)"
        >
          {{ category.name }}
        </button>
      </div>

      <!-- Transitions Grid -->
      <div class="transitions-grid" cdkDropList [cdkDropListData]="filteredTransitions">
        <div 
          class="transition-item"
          *ngFor="let transition of filteredTransitions"
          cdkDrag
          [cdkDragData]="transition"
          (dblclick)="applyTransition(transition)"
        >
          <div class="transition-preview">
            <div class="preview-placeholder">
              <i [class]="transition.icon"></i>
            </div>
            <div class="transition-duration">{{ transition.duration }}s</div>
          </div>
          <div class="transition-info">
            <div class="transition-name">{{ transition.name }}</div>
            <div class="transition-type">{{ transition.type }}</div>
          </div>
          <div class="transition-actions">
            <button 
              class="btn btn-sm apply-btn"
              (click)="applyTransition(transition)"
              [disabled]="!selectedClipId"
              title="Apply Transition"
            >
              <i class="icon-plus"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Applied Transitions (when clip is selected) -->
      <div class="applied-transitions" *ngIf="selectedClipId && appliedTransitions.length > 0">
        <div class="section-header">
          <h4>Applied Transitions</h4>
          <button class="btn btn-sm" (click)="clearAllTransitions()" title="Clear All Transitions">
            <i class="icon-trash"></i>
          </button>
        </div>
        
        <div 
          class="applied-transition"
          *ngFor="let transition of appliedTransitions"
        >
          <div class="transition-header">
            <div class="transition-toggle">
              <input 
                type="checkbox" 
                [checked]="transition.enabled"
                (change)="toggleTransition(transition)"
              />
            </div>
            <div class="transition-info">
              <div class="transition-name">{{ getTransitionName(transition.transitionId) }}</div>
              <div class="transition-position">{{ transition.position }}</div>
            </div>
            <div class="transition-controls">
              <button 
                class="btn btn-xs"
                (click)="removeTransition(transition)"
                title="Remove Transition"
              >
                <i class="icon-trash"></i>
              </button>
            </div>
          </div>
          
          <!-- Transition Parameters -->
          <div class="transition-parameters" *ngIf="transition.enabled">
            <!-- Duration Control -->
            <div class="parameter">
              <label class="parameter-label">Duration (seconds)</label>
              <div class="parameter-control">
                <input 
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  [value]="transition.duration"
                  (input)="updateTransitionDuration(transition, $event)"
                  class="slider"
                />
                <input 
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  [value]="transition.duration"
                  (input)="updateTransitionDuration(transition, $event)"
                  class="number-input"
                />
              </div>
            </div>

            <!-- Custom Parameters -->
            <div 
              class="parameter"
              *ngFor="let param of transition.parameters"
            >
              <label class="parameter-label">{{ param.description || param.name }}</label>
              
              <!-- Number Parameter -->
              <div class="parameter-control" *ngIf="param.type === 'number'">
                <input 
                  type="range"
                  [min]="param.min || 0"
                  [max]="param.max || 100"
                  [step]="param.step || 1"
                  [value]="param.value"
                  (input)="updateTransitionParameter(transition, param, $event)"
                  class="slider"
                />
                <input 
                  type="number"
                  [min]="param.min || 0"
                  [max]="param.max || 100"
                  [step]="param.step || 1"
                  [value]="param.value"
                  (input)="updateTransitionParameter(transition, param, $event)"
                  class="number-input"
                />
              </div>
              
              <!-- Boolean Parameter -->
              <div class="parameter-control" *ngIf="param.type === 'boolean'">
                <input 
                  type="checkbox"
                  [checked]="param.value"
                  (change)="updateTransitionParameter(transition, param, $event)"
                />
              </div>
              
              <!-- Choice Parameter -->
              <div class="parameter-control" *ngIf="param.type === 'choice'">
                <select 
                  [value]="param.value"
                  (change)="updateTransitionParameter(transition, param, $event)"
                  class="select-input"
                >
                  <option *ngFor="let choice of param.choices" [value]="choice">
                    {{ choice }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Clip Selected Message -->
      <div class="no-selection" *ngIf="!selectedClipId">
        <i class="icon-info"></i>
        <p>Select a clip to apply transitions</p>
      </div>
    </div>
  `,
  styleUrls: ['./transitions-panel.component.scss']
})
export class TransitionsPanelComponent implements OnInit, OnDestroy {
  @Input() selectedClipId: string | null = null;

  availableTransitions: Transition[] = [];
  appliedTransitions: any[] = [];
  filteredTransitions: Transition[] = [];
  
  searchTerm = '';
  selectedCategory = 'all';
  
  categories = [
    { key: 'basic', name: 'Basic' },
    { key: 'wipes', name: 'Wipes' },
    { key: 'slides', name: 'Slides' },
    { key: 'zooms', name: 'Zooms' },
    { key: 'rotations', name: 'Rotations' },
    { key: 'artistic', name: 'Artistic' }
  ];

  private destroy$ = new Subject<void>();

  constructor(private transitionsService: TransitionsService) {}

  ngOnInit(): void {
    // Load available transitions
    this.transitionsService.getAvailableTransitions()
      .pipe(takeUntil(this.destroy$))
      .subscribe(transitions => {
        this.availableTransitions = transitions;
        this.filterTransitions();
      });

    // Load applied transitions when clip changes
    this.loadAppliedTransitions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(): void {
    this.loadAppliedTransitions();
  }

  private loadAppliedTransitions(): void {
    if (this.selectedClipId) {
      this.transitionsService.getAppliedTransitions(this.selectedClipId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(transitions => {
          this.appliedTransitions = transitions;
        });
    } else {
      this.appliedTransitions = [];
    }
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.filterTransitions();
  }

  filterTransitions(): void {
    let filtered = this.availableTransitions;

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(transition => transition.category === this.selectedCategory);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(transition => 
        transition.name.toLowerCase().includes(term) ||
        transition.description.toLowerCase().includes(term)
      );
    }

    this.filteredTransitions = filtered;
  }

  applyTransition(transition: Transition): void {
    if (!this.selectedClipId) return;
    
    // Apply as 'in' transition by default - this could be made configurable
    this.transitionsService.applyTransition(
      this.selectedClipId, 
      transition.id, 
      'in', 
      0, // Start time - would be calculated based on clip position
      transition.duration
    );
  }

  removeTransition(appliedTransition: any): void {
    if (!this.selectedClipId) return;
    
    this.transitionsService.removeTransition(this.selectedClipId, appliedTransition.id);
  }

  toggleTransition(appliedTransition: any): void {
    if (!this.selectedClipId) return;
    
    this.transitionsService.toggleTransition(this.selectedClipId, appliedTransition.id);
  }

  updateTransitionParameter(appliedTransition: any, param: any, event: any): void {
    if (!this.selectedClipId) return;
    
    let value = event.target.value;
    
    // Convert value based on parameter type
    if (param.type === 'number') {
      value = parseFloat(value);
    } else if (param.type === 'boolean') {
      value = event.target.checked;
    }
    
    this.transitionsService.updateTransitionParameter(
      this.selectedClipId, 
      appliedTransition.id, 
      param.name, 
      value
    );
  }

  updateTransitionDuration(appliedTransition: any, event: any): void {
    if (!this.selectedClipId) return;
    
    const duration = parseFloat(event.target.value);
    this.transitionsService.updateTransitionDuration(
      this.selectedClipId, 
      appliedTransition.id, 
      duration
    );
  }

  clearAllTransitions(): void {
    if (!this.selectedClipId) return;
    
    this.appliedTransitions.forEach(transition => {
      this.transitionsService.removeTransition(this.selectedClipId!, transition.id);
    });
  }

  getTransitionName(transitionId: string): string {
    const transition = this.availableTransitions.find(t => t.id === transitionId);
    return transition ? transition.name : 'Unknown Transition';
  }
}
