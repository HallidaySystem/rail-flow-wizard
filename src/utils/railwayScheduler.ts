import { Train, RailwayConfig, Schedule, TrainAssignment, Disruption, PRIORITY_WEIGHTS } from "@/types/railway";

export function computeTraversalTime(sectionKm: number, speedKmh: number): number {
  return (sectionKm / speedKmh) * 60; // convert to minutes
}

export function prepareTrainsData(trains: Train[], config: RailwayConfig): Train[] {
  return trains.map(train => ({
    ...train,
    duration: computeTraversalTime(config.sectionLength, train.speed)
  }));
}

// Greedy scheduling algorithm (simplified version of the Python implementation)
export function greedySchedule(trains: Train[], config: RailwayConfig): Schedule {
  const tracksNextFree = new Array(config.tracks).fill(0);
  const assignments: TrainAssignment[] = [];
  
  // Sort trains by priority weight (desc) then scheduled arrival (asc)
  const sortedTrains = [...trains].sort((a, b) => {
    const weightDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
    if (weightDiff !== 0) return weightDiff;
    return a.scheduledArrival - b.scheduledArrival;
  });

  for (const train of sortedTrains) {
    if (!train.duration) continue;

    let bestTrack = 0;
    let bestStartTime = Math.max(train.scheduledArrival, tracksNextFree[0]);

    // Find the track that allows earliest departure
    for (let trackId = 0; trackId < config.tracks; trackId++) {
      const startTime = Math.max(train.scheduledArrival, tracksNextFree[trackId]);
      if (startTime + train.duration <= config.timeHorizon) {
        if (startTime < bestStartTime) {
          bestStartTime = startTime;
          bestTrack = trackId;
        }
      }
    }

    const delay = Math.max(0, bestStartTime - train.scheduledArrival);
    
    assignments.push({
      trainId: train.id,
      trackId: bestTrack,
      actualArrival: bestStartTime,
      delay,
    });

    // Update track availability
    tracksNextFree[bestTrack] = bestStartTime + train.duration + config.safetyHeadway;
  }

  return computeScheduleMetrics(assignments, trains, config);
}

// Enhanced scheduling with conflict resolution
export function optimizedSchedule(trains: Train[], config: RailwayConfig): Schedule {
  // Start with greedy solution
  let currentSchedule = greedySchedule(trains, config);
  
  // Apply local improvements
  currentSchedule = applyLocalImprovements(currentSchedule, trains, config);
  
  return currentSchedule;
}

function applyLocalImprovements(schedule: Schedule, trains: Train[], config: RailwayConfig): Schedule {
  const assignments = [...schedule.assignments];
  let improved = true;
  let iterations = 0;
  const maxIterations = 10;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    // Try swapping adjacent trains on same track
    for (let trackId = 0; trackId < config.tracks; trackId++) {
      const trackAssignments = assignments
        .filter(a => a.trackId === trackId)
        .sort((a, b) => a.actualArrival - b.actualArrival);

      for (let i = 0; i < trackAssignments.length - 1; i++) {
        const train1 = trains.find(t => t.id === trackAssignments[i].trainId)!;
        const train2 = trains.find(t => t.id === trackAssignments[i + 1].trainId)!;

        if (PRIORITY_WEIGHTS[train2.priority] > PRIORITY_WEIGHTS[train1.priority]) {
          // Try swapping if it reduces weighted delay
          const newAssignments = trySwapTrains(assignments, trackAssignments[i], trackAssignments[i + 1], trains, config);
          if (newAssignments) {
            const newSchedule = computeScheduleMetrics(newAssignments, trains, config);
            if (newSchedule.weightedDelay < schedule.weightedDelay) {
              Object.assign(assignments, newAssignments);
              schedule = newSchedule;
              improved = true;
            }
          }
        }
      }
    }
  }

  return schedule;
}

function trySwapTrains(
  assignments: TrainAssignment[], 
  assignment1: TrainAssignment, 
  assignment2: TrainAssignment,
  trains: Train[],
  config: RailwayConfig
): TrainAssignment[] | null {
  const train1 = trains.find(t => t.id === assignment1.trainId)!;
  const train2 = trains.find(t => t.id === assignment2.trainId)!;

  if (!train1.duration || !train2.duration) return null;

  // Calculate new times if we swap
  const newTime1 = Math.max(train1.scheduledArrival, assignment2.actualArrival);
  const newTime2 = Math.max(train2.scheduledArrival, assignment1.actualArrival);

  // Check feasibility
  if (newTime1 + train1.duration + config.safetyHeadway > newTime2 ||
      newTime2 + train2.duration > config.timeHorizon) {
    return null;
  }

  // Create new assignments
  const newAssignments = assignments.map(a => {
    if (a.trainId === assignment1.trainId) {
      return { ...a, actualArrival: newTime1, delay: Math.max(0, newTime1 - train1.scheduledArrival) };
    }
    if (a.trainId === assignment2.trainId) {
      return { ...a, actualArrival: newTime2, delay: Math.max(0, newTime2 - train2.scheduledArrival) };
    }
    return a;
  });

  return newAssignments;
}

export function computeScheduleMetrics(assignments: TrainAssignment[], trains: Train[], config: RailwayConfig): Schedule {
  let totalDelay = 0;
  let weightedDelay = 0;
  let finished = 0;
  const utilization: Record<number, number> = {};

  // Initialize utilization
  for (let i = 0; i < config.tracks; i++) {
    utilization[i] = 0;
  }

  for (const assignment of assignments) {
    const train = trains.find(t => t.id === assignment.trainId);
    if (!train?.duration) continue;

    totalDelay += assignment.delay;
    weightedDelay += assignment.delay * PRIORITY_WEIGHTS[train.priority];
    
    if (assignment.actualArrival + train.duration <= config.timeHorizon) {
      finished++;
    }

    utilization[assignment.trackId] += train.duration;
  }

  return {
    assignments,
    totalDelay,
    weightedDelay,
    finished,
    utilization,
  };
}

export function applyDisruption(trains: Train[], disruption: Disruption): Train[] {
  return trains.map(train => {
    if (disruption.type === "delay" && train.id === disruption.trainId && disruption.delayMinutes) {
      return {
        ...train,
        scheduledArrival: train.scheduledArrival + disruption.delayMinutes
      };
    }
    return train;
  });
}

export function rescheduleWithDisruption(
  trains: Train[], 
  config: RailwayConfig, 
  disruption: Disruption
): { before: Schedule; after: Schedule } {
  const beforeTrains = prepareTrainsData(trains, config);
  const beforeSchedule = optimizedSchedule(beforeTrains, config);
  
  const afterTrains = prepareTrainsData(applyDisruption(trains, disruption), config);
  
  // For track blocking, modify config temporarily
  let modifiedConfig = { ...config };
  if (disruption.type === "block_track" && disruption.trackId !== undefined) {
    modifiedConfig = { ...config, tracks: config.tracks - 1 };
  }
  
  const afterSchedule = optimizedSchedule(afterTrains, modifiedConfig);
  
  return { before: beforeSchedule, after: afterSchedule };
}