import { Component, OnInit, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CharacterSheetService } from '../../core/character-sheet.service';
import { SignalRService } from '../../core/signalr.service';
import { KeyTermService } from '../../core/key-term.service';
import { NotificationService } from '../../core/notification.service';
import { AuthService } from '../../core/auth.service';
import { ConflictWarningComponent } from '../../shared/components/conflict-warning/conflict-warning.component';
import { SyncIndicatorComponent } from '../../shared/components/sync-indicator/sync-indicator.component';
import { PopOutWindowComponent } from '../../shared/components/pop-out-window/pop-out-window.component';
import { RenderHyperlinksPipe } from '../../shared/pipes/render-hyperlinks.pipe';
import { CharacterSheet, Field, Section } from '../../shared/models/character-sheet.model';

@Component({
  selector: 'app-character-sheet',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ConflictWarningComponent,
    SyncIndicatorComponent,
    PopOutWindowComponent,
    RenderHyperlinksPipe
  ],
  template: `
    <div class="character-sheet-container">
      <header class="sheet-header">
        <div class="header-left">
          <h1>{{ sheet()?.characterName || 'Character Sheet' }}</h1>
          <p class="character-info">
            {{ sheet()?.characterClass }} - Level {{ sheet()?.level }}
          </p>
        </div>

        <div class="header-right">
          <app-sync-indicator [signalRService]="signalRService"></app-sync-indicator>
          <button class="btn btn-secondary" (click)="goBack()">Back</button>
        </div>
      </header>

      <div class="sheet-content">
        <div *ngIf="isLoading()" class="loading">
          <p>Loading character sheet...</p>
        </div>

        <div *ngIf="!isLoading() && sheet()" class="sections">
          <div *ngFor="let section of sheet()!.sections" class="section">
            <h2>{{ section.title }}</h2>

            <div class="fields-grid">
              <div *ngFor="let field of section.fields" class="field-wrapper">
                <label [for]="field.id">{{ field.label }}</label>

                <input
                  *ngIf="field.type === 'text'"
                  [id]="field.id"
                  type="text"
                  class="form-control"
                  [value]="field.value"
                  (blur)="saveField(field.id, $event)"
                  [disabled]="!authService.isDungeonMaster && field.isLocked"
                  [class.locked]="field.isLocked && !authService.isDungeonMaster"
                />

                <textarea
                  *ngIf="field.type === 'textarea'"
                  [id]="field.id"
                  class="form-control"
                  (blur)="saveField(field.id, $event)"
                  [disabled]="!authService.isDungeonMaster && field.isLocked"
                  [class.locked]="field.isLocked && !authService.isDungeonMaster"
                  >{{ field.value }}</textarea
                >

                <input
                  *ngIf="field.type === 'number'"
                  [id]="field.id"
                  type="number"
                  class="form-control"
                  [value]="field.value"
                  (blur)="saveField(field.id, $event)"
                  [disabled]="!authService.isDungeonMaster && field.isLocked"
                />

                <select
                  *ngIf="field.type === 'dropdown'"
                  [id]="field.id"
                  class="form-control"
                  [value]="field.value"
                  (change)="saveField(field.id, $event)"
                  [disabled]="!authService.isDungeonMaster && field.isLocked"
                >
                  <option *ngFor="let option of field.options" [value]="option">
                    {{ option }}
                  </option>
                </select>

                <div *ngIf="field.type === 'checkbox-array'" class="checkbox-group">
                  <label *ngFor="let option of field.options" class="checkbox-item">
                    <input
                      type="checkbox"
                      [checked]="Array.isArray(field.value) && field.value.includes(option)"
                      (change)="toggleCheckbox(field.id, option, $event)"
                      [disabled]="!authService.isDungeonMaster && field.isLocked"
                    />
                    {{ option }}
                  </label>
                </div>

                <small *ngIf="field.lastEditedBy" class="field-meta">
                  Last edited by {{ field.lastEditedBy }}
                </small>
              </div>
            </div>
          </div>
        </div>

        <app-conflict-warning
          [conflict]="sheetService.conflictDetected()"
          (proceedWithLocal)="sheetService.resolveConflict(true)"
          (acceptIncoming)="sheetService.resolveConflict(false)"
        ></app-conflict-warning>
      </div>
    </div>
  `,
  styles: `
    .character-sheet-container {
      min-height: 100vh;
      background-color: #f5f5f5;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .sheet-header {
      background: white;
      padding: 20px;
      border-bottom: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      .header-left h1 {
        margin: 0;
        font-size: 28px;
        color: #333;
      }

      .character-info {
        margin: 4px 0 0 0;
        color: #666;
        font-size: 14px;
      }

      .header-right {
        display: flex;
        gap: 12px;
        align-items: center;
      }
    }

    .sheet-content {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;

      .loading {
        text-align: center;
        padding: 40px;
        color: #666;
      }

      .sections {
        .section {
          background: white;
          padding: 20px;
          border-radius: 6px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

          h2 {
            margin-top: 0;
            margin-bottom: 16px;
            font-size: 18px;
            color: #333;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 8px;
          }

          .fields-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 16px;

            .field-wrapper {
              display: flex;
              flex-direction: column;

              label {
                font-weight: 600;
                margin-bottom: 6px;
                color: #333;
                font-size: 13px;
              }

              .form-control {
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 13px;
                transition: border-color 0.2s;

                &:focus {
                  outline: none;
                  border-color: #667eea;
                  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }

                &.locked {
                  background-color: #f9f9f9;
                  color: #999;
                  cursor: not-allowed;
                }
              }

              textarea {
                resize: vertical;
                min-height: 60px;
              }

              .checkbox-group {
                display: flex;
                flex-direction: column;
                gap: 8px;

                .checkbox-item {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  cursor: pointer;
                  font-size: 13px;

                  input[type='checkbox'] {
                    cursor: pointer;
                  }
                }
              }

              .field-meta {
                margin-top: 4px;
                font-size: 11px;
                color: #999;
              }
            }
          }
        }
      }
    }

    .btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &.btn-secondary {
        background-color: #f5f5f5;
        color: #333;

        &:hover {
          background-color: #e9e9e9;
        }
      }
    }
  `
})
export class CharacterSheetComponent implements OnInit {
  Array = Array;
  sheet = signal<CharacterSheet | null>(null);
  isLoading = signal(false);

