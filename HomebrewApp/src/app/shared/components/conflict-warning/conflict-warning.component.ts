import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConflictInfo } from '../../models/character-sheet.model';

@Component({
  selector: 'app-conflict-warning',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="conflict-warning-overlay" *ngIf="conflict()">
      <div class="conflict-warning-modal">
        <h2>Edit Conflict Detected</h2>
        <p class="conflict-message">
          <strong>{{ conflict()?.incomingUser }}</strong> has modified the
          <strong>"{{ conflict()?.field }}"</strong> field while you were editing it.
        </p>

        <div class="values-comparison">
          <div class="value-section">
            <label>Their Change:</label>
            <div class="value-box incoming">{{ formatValue(conflict()?.incomingValue) }}</div>
          </div>

          <div class="value-section">
            <label>Your Change:</label>
            <div class="value-box local">{{ formatValue(conflict()?.localValue) }}</div>
          </div>
        </div>

        <p class="instruction">What would you like to do?</p>

        <div class="action-buttons">
          <button class="btn btn-secondary" (click)="acceptIncoming.emit()">
            Accept Their Change
          </button>
          <button class="btn btn-primary" (click)="proceedWithLocal.emit()">
            Keep Your Change (Overwrite)
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .conflict-warning-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .conflict-warning-modal {
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 500px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }

    h2 {
      margin-top: 0;
      color: #d9534f;
      font-size: 20px;
    }

    .conflict-message {
      font-size: 14px;
      color: #333;
      margin-bottom: 16px;
      line-height: 1.5;
    }

    .values-comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .value-section {
      label {
        display: block;
        font-weight: 600;
        font-size: 12px;
        color: #666;
        margin-bottom: 8px;
        text-transform: uppercase;
      }

      .value-box {
        padding: 12px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        word-break: break-all;
        max-height: 120px;
        overflow-y: auto;

        &.incoming {
          background-color: #f0f3ff;
          border-left: 3px solid #0066cc;
          color: #0066cc;
        }

        &.local {
          background-color: #fff0f0;
          border-left: 3px solid #d9534f;
          color: #d9534f;
        }
      }
    }

    .instruction {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      justify-content: flex-end;

      .btn {
        padding: 10px 16px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &.btn-secondary {
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;

          &:hover {
            background-color: #e9e9e9;
          }
        }

        &.btn-primary {
          background-color: #d9534f;
          color: white;

          &:hover {
            background-color: #c9423f;
          }
        }
      }
    }
  `
})
export class ConflictWarningComponent {
  conflict = input<ConflictInfo | null>(null);
  proceedWithLocal = output<void>();
  acceptIncoming = output<void>();

  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '(empty)';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }
}
