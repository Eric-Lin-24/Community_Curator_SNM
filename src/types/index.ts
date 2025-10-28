export interface DocumentCollection {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Document {
  id: string;
  collection_id: string | null;
  title: string;
  content: string;
  file_url: string | null;
  source: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ScheduledMessage {
  id: string;
  document_id: string | null;
  platform: 'whatsapp' | 'telegram';
  recipient: string;
  scheduled_time: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  message_content: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  user_id: string;
}

export interface Form {
  id: string;
  name: string;
  description: string;
  schema: FormField[];
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox';
  label: string;
  required: boolean;
  options?: string[];
}

export interface FormSubmission {
  id: string;
  form_id: string;
  data: Record<string, any>;
  submitted_at: string;
  source: string;
}

export interface SharePointConnection {
  id: string;
  name: string;
  site_url: string;
  folder_path: string;
  sync_enabled: boolean;
  last_sync: string | null;
  created_at: string;
  user_id: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  platform: 'whatsapp' | 'telegram' | 'all';
  created_at: string;
  updated_at: string;
  user_id: string;
}