  constructor(
    public sheetService: CharacterSheetService,
    public signalRService: SignalRService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private keyTermService: KeyTermService
  ) {
    // Sync sheet signal with service
    effect(() => {
      this.sheet.set(this.sheetService.currentSheet());
      this.isLoading.set(this.sheetService.isLoading());
    });
  }

  ngOnInit(): void {
    const sheetId = this.route.snapshot.paramMap.get('id');
    if (sheetId) {
      this.sheetService.loadSheet(sheetId).subscribe({
        error: (err: any) => {
          this.notificationService.error('Failed to load character sheet');
          console.error(err);
        }
      });

      // Connect SignalR when component loads
      this.signalRService.connect().catch((err: any) => {
        this.notificationService.warning('Could not establish real-time connection');
      });
    }
  }

  saveField(fieldId: string, event: Event): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const newValue = input.value;

    // Find the field in the sheet to get its path
    const sheet = this.sheet();
    if (!sheet) return;

    const fieldPath = this.findFieldPath(sheet, fieldId);
    if (fieldPath) {
      this.sheetService.saveField(fieldPath, newValue).catch((err: any) => {
        this.notificationService.error('Failed to save field');
        console.error(err);
      });
    }
  }

  toggleCheckbox(fieldId: string, option: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const sheet = this.sheet();
    if (!sheet) return;

    const field = this.findField(sheet, fieldId);
    if (field && Array.isArray(field.value)) {
      const newValue = input.checked
        ? [...field.value, option]
        : field.value.filter((v: string) => v !== option);

      const fieldPath = this.findFieldPath(sheet, fieldId);
      if (fieldPath) {
        this.sheetService.saveField(fieldPath, newValue).catch((err: any) => {
          this.notificationService.error('Failed to save field');
        });
      }
    }
  }

  private findField(sheet: CharacterSheet, fieldId: string): Field | undefined {
    for (const section of sheet.sections) {
      const field = section.fields.find((f: Field) => f.id === fieldId);
      if (field) return field;
    }
    return undefined;
  }

  private findFieldPath(sheet: CharacterSheet, fieldId: string): string | null {
    for (let i = 0; i < sheet.sections.length; i++) {
      const sectionFields = sheet.sections[i].fields;
      for (let j = 0; j < sectionFields.length; j++) {
        if (sectionFields[j].id === fieldId) {
          return `sections[${i}].fields[${j}].value`;
        }
      }
    }
    return null;
  }

  goBack(): void {
    window.history.back();
  }
}
