import { useMemo } from "react";
import { Schedule, Train, RailwayConfig, TRAIN_COLORS } from "@/types/railway";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GanttChartProps {
  schedule: Schedule;
  trains: Train[];
  config: RailwayConfig;
  title: string;
}

export function GanttChart({ schedule, trains, config, title }: GanttChartProps) {
  const chartData = useMemo(() => {
    const trackData: Array<{
      trackId: number;
      assignments: Array<{
        trainId: string;
        start: number;
        duration: number;
        color: string;
        priority: string;
        delay: number;
      }>;
    }> = [];

    // Initialize tracks
    for (let i = 0; i < config.tracks; i++) {
      trackData.push({ trackId: i, assignments: [] });
    }

    // Populate assignments
    schedule.assignments.forEach((assignment, index) => {
      const train = trains.find(t => t.id === assignment.trainId);
      if (!train?.duration) return;

      trackData[assignment.trackId].assignments.push({
        trainId: assignment.trainId,
        start: assignment.actualArrival,
        duration: train.duration,
        color: TRAIN_COLORS[index % TRAIN_COLORS.length],
        priority: train.priority,
        delay: assignment.delay,
      });
    });

    // Sort assignments by start time
    trackData.forEach(track => {
      track.assignments.sort((a, b) => a.start - b.start);
    });

    return trackData;
  }, [schedule, trains, config.tracks]);

  const timeScale = config.timeHorizon;
  const trackHeight = 60;
  const chartWidth = 800;
  const chartHeight = config.tracks * (trackHeight + 10) + 40;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative bg-card border rounded-lg p-4 overflow-x-auto">
          <svg width={chartWidth} height={chartHeight} className="w-full">
            {/* Time grid */}
            {Array.from({ length: Math.ceil(timeScale / 30) + 1 }, (_, i) => i * 30).map(time => (
              <g key={time}>
                <line
                  x1={(time / timeScale) * (chartWidth - 100) + 80}
                  y1={20}
                  x2={(time / timeScale) * (chartWidth - 100) + 80}
                  y2={chartHeight - 20}
                  stroke="hsl(var(--border))"
                  strokeWidth={time % 60 === 0 ? 2 : 1}
                  opacity={0.5}
                />
                <text
                  x={(time / timeScale) * (chartWidth - 100) + 80}
                  y={15}
                  textAnchor="middle"
                  className="text-xs fill-muted-foreground"
                >
                  {time}min
                </text>
              </g>
            ))}

            {/* Tracks */}
            {chartData.map((track, trackIndex) => {
              const y = 30 + trackIndex * (trackHeight + 10);
              
              return (
                <g key={track.trackId}>
                  {/* Track background */}
                  <rect
                    x={80}
                    y={y}
                    width={chartWidth - 100}
                    height={trackHeight}
                    fill="hsl(var(--rail-track))"
                    rx={8}
                    className="track-glow"
                  />
                  
                  {/* Track label */}
                  <text
                    x={70}
                    y={y + trackHeight / 2 + 5}
                    textAnchor="end"
                    className="text-sm font-medium fill-foreground"
                  >
                    Track {track.trackId}
                  </text>

                  {/* Train assignments */}
                  {track.assignments.map((assignment, assignIndex) => {
                    const x = 80 + (assignment.start / timeScale) * (chartWidth - 100);
                    const width = (assignment.duration / timeScale) * (chartWidth - 100);
                    const trainY = y + 8;
                    const trainHeight = trackHeight - 16;

                    return (
                      <g key={`${assignment.trainId}-${assignIndex}`}>
                        {/* Train block */}
                        <rect
                          x={x}
                          y={trainY}
                          width={Math.max(width, 30)} // Minimum width for visibility
                          height={trainHeight}
                          fill={assignment.color}
                          rx={4}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            filter: `drop-shadow(0 2px 8px ${assignment.color}40)`,
                          }}
                        />
                        
                        {/* Priority indicator */}
                        <circle
                          cx={x + 8}
                          cy={trainY + 8}
                          r={3}
                          fill={
                            assignment.priority === "high" ? "hsl(var(--rail-signal-green))" :
                            assignment.priority === "medium" ? "hsl(var(--rail-signal-yellow))" :
                            "hsl(var(--rail-signal-red))"
                          }
                          className={assignment.priority === "high" ? "signal-blink" : ""}
                        />
                        
                        {/* Train ID */}
                        <text
                          x={x + Math.max(width, 30) / 2}
                          y={trainY + trainHeight / 2 + 4}
                          textAnchor="middle"
                          className="text-xs font-bold fill-white"
                          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                        >
                          {assignment.trainId}
                        </text>
                        
                        {/* Delay indicator */}
                        {assignment.delay > 0 && (
                          <text
                            x={x + Math.max(width, 30) / 2}
                            y={trainY + trainHeight / 2 + 16}
                            textAnchor="middle"
                            className="text-xs font-medium fill-accent"
                          >
                            +{assignment.delay.toFixed(0)}m
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-rail-signal-green rounded-full" />
            <span>High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-rail-signal-yellow rounded-full" />
            <span>Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-rail-signal-red rounded-full" />
            <span>Low Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-accent font-medium">+Xm</span>
            <span>Delay</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}