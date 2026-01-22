import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CharacterSheetService } from '../../core/character-sheet.service';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../core/notification.service';
import { CharacterSheet } from '../../shared/models/character-sheet.model';

@Component({
  selector: 'app-sheet-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sheet-list-container">
      <header class="list-header">
        <h1>{{ authService.isDungeonMaster ? 'All Character Sheets' : 'My Character Sheets' }}</h1>
        <div class="header-actions">
          <button class="btn btn-primary" *ngIf="authService.isDungeonMaster" (click)="onCreate()">
            Create New Sheet
          </button>
          <button class="btn btn-secondary" (click)="onLogout()">Logout</button>
        </div>
      </header>

      <div class="list-content">
        <div *ngIf="isLoading()" class="loading">
          <p>Loading character sheets...</p>
        </div>

        <div *ngIf="!isLoading() && sheets().length === 0" class="empty-state">
          <p>No character sheets found.</p>
          <button class="btn btn-primary" *ngIf="authService.isDungeonMaster" (click)="onCreate()">
            Create the first one
          </button>
        </div>

        <div *ngIf="!isLoading() && sheets().length > 0" class="sheets-grid">
          <div *ngFor="let sheet of sheets()" class="sheet-card" (click)="selectSheet(sheet.id)">
            <div class="card-header">
              <h3>{{ sheet.characterName }}</h3>
              <span class="class-badge">{{ sheet.characterClass }}</span>
            </div>
            <div class="card-body">
              <p><strong>Level:</strong> {{ sheet.level }}</p>
              <p><strong>User:</strong> {{ sheet.userId }}</p>
              <p><strong>Last Updated:</strong> {{ formatDate(sheet.updatedAt) }}</p>
            </div>
            <div class="card-footer">
              <button class="btn btn-primary btn-sm" (click)="selectSheet(sheet.id); $event.stopPropagation()">
                Open
              </button>
              <button
                class="btn btn-danger btn-sm"
                *ngIf="authService.isDungeonMaster"
                (click)="deleteSheet(sheet.id); $event.stopPropagation()"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .sheet-list-container {
      min-height: 100vh;
      background-color: #f5f5f5;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .list-header {
      background: white;
      padding: 20px;
      border-bottom: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      h1 {
        margin: 0;
        font-size: 28px;
        color: #333;
      }

      .header-actions {
        display: flex;
        gap: 12px;
      }
    }

    .list-content {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;

      .loading,
      .empty-state {
        text-align: center;
        padding: 40px;
        background: white;
        border-radius: 6px;
        color: #666;
      }

      .sheets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;

        .sheet-card {
          background: white;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateY(-2px);
          }

          .card-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;

            h3 {
              margin: 0;
              font-size: 18px;
            }

            .class-badge {
              background-color: rgba(255, 255, 255, 0.3);
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
            }
          }

          .card-body {
            padding: 16px;

            p {
              margin: 8px 0;
              font-size: 13px;
              color: #666;

              strong {
                color: #333;
              }
            }
          }

          .card-footer {
            padding: 12px 16px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 8px;

            .btn {
              flex: 1;
            }
          }
        }
      }
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &.btn-primary {
        background-color: #667eea;
        color: white;

        &:hover {
          background-color: #5568d3;
        }
      }

      &.btn-secondary {
        background-color: #f5f5f5;
        color: #333;
        border: 1px solid #ddd;

        &:hover {
          background-color: #e9e9e9;
        }
      }

      &.btn-danger {
        background-color: #f44336;
        color: white;

        &:hover {
          background-color: #d32f2f;
        }
      }

      &.btn-sm {
        padding: 6px 12px;
        font-size: 12px;
      }
    }
  `
})
export class SheetListComponent implements OnInit {
  sheets = signal<CharacterSheet[]>([]);
  isLoading = signal(false);

  constructor(
    public sheetService: CharacterSheetService,
    public authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    effect(() => {
      this.sheets.set(this.sheetService.sheets());
      this.isLoading.set(this.sheetService.isLoading());
    });
  }

  ngOnInit(): void {
    this.sheetService.loadAllSheets().subscribe({
      error: (err: any) => {
        this.notificationService.error('Failed to load character sheets');
        console.error(err);
      }
    });
  }

  selectSheet(sheetId: string): void {
    this.router.navigate(['/sheets', sheetId]);
  }

  onCreate(): void {
    // TODO: Implement sheet creation flow
    this.notificationService.info('Sheet creation coming soon');
  }

  deleteSheet(sheetId: string): void {
    if (confirm('Are you sure you want to delete this character sheet?')) {
      this.sheetService.deleteSheet(sheetId).subscribe({
        next: () => {
          this.notificationService.success('Sheet deleted successfully');
        },
        error: (err: any) => {
          this.notificationService.error('Failed to delete sheet');
        }
      });
    }
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
