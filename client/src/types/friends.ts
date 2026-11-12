export interface PublicUser {
  id: number;
  name: string;
  username: string | null;
}

export type RelationStatus = "NONE" | "FRIEND" | "OUTGOING" | "INCOMING";

export interface Colleague extends PublicUser {
  since: string;
}

export interface FriendRequest {
  id: number;
  createdAt: string;
  user: PublicUser;
}

export interface FriendRequests {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export interface UserSearchResult extends PublicUser {
  status: RelationStatus;
  requestId: number | null;
}

export interface Relation {
  status: RelationStatus;
  requestId: number | null;
}

export type FriendsEventType =
  | "request-received"
  | "request-accepted"
  | "request-rejected"
  | "request-cancelled"
  | "removed";

export interface FriendsChangedEvent {
  type: FriendsEventType;
  user: PublicUser | null;
}
