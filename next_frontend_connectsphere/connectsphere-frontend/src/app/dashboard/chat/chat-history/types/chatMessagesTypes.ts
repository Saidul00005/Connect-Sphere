// next_frontend_connectsphere/connectsphere-frontend/src/app/dashboard/chat/chat-history/types/chatMessageTypes.ts

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
  count: number;
}

export interface PageData {
  results: Message[];
  next: string | null;
  previous: string | null;
  count: number;
}

export interface ChatMessageState {
  pages: { [roomId: string]: { [page: string]: PageData } };
  currentPage: { [roomId: string]: string };
  loading: boolean;
  error: string | null;
}

export interface FetchMessageParams {
  pageUrl: string | null;
  roomId: string;
}
