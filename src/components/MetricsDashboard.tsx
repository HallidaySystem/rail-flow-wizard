import { Schedule, RailwayConfig } from "@/types/railway";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingDown, TrendingUp, Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface MetricsDashboardProps {
  beforeSchedule: Schedule;
  afterSchedule: Schedule;
  config: RailwayConfig;
}

export function MetricsDashboard({ beforeSchedule, afterSchedule, config }: MetricsDashboardProps) {
  const delayComparison = [
    { name: "Before", totalDelay: beforeSchedule.totalDelay, weightedDelay: beforeSchedule.weightedDelay },
    { name: "After", totalDelay: afterSchedule.totalDelay, weightedDelay: afterSchedule.weightedDelay },
  ];

  const utilizationData = Object.entries(afterSchedule.utilization).map(([trackId, utilization]) => ({
    track: `Track ${trackId}`,
    utilization: ((utilization / config.timeHorizon) * 100).toFixed(1),
    utilizationValue: utilization / config.timeHorizon,
  }));

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

  const delayReduction = beforeSchedule.totalDelay - afterSchedule.totalDelay;
  const throughputImprovement = afterSchedule.finished - beforeSchedule.finished;
  const weightedDelayReduction = beforeSchedule.weightedDelay - afterSchedule.weightedDelay;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Key Metrics Cards */}
      <Card className="bg-gradient-to-br from-primary/20 to-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Total Delay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{afterSchedule.totalDelay.toFixed(1)}m</div>
          <div className={`text-sm flex items-center gap-1 ${
            delayReduction >= 0 ? "text-rail-signal-green" : "text-rail-signal-red"
          }`}>
            {delayReduction >= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            {Math.abs(delayReduction).toFixed(1)}m vs before
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-accent/20 to-accent/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Weighted Delay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{afterSchedule.weightedDelay.toFixed(1)}</div>
          <div className={`text-sm flex items-center gap-1 ${
            weightedDelayReduction >= 0 ? "text-rail-signal-green" : "text-rail-signal-red"
          }`}>
            {weightedDelayReduction >= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            {Math.abs(weightedDelayReduction).toFixed(1)} vs before
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-rail-signal-green/20 to-rail-signal-green/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Throughput
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{afterSchedule.finished}</div>
          <div className={`text-sm flex items-center gap-1 ${
            throughputImprovement >= 0 ? "text-rail-signal-green" : "text-rail-signal-red"
          }`}>
            {throughputImprovement >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(throughputImprovement)} trains vs before
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-secondary/40 to-secondary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(Object.values(afterSchedule.utilization).reduce((a, b) => a + b, 0) / 
              (config.tracks * config.timeHorizon) * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">Across all tracks</div>
        </CardContent>
      </Card>

      {/* Delay Comparison Chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Delay Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={delayComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Bar dataKey="totalDelay" fill="hsl(var(--primary))" name="Total Delay (min)" />
              <Bar dataKey="weightedDelay" fill="hsl(var(--accent))" name="Weighted Delay" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Track Utilization Chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Track Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={utilizationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ track, utilization }) => `${track}: ${utilization}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="utilizationValue"
              >
                {utilizationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, "Utilization"]}
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}