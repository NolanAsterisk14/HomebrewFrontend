export type FieldType = 'text' | 'textarea' | 'number' | 'dropdown' | 'checkbox-array';

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  value: string | number | boolean | string[];
  label: string;
  placeholder?: string;
  options?: string[]; // For dropdown or checkbox-array types
  required?: boolean;
  isLocked?: boolean; // DM can lock fields from user edits
  lastEditedBy?: string;
  lastEditedAt?: Date;
}

export interface Section {
  id: string;
  title: string;
  fields: Field[];
}

export interface DynamicElement {
  id: string;
  type: 'section' | 'field' | 'custom';
  content: Field | Section | string;
  order: number;
  classRestricted?: string[]; // e.g., ['Barbarian', 'Paladin']
}

export interface CharacterSheet {
  id: string;
  userId: string;
  characterName: string;
  characterClass: string;
  level: number;
  sections: Section[];
  dynamicElements: DynamicElement[];
  version: number; // For conflict detection
  createdAt: Date;
  updatedAt: Date;
  lastEditedBy?: string;
}

export interface EditEvent {
  id: string;
  sheetId: string;
  fieldPath: string;
  oldValue: any;
  newValue: any;
  editedBy: string;
  editedAt: Date;
  version: number;
}

export interface SheetUpdate {
  sheetId: string;
  fieldPath: string;
  value: any;
  editedBy: string;
  editedAt: Date;
  version: number;
}

export interface ConflictInfo {
  field: string;
  incomingValue: any;
  localValue: any;
  incomingUser: string;
  incomingVersion: number;
  localVersion: number;
}
