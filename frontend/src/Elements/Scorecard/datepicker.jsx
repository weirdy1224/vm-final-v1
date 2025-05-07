import React, { useState } from "react";
import { addDays, format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import "./Scorecard.css";

export default function DatePickerWithRange({ onDateChange }) {
  const [date, setDate] = useState({
    from: new Date(2025, 0, 1),
    to: new Date(2025, 11, 31),
  });

  const handleSelectFromDate = (newDate) => {
    if (newDate) {
      const newToDate = newDate > date.to ? addDays(newDate, 1) : date.to;
      setDate({ from: newDate, to: newToDate });
      if (onDateChange) onDateChange({ from: newDate, to: newToDate });
    }
  };

  const handleSelectToDate = (newDate) => {
    if (newDate) {
      setDate((prev) => ({ ...prev, to: newDate }));
      if (onDateChange) onDateChange({ from: date.from, to: newDate });
    }
  };

  return (
    <div className="date-picker-container">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="from-date"
            variant="outline"
            className={cn("date-picker-button", !date.from && "text-muted-foreground")}
          >
            <CalendarIcon className="w-5 h-5" />
            {date.from ? format(date.from, "LLL dd, y") : <span>From</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date.from}
            onSelect={handleSelectFromDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="to-date"
            variant="outline"
            className={cn("date-picker-button", !date.to && "text-muted-foreground")}
          >
            <CalendarIcon className="w-5 h-5" />
            {date.to ? format(date.to, "LLL dd, y") : <span>To</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date.to}
            onSelect={handleSelectToDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}