import { Component, input, output, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../core/signalr.service';
import { KeyTermService } from '../../../core/key-term.service';

@Component({
  selector: 'app-sync-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sync-indicator" [ngClass]="connectionStatus()">
      <span class="status-dot"></span>
      <span class="status-text">{{ getStatusText() }}</span>
      <span class="last-sync" *ngIf="lastSyncTime()">
        ({{ getLastSyncText() }})
      </span>
    </div>
  `,
  styles: `
    .sync-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.3s;

      &.connected {
        background-color: #e8f5e9;
        color: #2e7d32;

        .status-dot {
          background-color: #4caf50;
          box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
        }
      }

      &.disconnected {
        background-color: #fff3e0;
        color: #f57c00;

        .status-dot {
          background-color: #ff9800;
          animation: pulse 1.5s infinite;
        }
      }

      &.error {
        background-color: #ffebee;
        color: #c62828;

        .status-dot {
          background-color: #f44336;
          animation: pulse-fast 0.6s infinite;
        }
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }

      .last-sync {
        opacity: 0.7;
        font-size: 11px;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      @keyframes pulse-fast {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.3;
        }
      }
    }
  `
})
export class SyncIndicatorComponent implements OnInit {
  signalRService = input.required<SignalRService>();

  connectionStatus = signal<'connected' | 'disconnected' | 'error'>('disconnected');
  lastSyncTime = signal<Date | null>(null);

  ngOnInit(): void {
    effect(() => {
      const status = this.signalRService().connectionState();
      this.connectionStatus.set(status);

      if (status === 'connected') {
        this.lastSyncTime.set(new Date());
      }
    });
  }

  getStatusText(): string {
    switch (this.connectionStatus()) {
      case 'connected':
        return 'Synced';
      case 'disconnected':
        return 'Reconnecting...';
      case 'error':
        return 'Sync Error';
      default:
        return 'Unknown';
    }
  }

  getLastSyncText(): string {
    const lastSync = this.lastSyncTime();
    if (!lastSync) return '';

    const now = new Date();
    const diff = now.getTime() - lastSync.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else {
      return 'just now';
    }
  }
}
