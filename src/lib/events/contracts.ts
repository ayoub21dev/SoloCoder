export type DomainEventType =
  | "xp_earned"
  | "progress_updated"
  | "attendance_updated"
  | "leaderboard_updated";

export interface BaseDomainEvent<TType extends DomainEventType, TPayload> {
  id: string;
  type: TType;
  schoolId: string;
  actorUserId?: string;
  occurredAt: string;
  payload: TPayload;
}

export interface XpEarnedPayload {
  studentId: string;
  amount: number;
  source: "lesson_completed" | "project_reviewed" | "quiz_passed" | "manual_adjustment";
  totalXp: number;
}

export interface ProgressUpdatedPayload {
  studentId: string;
  categoryId: string;
  completedItems: number;
  totalItems: number;
  percentage: number;
}

export interface AttendanceUpdatedPayload {
  studentId: string;
  classId: string;
  status: "present" | "late" | "absent" | "justified";
  timestamp: string;
}

export interface LeaderboardUpdatedPayload {
  classId?: string;
  topStudentIds: string[];
}

export type XpEarnedEvent = BaseDomainEvent<"xp_earned", XpEarnedPayload>;
export type ProgressUpdatedEvent = BaseDomainEvent<"progress_updated", ProgressUpdatedPayload>;
export type AttendanceUpdatedEvent = BaseDomainEvent<"attendance_updated", AttendanceUpdatedPayload>;
export type LeaderboardUpdatedEvent = BaseDomainEvent<"leaderboard_updated", LeaderboardUpdatedPayload>;

export type DomainEvent =
  | XpEarnedEvent
  | ProgressUpdatedEvent
  | AttendanceUpdatedEvent
  | LeaderboardUpdatedEvent;

