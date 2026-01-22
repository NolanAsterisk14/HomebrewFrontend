# Copilot Instructions for D&D HomebrewApp

## Project Overview

**HomebrewApp** is a real-time collaborative character sheet editor for D&D homebrew campaigns. Built with Angular 20, it enables:
- **Users** to view and edit their assigned character sheets
- **Dungeon Masters** to manage all character sheets, view live changes, and push updates to players
- **Real-time synchronization** via SignalR with conflict detection for simultaneous edits
- **Rich character data** with hyperlinked key terms, resizable pop-out windows, and dynamically added elements

Architecture uses standalone components, signals for reactive state, and zoneless change detection. The app always assumes online connectivity.

## Architecture & Key Decisions

### Core Framework Patterns
- **Standalone Components**: All components use Angular's standalone API. Never import `CommonModule` or `NgModule`-style components.
- **Signals**: State management uses Angular signals for reactive, fine-grained change detection.
- **Zoneless Change Detection**: The app runs with `provideZonelessChangeDetection()`. Avoid NgZone-dependent patterns; signals handle reactivity automatically.
- **Standalone Routing**: Routes are defined in `src/app/app.routes.ts` and configured with `provideRouter()` in `app.config.ts`.
- **Bootstrap Pattern**: App bootstraps in `src/main.ts` via `bootstrapApplication()` with `appConfig` providers.

### Real-Time Collaboration & Synchronization
- **SignalR for Real-Time Sync**: All character sheet changes are synchronized via SignalR. The backend broadcasts updates to all connected users viewing the same sheet.
  - Initialize SignalR connection in app config or a root service
  - Subscribe to `characterSheetUpdated` hub messages to receive DM changes
  - Emit `updateCharacterSheet` when users save changes
  - Always verify server-side authorization before accepting updates
- **Conflict Detection**: When a user edits a field that was simultaneously modified by the DM, detect the conflict via version timestamps or change tags.
  - Show a conflict warning modal with the incoming change and current value
  - User can choose to overwrite with their edit or discard and accept the DM's change
  - Implement "last write wins" if user confirms proceeding despite conflict

### Role-Based Access & Authentication
- **Two Roles**: `User` (can view/edit own sheet) and `DungeonMaster` (can view/edit all sheets)
- **Authentication**: Likely JWT tokens from .NET Core backend; store in localStorage or session storage
- **Authorization Checks**: All API calls and SignalR hub methods must verify user role on the backend; client-side checks are UI-only
- **DM-Only Features**: Only render edit buttons, admin panels, and "broadcast to all users" options if `role === 'DungeonMaster'`

### Character Sheet Structure
- **Fixed Base Layout**: Core sections (abilities, skills, traits, etc.) are predefined
- **Dynamic Elements**: Classes can add custom fields (e.g., Barbarian adds "Rage Meter", Warlock adds "Pact Info")
- **Field Types**: Support text input, textarea, numeric fields, dropdowns, and checkbox arrays
- **Rich Text Support**: Textareas parse key terms as clickable hyperlinks; clicking opens a modal with extended definitions

### UI Patterns for Collaboration
- **Pop-Out Windows**: Resizable, draggable floating panels for detailed views (e.g., spell list, inventory). No state persistence needed; simple DOM positioning.
- **Live Indicators**: Show which fields have recent changes, who last edited, and sync status (connected/disconnected)
- **Notifications**: Toast/snackbar alerts for incoming edits, conflict warnings, and sync status changes

## Directory Structure & Feature Organization

