import { useState, useMemo } from "react";
import { Train, RailwayConfig, Disruption } from "@/types/railway";
import { rescheduleWithDisruption, prepareTrainsData } from "@/utils/railwayScheduler";
import { GanttChart } from "./GanttChart";
import { MetricsDashboard } from "./MetricsDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Play, RotateCcw, Train as TrainIcon, AlertTriangle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_CONFIG: RailwayConfig = {
  sectionLength: 5.0,
  timeHorizon: 180,
  tracks: 3,
  maxTrainsPerTrack: 10,
  safetyHeadway: 3,
};

const DEFAULT_TRAINS: Train[] = [
  { id: "T1", scheduledArrival: 5, speed: 60, priority: "high", length: 200 },
  { id: "T2", scheduledArrival: 8, speed: 40, priority: "medium", length: 300 },
  { id: "T3", scheduledArrival: 10, speed: 80, priority: "high", length: 220 },
  { id: "T4", scheduledArrival: 12, speed: 50, priority: "low", length: 350 },
  { id: "T5", scheduledArrival: 15, speed: 70, priority: "medium", length: 180 },
  { id: "T6", scheduledArrival: 17, speed: 55, priority: "low", length: 260 },
  { id: "T7", scheduledArrival: 22, speed: 90, priority: "high", length: 200 },
  { id: "T8", scheduledArrival: 25, speed: 45, priority: "medium", length: 400 },
  { id: "T9", scheduledArrival: 28, speed: 65, priority: "low", length: 220 },
  { id: "T10", scheduledArrival: 35, speed: 75, priority: "medium", length: 200 },
];

export function RailwayDashboard() {
  const [config, setConfig] = useState<RailwayConfig>(DEFAULT_CONFIG);
  const [trains, setTrains] = useState<Train[]>(DEFAULT_TRAINS);
  const [disruption, setDisruption] = useState<Disruption>({
    type: "delay",
    trainId: "T3",
    delayMinutes: 12,
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const { toast } = useToast();

  const scheduleComparison = useMemo(() => {
    try {
      return rescheduleWithDisruption(trains, config, disruption);
    } catch (error) {
      console.error("Scheduling error:", error);
      return null;
    }
  }, [trains, config, disruption]);

  const runSimulation = async () => {
    setIsSimulating(true);
    
    // Simulate processing time for dramatic effect
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSimulating(false);
    
    if (scheduleComparison) {
      const improvement = scheduleComparison.before.totalDelay - scheduleComparison.after.totalDelay;
      toast({
        title: "Optimization Complete",
        description: improvement >= 0 
          ? `Reduced total delay by ${improvement.toFixed(1)} minutes!`
          : `Optimal solution found with ${Math.abs(improvement).toFixed(1)}min additional delay due to constraints.`,
      });
    }
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_CONFIG);
    setTrains(DEFAULT_TRAINS);
    setDisruption({ type: "delay", trainId: "T3", delayMinutes: 12 });
    toast({
      title: "Reset Complete",
      description: "All settings restored to defaults.",
    });
  };

  if (!scheduleComparison) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Configuration Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              There's an issue with the current railway configuration. Please check your settings.
            </p>
            <Button onClick={resetToDefaults} variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <TrainIcon className="w-8 h-8 text-primary" />
                Railway Optimization Demo
              </h1>
              <p className="text-muted-foreground mt-2">
                MILP-based train scheduling with disruption simulation
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={runSimulation} 
                disabled={isSimulating}
                className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg"
              >
                {isSimulating ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Optimization
                  </>
                )}
              </Button>
              <Button onClick={resetToDefaults} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Simulation Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Railway Config */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Railway Setup
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Tracks</label>
                    <Input
                      type="number"
                      value={config.tracks}
                      onChange={(e) => setConfig(prev => ({ ...prev, tracks: parseInt(e.target.value) || 3 }))}
                      min={1}
                      max={8}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Time Horizon (min)</label>
                    <Input
                      type="number"
                      value={config.timeHorizon}
                      onChange={(e) => setConfig(prev => ({ ...prev, timeHorizon: parseInt(e.target.value) || 180 }))}
                      min={60}
                      max={480}
                    />
                  </div>
                </div>
              </div>

              {/* Disruption Config */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Disruption Scenario
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={disruption.type}
                      onValueChange={(value: "delay" | "block_track") => 
                        setDisruption(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delay">Train Delay</SelectItem>
                        <SelectItem value="block_track">Track Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {disruption.type === "delay" && (
                    <>
                      <div>
                        <label className="text-sm font-medium">Train ID</label>
                        <Select
                          value={disruption.trainId || ""}
                          onValueChange={(value) => setDisruption(prev => ({ ...prev, trainId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {trains.map(train => (
                              <SelectItem key={train.id} value={train.id}>
                                {train.id} ({train.priority})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Delay (min)</label>
                        <Input
                          type="number"
                          value={disruption.delayMinutes || 0}
                          onChange={(e) => setDisruption(prev => ({ 
                            ...prev, 
                            delayMinutes: parseInt(e.target.value) || 0 
                          }))}
                          min={0}
                          max={60}
                        />
                      </div>
                    </>
                  )}

                  {disruption.type === "block_track" && (
                    <div>
                      <label className="text-sm font-medium">Track ID</label>
                      <Select
                        value={disruption.trackId?.toString() || ""}
                        onValueChange={(value) => setDisruption(prev => ({ 
                          ...prev, 
                          trackId: parseInt(value) 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: config.tracks }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              Track {i}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Train Summary */}
              <div className="space-y-4 md:col-span-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Active Trains
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {trains.map(train => (
                    <Badge 
                      key={train.id}
                      variant={train.priority === "high" ? "default" : "secondary"}
                      className="justify-center py-1"
                    >
                      {train.id}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  {trains.filter(t => t.priority === "high").length} high priority •{" "}
                  {trains.filter(t => t.priority === "medium").length} medium •{" "}
                  {trains.filter(t => t.priority === "low").length} low priority
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Dashboard */}
        <MetricsDashboard 
          beforeSchedule={scheduleComparison.before}
          afterSchedule={scheduleComparison.after}
          config={config}
        />

        <Separator />
        
        {/* Gantt Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <GanttChart
            schedule={scheduleComparison.before}
            trains={prepareTrainsData(trains, config)}
            config={config}
            title="Before: Baseline Schedule"
          />
          <GanttChart
            schedule={scheduleComparison.after}
            trains={prepareTrainsData(trains, config)}
            config={config}
            title="After: Optimized Schedule"
          />
        </div>

        {/* Recommendations */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle>Optimization Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-primary mb-2">Priority-Based Scheduling</h4>
                <p className="text-sm text-muted-foreground">
                  High-priority trains are assigned to earlier available tracks to minimize weighted delays.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-accent mb-2">Conflict Resolution</h4>
                <p className="text-sm text-muted-foreground">
                  Advanced algorithms resolve track conflicts and optimize train sequencing automatically.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-rail-signal-green mb-2">Real-time Adaptation</h4>
                <p className="text-sm text-muted-foreground">
                  System adapts to disruptions by reassigning tracks and adjusting schedules in real-time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}