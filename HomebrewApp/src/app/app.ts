import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from './core/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  template: `
    <router-outlet></router-outlet>

    <div class="notification-container">
      <div
        *ngFor="let notification of notificationService.notifications()"
        class="notification"
        [ngClass]="'notification-' + notification.type"
      >
        {{ notification.message }}
      </div>
    </div>
  `,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  constructor(public notificationService: NotificationService) {}

  ngOnInit(): void {}
}

