// Registry of transactional email templates
// Add new templates here by importing them and adding to the TEMPLATES map

export interface TemplateEntry {
  component: any;
  subject: string | ((data: any) => string);
  displayName?: string;
  previewData?: Record<string, any>;
  to?: string | ((data: any) => string);
}

export const TEMPLATES: Record<string, TemplateEntry> = {};