```
src/
  app/
    app.ts                      # Root component (App), bootstraps routing & SignalR
    app.routes.ts               # Route definitions (auth, character-sheet, admin, etc.)
    app.config.ts               # Application config, SignalR provider, auth guards
    app.html                    # Root template with router-outlet
    app.scss                    # Global app styles
    app.spec.ts                 # Root component tests
    
    core/                       # Singleton services (auth, signalr, http)
      auth.service.ts           # JWT auth, login, role checks
      signalr.service.ts        # SignalR client initialization, connection state, hub subscriptions
      character-sheet.service.ts # Character sheet API calls & cached data
      notification.service.ts   # Toast/snackbar notifications
      
    shared/                     # Reusable components & utilities
      components/
        conflict-warning/       # Modal for edit conflicts
        hyperlink-renderer/     # Text parser for clickable key terms
        pop-out-window/         # Resizable draggable container
        sync-indicator/         # Connection & sync status display
      models/
        character-sheet.model.ts  # CharacterSheet, Field, DynamicElement interfaces
        api-response.model.ts     # API response types (for type safety)
      pipes/
        truncate.pipe.ts        # Text truncation, link formatting, etc.
        
    features/                   # Feature-based modules (each route has its own folder)
      character-sheet/          # Main character sheet editor (User & DM view)
        character-sheet.component.ts
        character-sheet.component.html
        character-sheet.component.scss
        section-editor/         # Editable sections (abilities, skills, traits)
          section-editor.component.ts
          field-editor.component.ts  # Individual field editor
      admin/                    # DM-only admin panel
        sheet-list.component.ts # List of all character sheets
        sheet-manager.component.ts # Edit/manage permissions
      auth/                     # Login/logout
        login.component.ts
        
  main.ts                       # Bootstrap entry point
  styles.scss                   # Global styles
```

## Development Workflows

**Start dev server:**
```bash
npm start
# Runs `ng serve`, serves on http://localhost:4200/
```

**Build for production:**
```bash
npm run build
# Output in dist/ directory with budgets: initial 500kB warn / 1MB error
```

**Run unit tests:**
```bash
npm test
# Uses Karma + Jasmine with Chrome launcher
```

**Watch mode (development):**
```bash
npm run watch
# Incremental builds with `--watch --configuration development`
```

## Styling & Format Conventions

- **CSS Preprocessor**: SCSS (configured in `angular.json` with `"inlineStyleLanguage": "scss"`)
- **Component Styles**: Use `styleUrl` in `@Component` decorator (e.g., `app.scss`)
- **Code Format**: Prettier configured with 100-character line width, single quotes, Angular HTML parser
- **TypeScript Config**: Strict mode enabled with `noImplicitAny`, `noImplicitReturns`, `strictTemplates`

## Service Architecture & Real-Time Data Flow

### SignalR Service Pattern
```typescript
// signalr.service.ts - Manages connection, subscriptions, and message sending
export class SignalRService {
  private connection: HubConnection;
  connectionState = signal<'connected' | 'disconnected' | 'error'>('disconnected');
  
  constructor(private http: HttpClient) {
    this.connection = new HubConnectionBuilder()
      .withUrl('/characterSheetHub')
      .withAutomaticReconnect()
      .build();
    
    // Subscribe to incoming updates from DM
    this.connection.on('characterSheetUpdated', (update: SheetUpdate) => {
      // Emit to component, which handles conflict detection
      this.handleSheetUpdate(update);
    });
  }
  
  // Methods to emit changes back to server
  updateField(sheetId: string, fieldPath: string, value: any, version: number) {
    this.connection.invoke('UpdateCharacterField', sheetId, fieldPath, value, version);
  }
}
```

### Character Sheet Service Pattern
```typescript
// character-sheet.service.ts - API communication + local state management
export class CharacterSheetService {
  currentSheet = signal<CharacterSheet | null>(null);
  editHistory = signal<EditEvent[]>([]);
  
  constructor(private http: HttpClient, private signalr: SignalRService) {}
  
  // Load sheet from API and subscribe to live updates
  loadSheet(sheetId: string) {
    this.http.get<CharacterSheet>(`/api/sheets/${sheetId}`).subscribe(sheet => {
      this.currentSheet.set(sheet);
      this.signalr.subscribeToSheet(sheetId);  // Start listening for updates
    });
  }
  
  // Save changes; if conflict detected, emit conflict event
  saveField(fieldPath: string, newValue: any) {
    const sheet = this.currentSheet();
    const version = sheet.version;
    this.signalr.updateField(sheet.id, fieldPath, newValue, version);
  }
}
```

