"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeTrackerProps {
  onTimeChange: (minutes: number) => void;
  initialMinutes?: number;
  className?: string;
}

export function TimeTracker({
  onTimeChange,
  initialMinutes = 0,
  className,
}: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(initialMinutes * 60 * 1000); // Convert to milliseconds
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now() - elapsedTime;
      }
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const newElapsed = now - (startTimeRef.current || now);
        setElapsedTime(newElapsed);
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, elapsedTime]);

  useEffect(() => {
    const minutes = Math.floor(elapsedTime / 60000);
    onTimeChange(minutes);
  }, [elapsedTime, onTimeChange]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    startTimeRef.current = Date.now() - elapsedTime;
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setElapsedTime(0);
    startTimeRef.current = null;
    onTimeChange(0);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="font-mono text-lg font-semibold tabular-nums">
        {formatTime(elapsedTime)}
      </div>
      <div className="flex items-center gap-1">
        {!isRunning ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleStart}
            className="h-8 w-8 p-0"
          >
            <Play className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handlePause}
            className="h-8 w-8 p-0"
          >
            <Pause className="h-4 w-4" />
          </Button>
        )}
        {elapsedTime > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleStop}
            className="h-8 w-8 p-0"
          >
            <Square className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
