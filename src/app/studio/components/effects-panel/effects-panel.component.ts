import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import { EffectsService, Effect, EffectCategory } from '../../services/effects.service';

@Component({
  selector: 'app-effects-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="effects-panel">
      <!-- OpenShot-style Effects Header -->
      <div class="panel-header">
        <h3 class="panel-title">
          <i class="icon-magic"></i>
          Effects
        </h3>
        <div class="panel-controls">
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search effects..."
            [(ngModel)]="searchTerm"
            (input)="filterEffects()"
          />
        </div>
      </div>

      <!-- Effects Categories -->
      <div class="effects-categories">
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

      <!-- Effects List -->
      <div class="effects-list" cdkDropList [cdkDropListData]="filteredEffects">
        <div 
          class="effect-item"
          *ngFor="let effect of filteredEffects"
          cdkDrag
          [cdkDragData]="effect"
          (dblclick)="applyEffect(effect)"
        >
          <div class="effect-icon">
            <i [class]="effect.icon"></i>
          </div>
          <div class="effect-info">
            <div class="effect-name">{{ effect.name }}</div>
            <div class="effect-description">{{ effect.description }}</div>
          </div>
          <div class="effect-actions">
            <button 
              class="btn btn-sm apply-btn"
              (click)="applyEffect(effect)"
              [disabled]="!selectedClipId"
              title="Apply Effect"
            >
              <i class="icon-plus"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Applied Effects (when clip is selected) -->
      <div class="applied-effects" *ngIf="selectedClipId && appliedEffects.length > 0">
        <div class="section-header">
          <h4>Applied Effects</h4>
          <button class="btn btn-sm" (click)="clearAllEffects()" title="Clear All Effects">
            <i class="icon-trash"></i>
          </button>
        </div>
        
        <div 
          class="applied-effect"
          *ngFor="let effect of appliedEffects; let i = index"
          cdkDrag
          [cdkDragData]="effect"
          (cdkDragDropped)="reorderEffect($event)"
        >
          <div class="effect-header">
            <div class="effect-toggle">
              <input 
                type="checkbox" 
                [checked]="effect.enabled"
                (change)="toggleEffect(effect)"
              />
            </div>
            <div class="effect-name">{{ effect.name }}</div>
            <div class="effect-controls">
              <button 
                class="btn btn-xs"
                (click)="removeEffect(effect)"
                title="Remove Effect"
              >
                <i class="icon-trash"></i>
              </button>
            </div>
          </div>
          
          <!-- Effect Parameters -->
          <div class="effect-parameters" *ngIf="effect.enabled">
            <div 
              class="parameter"
              *ngFor="let param of effect.parameters"
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
                  (input)="updateParameter(effect, param, $event)"
                  class="slider"
                />
                <input 
                  type="number"
                  [min]="param.min || 0"
                  [max]="param.max || 100"
                  [step]="param.step || 1"
                  [value]="param.value"
                  (input)="updateParameter(effect, param, $event)"
                  class="number-input"
                />
              </div>
              
              <!-- Boolean Parameter -->
              <div class="parameter-control" *ngIf="param.type === 'boolean'">
                <input 
                  type="checkbox"
                  [checked]="param.value"
                  (change)="updateParameter(effect, param, $event)"
                />
              </div>
              
              <!-- Color Parameter -->
              <div class="parameter-control" *ngIf="param.type === 'color'">
                <input 
                  type="color"
                  [value]="param.value"
                  (input)="updateParameter(effect, param, $event)"
                  class="color-input"
                />
              </div>
              
              <!-- Choice Parameter -->
              <div class="parameter-control" *ngIf="param.type === 'choice'">
                <select 
                  [value]="param.value"
                  (change)="updateParameter(effect, param, $event)"
                  class="select-input"
                >
                  <option *ngFor="let choice of param.choices" [value]="choice">
                    {{ choice }}
                  </option>
                </select>
              </div>
              
              <!-- Text Parameter -->
              <div class="parameter-control" *ngIf="param.type === 'text'">
                <input 
                  type="text"
                  [value]="param.value"
                  (input)="updateParameter(effect, param, $event)"
                  class="text-input"
                />
              </div>
              
              <!-- Keyframe Button -->
              <button 
                class="keyframe-btn"
                *ngIf="param.keyframeable"
                [class.active]="hasKeyframes(effect, param)"
                (click)="addKeyframe(effect, param)"
                title="Add Keyframe"
              >
                <i class="icon-key"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Clip Selected Message -->
      <div class="no-selection" *ngIf="!selectedClipId">
        <i class="icon-info"></i>
        <p>Select a clip to apply effects</p>
      </div>
    </div>
  `,
  styleUrls: ['./effects-panel.component.scss']
})
export class EffectsPanelComponent implements OnInit, OnDestroy {
  @Input() selectedClipId: string | null = null;

  availableEffects: Effect[] = [];
  appliedEffects: Effect[] = [];
  filteredEffects: Effect[] = [];
  
  searchTerm = '';
  selectedCategory = 'all';
  
  categories = [
    { key: 'color', name: 'Color' },
    { key: 'distort', name: 'Distort' },
    { key: 'blur', name: 'Blur' },
    { key: 'stylize', name: 'Stylize' },
    { key: 'keying', name: 'Keying' },
    { key: 'composite', name: 'Composite' }
  ];

  private destroy$ = new Subject<void>();

  constructor(private effectsService: EffectsService) {}

  ngOnInit(): void {
    // Load available effects
    this.effectsService.getAvailableEffects()
      .pipe(takeUntil(this.destroy$))
      .subscribe(effects => {
        this.availableEffects = effects;
        this.filterEffects();
      });

    // Load applied effects when clip changes
    this.loadAppliedEffects();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(): void {
    this.loadAppliedEffects();
  }

  private loadAppliedEffects(): void {
    if (this.selectedClipId) {
      this.effectsService.getAppliedEffects(this.selectedClipId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(effects => {
          this.appliedEffects = effects;
        });
    } else {
      this.appliedEffects = [];
    }
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.filterEffects();
  }

  filterEffects(): void {
    let filtered = this.availableEffects;

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(effect => effect.category === this.selectedCategory);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(effect => 
        effect.name.toLowerCase().includes(term) ||
        effect.description.toLowerCase().includes(term)
      );
    }

    this.filteredEffects = filtered;
  }

  applyEffect(effect: Effect): void {
    if (!this.selectedClipId) return;
    
    this.effectsService.applyEffect(this.selectedClipId, effect.id);
  }

  removeEffect(effect: Effect): void {
    if (!this.selectedClipId) return;
    
    this.effectsService.removeEffect(this.selectedClipId, effect.id);
  }

  toggleEffect(effect: Effect): void {
    if (!this.selectedClipId) return;
    
    this.effectsService.toggleEffect(this.selectedClipId, effect.id);
  }

  updateParameter(effect: Effect, param: any, event: any): void {
    if (!this.selectedClipId) return;
    
    let value = event.target.value;
    
    // Convert value based on parameter type
    if (param.type === 'number') {
      value = parseFloat(value);
    } else if (param.type === 'boolean') {
      value = event.target.checked;
    }
    
    this.effectsService.updateEffectParameter(this.selectedClipId, effect.id, param.name, value);
  }

  reorderEffect(event: CdkDragDrop<Effect[]>): void {
    if (!this.selectedClipId) return;
    
    // Implementation for reordering effects
    console.log('Reorder effect:', event);
  }

  clearAllEffects(): void {
    if (!this.selectedClipId) return;
    
    this.appliedEffects.forEach(effect => {
      this.effectsService.removeEffect(this.selectedClipId!, effect.id);
    });
  }

  hasKeyframes(effect: Effect, param: any): boolean {
    return effect.keyframes?.some(kf => kf.property === param.name) || false;
  }

  addKeyframe(effect: Effect, param: any): void {
    // This will be implemented with the keyframes service
    console.log('Add keyframe for:', effect.name, param.name);
  }
}
