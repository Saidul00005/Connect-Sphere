export interface Message {
  id: number;
  room: number;
  sender: {
    id: number;
    first_name: string;
    last_name: string;
  };
  content: string;
  timestamp: string;
  is_deleted: boolean;
  read_by: any[];
  is_modified: boolean;
  last_modified_at: string;
  is_restored: boolean;
  last_restore_at: string;
  is_delivered: boolean;
  is_sent: boolean;
}

export interface MessageResponse {
  results: Message[];
  next: string | null;
  previous: string | null;
}

export interface PageData {
  results: Message[];
  next: string | null;
  previous: string | null;
}

export interface ChatMessageState {
  pages: { [roomId: string]: { [cursor: string]: PageData } };
  currentPage: { [roomId: string]: string };
  loading: boolean;
  error: string | null;
}

export interface FetchMessageParams {
  pageUrl: string | null;
  roomId: string;
}
