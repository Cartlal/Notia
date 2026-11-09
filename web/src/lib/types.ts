export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color?: string | null;
}

export interface Folder {
  id: string;
  name: string;
  color?: string | null;
  parentId?: string | null;
}

export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  url: string;
  kind: string;
}

export type CollaboratorRole = "VIEWER" | "EDITOR";

export interface Collaborator {
  id: string;
  role: CollaboratorRole;
  addedAt: string;
  user: User;
}

export type NoteRole = "OWNER" | CollaboratorRole;

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string | null;
  color?: string | null;
  type: string;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  isProtected: boolean;
  locked?: boolean;
  folderId?: string | null;
  version: number;
  tags: Tag[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}
