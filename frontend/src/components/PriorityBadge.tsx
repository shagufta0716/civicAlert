type Priority = "Critical" | "High" | "Medium" | "Low" | string;

const priorityConfig: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Critical: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-300",
    dot: "bg-red-500",
  },
  High: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    border: "border-orange-300",
    dot: "bg-orange-500",
  },
  Medium: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-300",
    dot: "bg-yellow-500",
  },
  Low: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-300",
    dot: "bg-green-500",
  },
};

export default function PriorityBadge({
  priority,
  size = "md",
}: {
  priority: Priority;
  size?: "sm" | "md" | "lg";
}) {
  const config = priorityConfig[priority] ?? priorityConfig.Medium;
  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-xs"
      : size === "lg"
      ? "px-4 py-1.5 text-base"
      : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${config.bg} ${config.text} ${config.border} ${sizeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {priority}
    </span>
  );
}
