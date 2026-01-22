import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { SheetListComponent } from './features/admin/sheet-list.component';
import { CharacterSheetComponent } from './features/character-sheet/character-sheet.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'sheets', component: SheetListComponent },
  { path: 'sheets/:id', component: CharacterSheetComponent },
  { path: '**', redirectTo: 'login' }
];
