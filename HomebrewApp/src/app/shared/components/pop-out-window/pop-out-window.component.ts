import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pop-out-window',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="pop-out-window"
      [style.width]="width()"
      [style.height]="height()"
      [style.top]="top()"
      [style.left]="left()"
      (mousedown)="startDrag($event)"
    >
      <div class="title-bar">
        <h3>{{ title() }}</h3>
        <button class="close-btn" (click)="close.emit()">×</button>
      </div>

      <div class="content" (mousedown)="$event.stopPropagation()" #content>
        <ng-content></ng-content>
      </div>

      <div class="resize-handle" (mousedown)="startResize($event)"></div>
    </div>
  `,
  styles: `
    .pop-out-window {
      position: fixed;
      background: white;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      z-index: 500;
      user-select: none;

      .title-bar {
        padding: 12px 16px;
        background: linear-gradient(to bottom, #f9f9f9, #f0f0f0);
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
        flex-shrink: 0;

        h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;

          &:hover {
            color: #333;
          }
        }
      }

      .content {
        flex: 1;
        overflow: auto;
        padding: 12px;
        font-size: 13px;
      }

      .resize-handle {
        width: 16px;
        height: 16px;
        position: absolute;
        bottom: 0;
        right: 0;
        background: linear-gradient(
          135deg,
          transparent 50%,
          #ccc 50%,
          #ccc 75%,
          #999 75%
        );
        cursor: se-resize;
        border-radius: 0 0 6px 0;
      }
    }
  `
})
export class PopOutWindowComponent {
  title = input<string>('Pop-Out');
  close = output<void>();

  width = signal('400px');
  height = signal('300px');
  top = signal('100px');
  left = signal('100px');

  private dragStartX = 0;
  private dragStartY = 0;
  private startTop = 0;
  private startLeft = 0;

  private resizeStartX = 0;
  private resizeStartY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private isResizing = false;

  startDrag(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('close-btn')) {
      return;
    }

    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.startTop = this.parsePixels(this.top());
    this.startLeft = this.parsePixels(this.left());

    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
  }

  startResize(event: MouseEvent): void {
    event.stopPropagation();
    this.isResizing = true;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;
    this.startWidth = this.parsePixels(this.width());
    this.startHeight = this.parsePixels(this.height());

    document.addEventListener('mousemove', this.onResizeMove.bind(this));
    document.addEventListener('mouseup', this.onResizeEnd.bind(this));
  }

  private onDragMove(event: MouseEvent): void {
    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;

    this.top.set(this.startTop + deltaY + 'px');
    this.left.set(this.startLeft + deltaX + 'px');
  }

  private onDragEnd(): void {
    document.removeEventListener('mousemove', this.onDragMove.bind(this));
    document.removeEventListener('mouseup', this.onDragEnd.bind(this));
  }

  private onResizeMove(event: MouseEvent): void {
    const deltaX = event.clientX - this.resizeStartX;
    const deltaY = event.clientY - this.resizeStartY;

    const newWidth = Math.max(200, this.startWidth + deltaX);
    const newHeight = Math.max(150, this.startHeight + deltaY);

    this.width.set(newWidth + 'px');
    this.height.set(newHeight + 'px');
  }

  private onResizeEnd(): void {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.onResizeMove.bind(this));
    document.removeEventListener('mouseup', this.onResizeEnd.bind(this));
  }

  private parsePixels(value: string): number {
    return parseInt(value.replace('px', ''), 10);
  }
}
