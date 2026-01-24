import { Routes } from '@angular/router';
import { CharacterSheetsDashboard } from './Pages/character-sheets-dashboard/character-sheets-dashboard';
import { ItemIndex } from './Pages/item-index/item-index';

export const routes: Routes = [
    {
        path: '',
        component: CharacterSheetsDashboard
    },
    {
        path: 'character-sheets',
        component: CharacterSheetsDashboard
    },
    {
        path: 'item-index',
        component: ItemIndex
    }
];
