export interface KeyTerm {
  id: string;
  name: string;
  definition: string;
  category?: string;
  relatedTerms?: string[]; // IDs of related terms
}
