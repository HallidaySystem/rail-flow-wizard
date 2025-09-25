export interface Train {
  id: string;
  scheduledArrival: number; // minutes from start
  speed: number; // km/h
  priority: "high" | "medium" | "low";
  length: number; // meters
  duration?: number; // computed traversal time
}

export interface RailwayConfig {
  sectionLength: number; // km
  timeHorizon: number; // minutes
  tracks: number;
  maxTrainsPerTrack: number;
  safetyHeadway: number; // minutes
}

export interface TrainAssignment {
  trainId: string;
  trackId: number;
  actualArrival: number;
  delay: number;
}

export interface Schedule {
  assignments: TrainAssignment[];
  totalDelay: number;
  weightedDelay: number;
  finished: number;
  utilization: Record<number, number>;
}

export interface Disruption {
  type: "delay" | "block_track";
  trainId?: string;
  delayMinutes?: number;
  trackId?: number;
}

export interface ScheduleComparison {
  before: Schedule;
  after: Schedule;
  improvement: {
    delayReduction: number;
    throughputImprovement: number;
    utilizationChange: number;
  };
}

export const PRIORITY_WEIGHTS = {
  high: 3.0,
  medium: 2.0,
  low: 1.0,
} as const;

export const TRAIN_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", 
  "#8B5CF6", "#06B6D4", "#84CC16", "#F97316",
  "#EC4899", "#6366F1", "#14B8A6", "#F59E0B"
] as const;