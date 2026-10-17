/** Fictional, browser-local demo records. This is not an authenticated backend. */
export type Role = 'doctor' | 'patient' | 'family';
export type AccessLevel = 'Full' | 'Basic' | 'Support' | 'revoked';
export interface User {
  id: string;
  name: string;
  role: Role;
  initials: string;
}
export interface Space {
  id: string;
  name: string;
  description: string;
  category: string;
  patientId: string;
  memberIds: string[];
  updatedAt: string;
  tone: 'mint' | 'blue' | 'peach' | 'lavender' | 'yellow';
}
export interface Conversation {
  id: string;
  spaceId: string;
  title: string;
  kind: 'ai' | 'direct' | 'group';
  participantIds: string[];
}
export interface Message {
  id: string;
  conversationId: string;
  authorId: string;
  body: string;
  createdAt: string;
  sourceInstructionId?: string;
  needsHandoff?: boolean;
}
export interface Instruction {
  id: string;
  kind: 'action' | 'restriction' | 'appointment';
  text: string;
  sourceLabel: string;
  sourcePassage: string;
  dueAt: string;
  endsAt?: string;
  recurrence: 'daily' | 'once';
}
export interface Plan {
  id: string;
  spaceId: string;
  title: string;
  version: number;
  status: 'draft' | 'approved';
  instructions: Instruction[];
  approvedAt?: string;
  approvedBy?: string;
}
export interface CompletionReport {
  id: string;
  spaceId: string;
  instructionId: string;
  date: string;
  authorId: string;
  reportedAt: string;
  undoneAt?: string;
}
export interface Document {
  id: string;
  spaceId: string;
  name: string;
  size: number;
  mime: string;
  text: string;
  createdAt: string;
}
export interface Grant {
  id: string;
  spaceId: string;
  familyId: string;
  level: AccessLevel;
}
export interface AuditEntry {
  id: string;
  spaceId: string;
  actorId: string;
  previousLevel: AccessLevel;
  newLevel: AccessLevel;
  createdAt: string;
}
export interface Handoff {
  id: string;
  spaceId: string;
  patientId: string;
  doctorId: string;
  summary: string;
  status: 'sent' | 'acknowledged';
  createdAt: string;
}
export interface Store {
  actorId: string;
  users: User[];
  spaces: Space[];
  conversations: Conversation[];
  messages: Message[];
  plans: Plan[];
  reports: CompletionReport[];
  documents: Document[];
  grants: Grant[];
  audit: AuditEntry[];
  handoffs: Handoff[];
}
