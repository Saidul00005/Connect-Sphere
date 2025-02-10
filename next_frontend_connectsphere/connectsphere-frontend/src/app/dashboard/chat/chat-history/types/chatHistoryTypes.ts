export interface User {
  id: number;
  first_name: string;
  last_name: string;
}

export interface Message {
  id: number;
  content: string;
  timestamp: string;
  sender: User;
}

export interface ChatRoom {
  id: number;
  name: string;
  type: 'DIRECT' | 'GROUP';
  created_by: User;
  participants: User[];
  created_at: string;
  is_active: boolean;
  last_message: Message | null;
  unread_messages_count: number;
  is_deleted: boolean;
  last_deleted_at: string | null;
  is_restored: boolean;
  last_restore_at: string | null;
}

export interface ChatRoomResponse {
  results: ChatRoom[];
  next: string | null;
  previous: string | null;
}

export interface ChatRoomState {
  allRooms: ChatRoom[];
  nextPage: string | null;
  loading: boolean;
  error: string | null;
}

export interface FetchChatRoomsParams {
  pageUrl?: string | null;
  search?: string;
}