### Conflict Detection Pattern
```typescript
// In component that handles updates
@Component({...})
export class CharacterSheetComponent {
  conflictDetected = signal<ConflictInfo | null>(null);
  
  constructor(private sheetService: CharacterSheetService) {
    // Listen for incoming updates from DM
    effect(() => {
      const update = this.sheetService.incomingUpdate();
      if (update && this.hasLocalEdit(update.fieldPath)) {
        // Conflict: both user and DM edited same field
        this.conflictDetected.set({
          field: update.fieldPath,
          incomingValue: update.value,
          localValue: this.getLocalValue(update.fieldPath),
          incomingUser: update.editedBy
        });
      } else {
        // No conflict: apply DM's change
        this.applyUpdate(update);
      }
    });
  }
  
  // User chooses to keep their edit despite conflict
  proceedWithLocalEdit() {
    this.sheetService.saveField(...);
    this.conflictDetected.set(null);
  }
  
  // User accepts DM's change and discards their edit
  acceptIncomingChange() {
    this.applyUpdate(this.conflictDetected().incomingChange);
    this.conflictDetected.set(null);
  }
}
```

## Component Patterns for Key Features

### 1. Hyperlinked Rich Text (Key Terms)
```typescript
// hyperlink-renderer.pipe.ts - Transforms text with clickable terms
@Pipe({ name: 'renderHyperlinks', standalone: true })
export class RenderHyperlinksPipe implements PipeTransform {
  transform(text: string, terms: KeyTerm[]): SafeHtml {
    let result = text;
    terms.forEach(term => {
      const regex = new RegExp(`\\b${term.name}\\b`, 'gi');
      result = result.replace(regex, `<a class="key-term" (click)="openTermModal('${term.id}')">${term.name}</a>`);
    });
    return this.sanitizer.bypassSecurityTrustHtml(result);
  }
}

// In template:
<p [innerHTML]="characterSheet.notes | renderHyperlinks: keyTerms"></p>
```

### 2. Standalone Component with Feature Imports
```typescript
@Component({
  selector: 'app-character-sheet',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RenderHyperlinksPipe,
    ConflictWarningComponent,
    PopOutWindowComponent
  ],
  templateUrl: './character-sheet.component.html',
  styleUrl: './character-sheet.component.scss'
})
export class CharacterSheetComponent {
  sheet = signal<CharacterSheet | null>(null);
  isEditing = signal<string | null>(null);  // Track which field is being edited
  
  constructor(private sheetService: CharacterSheetService) {
    effect(() => {
      this.sheet.set(this.sheetService.currentSheet());
    });
  }
}
```

### 3. Resizable Pop-Out Window
```typescript
@Component({
  selector: 'app-pop-out-window',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pop-out" [style.width]="width()" [style.height]="height()"
         [style.top]="top()" [style.left]="left()"
         (mousedown)="startDrag($event)">
      <div class="title-bar">
        <h3>{{ title() }}</h3>
        <button (click)="close()">×</button>
      </div>
      <div class="content" (mousedown)="$event.stopPropagation()">
        <ng-content></ng-content>
      </div>
      <div class="resize-handle" (mousedown)="startResize($event)"></div>
    </div>
  `,
  styleUrl: './pop-out-window.component.scss'
})
export class PopOutWindowComponent {
  title = input<string>('');
  width = signal('400px');
  height = signal('300px');
  top = signal('50px');
  left = signal('50px');
  
  // Simple DOM positioning; no state persistence needed
  startDrag(event: MouseEvent) { /* implement drag logic */ }
  startResize(event: MouseEvent) { /* implement resize logic */ }
}
```

### 4. Role-Based Conditional Rendering
```typescript
// In component
export class CharacterSheetComponent {
  currentUserRole = signal<'User' | 'DungeonMaster'>('User');
  
  get isDungeonMaster(): boolean {
    return this.currentUserRole() === 'DungeonMaster';
  }
}

