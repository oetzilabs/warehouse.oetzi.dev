import ArrowDown from "lucide-solid/icons/arrow-down";
import ArrowRight from "lucide-solid/icons/arrow-right";
import ArrowUp from "lucide-solid/icons/arrow-up";
import Circle from "lucide-solid/icons/circle";
import CircleCheck from "lucide-solid/icons/circle-check";
import CircleHelp from "lucide-solid/icons/circle-help";
import CircleOff from "lucide-solid/icons/circle-off";
import Timer from "lucide-solid/icons/timer";

export const labels = [
  {
    value: "bug",
    label: "Bug",
  },
  {
    value: "feature",
    label: "Feature",
  },
  {
    value: "documentation",
    label: "Documentation",
  },
];

export const statuses = [
  {
    value: "backlog",
    label: "Backlog",
    icon: CircleHelp,
  },
  {
    value: "todo",
    label: "Todo",
    icon: Circle,
  },
  {
    value: "in progress",
    label: "In Progress",
    icon: Timer,
  },
  {
    value: "done",
    label: "Done",
    icon: CircleCheck,
  },
  {
    value: "canceled",
    label: "Canceled",
    icon: CircleOff,
  },
];
