import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface ReferralNetworkProps {
  stats: {
    total: number;
    completed: number;
    pending: number;
  };
}

export const ReferralNetwork = ({ stats }: ReferralNetworkProps) => {
  const radius = 80;
  const centerX = 150;
  const centerY = 150;

  // Calculate positions for referral nodes in a circle
  const getNodePosition = (index: number, total: number) => {
    const angle = (index * 2 * Math.PI) / total;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { x, y };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Your Farming Circle
        </CardTitle>
        <CardDescription>Visual representation of your referral network</CardDescription>
      </CardHeader>
      <CardContent>
        <svg width="300" height="300" className="mx-auto">
          {/* Draw lines from center to each node */}
          {Array.from({ length: stats.total }).map((_, i) => {
            const pos = getNodePosition(i, Math.max(stats.total, 1));
            const isCompleted = i < stats.completed;
            return (
              <line
                key={`line-${i}`}
                x1={centerX}
                y1={centerY}
                x2={pos.x}
                y2={pos.y}
                stroke={isCompleted ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                strokeWidth="2"
                opacity={isCompleted ? "0.6" : "0.3"}
              />
            );
          })}

          {/* Draw referral nodes */}
          {Array.from({ length: stats.total }).map((_, i) => {
            const pos = getNodePosition(i, Math.max(stats.total, 1));
            const isCompleted = i < stats.completed;
            return (
              <g key={`node-${i}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="12"
                  fill={isCompleted ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                  stroke={isCompleted ? "hsl(var(--primary))" : "hsl(var(--border))"}
                  strokeWidth="2"
                />
                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  fill={isCompleted ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))"}
                  fontSize="12"
                  fontWeight="bold"
                >
                  {isCompleted ? "✓" : "•"}
                </text>
              </g>
            );
          })}

          {/* Center node (you) */}
          <circle
            cx={centerX}
            cy={centerY}
            r="24"
            fill="hsl(var(--primary))"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth="3"
          />
          <text
            x={centerX}
            y={centerY + 6}
            textAnchor="middle"
            fill="hsl(var(--primary-foreground))"
            fontSize="20"
            fontWeight="bold"
          >
            You
          </text>
        </svg>

        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Active ({stats.completed})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted border-2 border-border" />
            <span>Pending ({stats.pending})</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};