// In template
@if (isDungeonMaster) {
  <button (click)="editMode = true">Enable Editing</button>
}
@if (isDungeonMaster) {
  <app-admin-panel [sheet]="sheet()"></app-admin-panel>
}
```

## API Integration with .NET Core Backend

### Typical API Endpoints (adjust per backend implementation)
```
GET    /api/sheets/:id                    # Fetch character sheet
PUT    /api/sheets/:id                    # Update entire sheet (DM only)
PATCH  /api/sheets/:id/fields/:fieldPath # Patch specific field
POST   /api/sheets/:userId                # Create new sheet (DM only)
DELETE /api/sheets/:id                    # Delete sheet (DM only)
GET    /api/sheets                        # List sheets (all if DM, own if User)
GET    /api/key-terms                     # Fetch all key term definitions
POST   /api/auth/login                    # JWT authentication
```

### HTTP Client Pattern (with .NET Core)
```typescript
// character-sheet.service.ts
export class CharacterSheetService {
  private readonly apiUrl = '/api/sheets';
  
  constructor(private http: HttpClient) {}
  
  // Always include auth headers (via interceptor or explicit header)
  loadSheet(sheetId: string): Observable<CharacterSheet> {
    return this.http.get<CharacterSheet>(`${this.apiUrl}/${sheetId}`);
  }
  
  updateField(sheetId: string, fieldPath: string, value: any): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${sheetId}/fields/${fieldPath}`,
      { value },
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }
}

// app.config.ts - Add HTTP interceptor for auth tokens
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authTokenInterceptor])  // Auto-attach JWT to all requests
    ),
    // ... other providers
  ]
};
```

### SignalR Hub Communication
The backend should expose a SignalR hub (e.g., `/characterSheetHub`) that:
- Broadcasts `characterSheetUpdated` events to all connected users viewing that sheet
- Validates user authorization before accepting field updates
- Tracks edit versions/timestamps for conflict detection
- Logs all edits for audit purposes

## Dependencies & Recommended Libraries

### Current
- **Angular 20.3.x**: Core framework with modern standalone API
- **RxJS ~7.8.0**: Reactive programming (used by Angular internally)
- **TypeScript ~5.9.2**: Strict mode enforced
- **Prettier**: Code formatting with Angular-specific rules

### To Install (based on requirements)
- **@microsoft/signalr**: SignalR client for real-time communication
- **@angular/common/http**: HTTP client (for API calls)
- **@ng-bootstrap/ng-bootstrap** or **@angular/material**: For modals, toast notifications, and UI components
- **zone.js**: Keep minimal; only for third-party libraries that require it (since we use zoneless detection)

## Testing & Code Quality

- **Test Framework**: Jasmine + Karma runner
- **Test Files**: Colocate with components (e.g., `app.spec.ts` next to `app.ts`)
- **Coverage Targets**: Aim for >80% on core services (auth, signalr, character-sheet)
- **HTML Parser**: Angular parser configured in Prettier
- **Type Safety**: Strict mode enforced; all API responses should have typed interfaces
  
## Build & Performance

- **Output**: `dist/` directory
- **Performance Budgets**: initial bundle ≤ 500kB (warn), ≤ 1MB (error)
- **Optimization**: Enabled by default in production builds
- **Always-Online**: No offline caching needed; assume persistent connection

## Critical Do's and Don'ts

### Do's
✅ Initialize SignalR connection at app startup; keep it alive for the session  
✅ Always verify authorization on the backend before accepting updates (client-side checks are UI-only)  
✅ Emit conflict detection events to components when simultaneous edits occur  
✅ Use signals for reactive state; avoid manual subscription management where signals can simplify  
✅ Cache character sheet data after loading; update via SignalR messages  
✅ Test real-time sync scenarios (multiple users, connection loss, rapid updates)  
✅ Log all edits server-side for audit/debugging  
✅ Use explicit imports in standalone components; avoid wildcard imports  

### Don'ts
❌ Don't rely on `changeDetection: OnPush` strategies; zoneless detection handles this automatically  
❌ Don't store sensitive data (JWT tokens) in localStorage without HTTPS; consider session storage or httpOnly cookies  
❌ Don't forget to unsubscribe from SignalR hub events when components destroy  
❌ Don't allow Users to see/edit other users' character sheets or DM controls (enforce server-side)  
❌ Don't implement offline support; assume always-online connectivity  
❌ Don't add NgModule-style imports; use `imports` array in `@Component` decorator  
❌ Don't dispatch simultaneous edits to the same field without conflict detection  
❌ Don't persist pop-out window positions; keep them stateless
