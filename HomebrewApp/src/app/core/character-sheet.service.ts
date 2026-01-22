import { Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CharacterSheet, EditEvent, SheetUpdate, ConflictInfo } from '../shared/models/character-sheet.model';
import { SignalRService } from './signalr.service';

@Injectable({
  providedIn: 'root'
})
export class CharacterSheetService {
  private readonly apiUrl = '/api/sheets';

  currentSheet = signal<CharacterSheet | null>(null);
  currentSheetId = signal<string | null>(null);
  editHistory = signal<EditEvent[]>([]);
  sheets = signal<CharacterSheet[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  localChanges = signal<Map<string, any>>(new Map());
  conflictDetected = signal<ConflictInfo | null>(null);

  constructor(
    private http: HttpClient,
    private signalr: SignalRService
  ) {
    // Listen for incoming updates and handle conflicts
    effect(() => {
      const update = this.signalr.lastUpdate();
      if (update && this.currentSheetId() === update.sheetId) {
        this.handleIncomingUpdate(update);
      }
    });

    // Listen for conflict detection
    effect(() => {
      const conflict = this.signalr.conflictDetected();
      if (conflict) {
        this.conflictDetected.set(conflict);
        console.warn('Edit conflict detected:', conflict);
      }
    });
  }

  loadSheet(sheetId: string): Observable<CharacterSheet> {
    this.isLoading.set(true);
    this.error.set(null);
    this.currentSheetId.set(sheetId);

    return this.http.get<CharacterSheet>(`${this.apiUrl}/${sheetId}`).pipe(
      tap((sheet) => {
        this.currentSheet.set(sheet);
        this.isLoading.set(false);
        // Subscribe to live updates for this sheet
        this.signalr.subscribeToSheet(sheetId);
      })
    );
  }

  loadAllSheets(): Observable<CharacterSheet[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<CharacterSheet[]>(`${this.apiUrl}`).pipe(
      tap((sheets) => {
        this.sheets.set(sheets);
        this.isLoading.set(false);
      })
    );
  }

  createSheet(sheet: Partial<CharacterSheet>): Observable<CharacterSheet> {
    this.isLoading.set(true);

    return this.http.post<CharacterSheet>(`${this.apiUrl}`, sheet).pipe(
      tap((newSheet) => {
        this.sheets.update((sheets) => [...sheets, newSheet]);
        this.isLoading.set(false);
      })
    );
  }

  saveField(fieldPath: string, newValue: any): Promise<void> {
    const sheet = this.currentSheet();
    if (!sheet || !this.signalr.isConnected()) {
      return Promise.reject('No active sheet or SignalR not connected');
    }

    // Store local change
    const changes = new Map(this.localChanges());
    changes.set(fieldPath, newValue);
    this.localChanges.set(changes);

    return this.signalr.updateField(sheet.id, fieldPath, newValue, sheet.version);
  }

  deleteSheet(sheetId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${sheetId}`).pipe(
      tap(() => {
        this.sheets.update((sheets) => sheets.filter((s) => s.id !== sheetId));
      })
    );
  }

  private handleIncomingUpdate(update: SheetUpdate): void {
    const sheet = this.currentSheet();
    if (!sheet) return;

    const localValue = this.localChanges().get(update.fieldPath);

    // Check for conflict: if we have a local change and incoming version > our version
    if (localValue !== undefined && update.version > sheet.version) {
      this.conflictDetected.set({
        field: update.fieldPath,
        incomingValue: update.value,
        localValue: localValue,
        incomingUser: update.editedBy,
        incomingVersion: update.version,
        localVersion: sheet.version
      });
    } else {
      // No conflict: apply incoming update
      this.applyUpdate(update);
    }
  }

  applyUpdate(update: SheetUpdate): void {
    const sheet = this.currentSheet();
    if (!sheet) return;

    // Update sheet version
    sheet.version = update.version;
    sheet.lastEditedBy = update.editedBy;
    sheet.updatedAt = new Date(update.editedAt);

    // Update the specific field in the sheet
    this.setNestedProperty(sheet, update.fieldPath, update.value);

    // Clear local change if it matches
    if (this.localChanges().has(update.fieldPath)) {
      const changes = new Map(this.localChanges());
      changes.delete(update.fieldPath);
      this.localChanges.set(changes);
    }

    this.currentSheet.set({ ...sheet });
  }

  resolveConflict(proceedWithLocal: boolean): void {
    const conflict = this.conflictDetected();
    if (!conflict) return;

    if (proceedWithLocal) {
      // Save the local value (last write wins)
      this.saveField(conflict.field, conflict.localValue)
        .then(() => {
          this.conflictDetected.set(null);
        })
        .catch((err) => {
          this.error.set('Failed to save local changes: ' + err.message);
        });
    } else {
      // Accept the incoming value
      this.applyUpdate({
        sheetId: this.currentSheetId()!,
        fieldPath: conflict.field,
        value: conflict.incomingValue,
        editedBy: conflict.incomingUser,
        editedAt: new Date(),
        version: conflict.incomingVersion
      });
      this.conflictDetected.set(null);
    }
  }

  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  unsubscribeFromSheet(): void {
    const sheetId = this.currentSheetId();
    if (sheetId) {
      this.signalr.unsubscribeFromSheet(sheetId);
      this.currentSheetId.set(null);
    }
  }
}
