import { Injectable, signal, effect } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { SheetUpdate, ConflictInfo } from '../shared/models/character-sheet.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private connection: HubConnection | null = null;
  private readonly hubUrl = '/characterSheetHub';

  connectionState = signal<'connected' | 'disconnected' | 'error'>('disconnected');
  lastUpdate = signal<SheetUpdate | null>(null);
  conflictDetected = signal<ConflictInfo | null>(null);
  connectionError = signal<string | null>(null);

  private activeSubscriptions = new Set<string>();

  constructor() {}

  connect(): Promise<void> {
    if (this.connection) {
      return Promise.resolve();
    }

    this.connection = new HubConnectionBuilder()
      .withUrl(this.hubUrl)
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .build();

    this.setupEventHandlers();

    return this.connection
      .start()
      .then(() => {
        this.connectionState.set('connected');
        this.connectionError.set(null);
      })
      .catch((err) => {
        this.connectionState.set('error');
        this.connectionError.set(err.message);
        console.error('SignalR connection error:', err);
      });
  }

  disconnect(): Promise<void> {
    if (!this.connection) {
      return Promise.resolve();
    }

    return this.connection
      .stop()
      .then(() => {
        this.connectionState.set('disconnected');
        this.connection = null;
        this.activeSubscriptions.clear();
      })
      .catch((err) => {
        console.error('SignalR disconnect error:', err);
      });
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    this.connection.onreconnecting(() => {
      this.connectionState.set('disconnected');
    });

    this.connection.onreconnected(() => {
      this.connectionState.set('connected');
      this.connectionError.set(null);
    });

    this.connection.onclose(() => {
      this.connectionState.set('disconnected');
    });

    // Handle sheet updates from server
    this.connection.on('characterSheetUpdated', (update: SheetUpdate) => {
      this.lastUpdate.set(update);
    });

    // Handle conflict detection from server
    this.connection.on('editConflict', (conflict: ConflictInfo) => {
      this.conflictDetected.set(conflict);
    });
  }

  subscribeToSheet(sheetId: string): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      return Promise.reject('SignalR not connected');
    }

    if (this.activeSubscriptions.has(sheetId)) {
      return Promise.resolve();
    }

    this.activeSubscriptions.add(sheetId);
    return this.connection.invoke('SubscribeToSheet', sheetId).catch((err) => {
      console.error(`Failed to subscribe to sheet ${sheetId}:`, err);
      this.activeSubscriptions.delete(sheetId);
    });
  }

  unsubscribeFromSheet(sheetId: string): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      return Promise.reject('SignalR not connected');
    }

    this.activeSubscriptions.delete(sheetId);
    return this.connection.invoke('UnsubscribeFromSheet', sheetId).catch((err) => {
      console.error(`Failed to unsubscribe from sheet ${sheetId}:`, err);
    });
  }

  updateField(
    sheetId: string,
    fieldPath: string,
    value: any,
    version: number
  ): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      return Promise.reject('SignalR not connected');
    }

    return this.connection.invoke('UpdateCharacterField', sheetId, fieldPath, value, version).catch((err) => {
      console.error('Failed to update field:', err);
      throw err;
    });
  }

  isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }
}
