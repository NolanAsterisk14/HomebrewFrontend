import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../core/notification.service';
import { AuthCredentials } from '../../shared/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>D&D Character Sheet</h1>
        <p class="subtitle">Homebrew Campaign Management</p>

        <form (ngSubmit)="onLogin()" [attr.novalidate]="true">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              type="text"
              class="form-control"
              placeholder="Enter your username"
              [(ngModel)]="credentials.username"
              name="username"
              required
              [disabled]="authService.isLoading()"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              class="form-control"
              placeholder="Enter your password"
              [(ngModel)]="credentials.password"
              name="password"
              required
              [disabled]="authService.isLoading()"
            />
          </div>

          <div *ngIf="authService.error()" class="alert alert-error">
            {{ authService.error() }}
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="authService.isLoading()">
            {{ authService.isLoading() ? 'Logging in...' : 'Login' }}
          </button>
        </form>

        <div class="demo-info">
          <p><small>Demo Credentials:</small></p>
          <p><small>User: <code>user1</code> | Password: <code>password</code></small></p>
          <p><small>DM: <code>dm1</code> | Password: <code>password</code></small></p>
        </div>
      </div>
    </div>
  `,
  styles: `
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: system-ui, -apple-system, sans-serif;
    }

    .login-card {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 400px;

      h1 {
        margin: 0 0 8px 0;
        font-size: 28px;
        color: #333;
        text-align: center;
      }

      .subtitle {
        text-align: center;
        color: #666;
        font-size: 14px;
        margin-bottom: 24px;
      }

      form {
        .form-group {
          margin-bottom: 16px;

          label {
            display: block;
            margin-bottom: 6px;
            font-weight: 600;
            color: #333;
            font-size: 14px;
          }

          .form-control {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            transition: border-color 0.2s;

            &:focus {
              outline: none;
              border-color: #667eea;
              box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            &:disabled {
              background-color: #f5f5f5;
              cursor: not-allowed;
            }
          }
        }

        .alert {
          margin-bottom: 16px;
          padding: 12px;
          border-radius: 4px;
          font-size: 13px;

          &.alert-error {
            background-color: #ffebee;
            color: #c62828;
            border: 1px solid #ef5350;
          }
        }

        .btn-block {
          width: 100%;
          margin-bottom: 24px;
        }
      }

      .demo-info {
        background-color: #f5f5f5;
        padding: 12px;
        border-radius: 4px;
        font-size: 12px;
        color: #666;

        p {
          margin: 4px 0;
        }

        code {
          background-color: white;
          padding: 2px 4px;
          border-radius: 2px;
          font-family: monospace;
          color: #667eea;
        }
      }
    }

    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &.btn-primary {
        background-color: #667eea;
        color: white;

        &:hover:not(:disabled) {
          background-color: #5568d3;
        }

        &:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
      }
    }
  `
})
export class LoginComponent {
  credentials: AuthCredentials = {
    username: '',
    password: ''
  };

  constructor(
    public authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  onLogin(): void {
    if (!this.credentials.username || !this.credentials.password) {
      this.notificationService.error('Please enter both username and password');
      return;
    }

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.notificationService.success('Login successful!');
        this.router.navigate(['/sheets']);
      },
      error: (err: any) => {
        this.notificationService.error(err.error?.message || 'Login failed');
      }
    });
  }
}
