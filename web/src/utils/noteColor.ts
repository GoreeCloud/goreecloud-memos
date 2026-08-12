export const NOTE_COLOR_VALUES = ["default", "red", "orange", "yellow", "green", "teal", "blue", "purple", "pink"] as const;

export type NoteColor = (typeof NOTE_COLOR_VALUES)[number];

export interface NoteColorOption {
  value: NoteColor;
  label: string;
  swatchClassName: string;
  cardClassName: string;
}

export const NOTE_COLOR_OPTIONS: NoteColorOption[] = [
  {
    value: "default",
    label: "Default",
    swatchClassName: "bg-card border-border",
    cardClassName: "",
  },
  {
    value: "red",
    label: "Red",
    swatchClassName: "bg-red-100 border-red-300 dark:bg-red-950 dark:border-red-800",
    cardClassName: "bg-red-50 border-red-200/80 dark:bg-red-950/35 dark:border-red-900/70",
  },
  {
    value: "orange",
    label: "Orange",
    swatchClassName: "bg-orange-100 border-orange-300 dark:bg-orange-950 dark:border-orange-800",
    cardClassName: "bg-orange-50 border-orange-200/80 dark:bg-orange-950/35 dark:border-orange-900/70",
  },
  {
    value: "yellow",
    label: "Yellow",
    swatchClassName: "bg-amber-100 border-amber-300 dark:bg-amber-950 dark:border-amber-800",
    cardClassName: "bg-amber-50 border-amber-200/80 dark:bg-amber-950/35 dark:border-amber-900/70",
  },
  {
    value: "green",
    label: "Green",
    swatchClassName: "bg-emerald-100 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-800",
    cardClassName: "bg-emerald-50 border-emerald-200/80 dark:bg-emerald-950/35 dark:border-emerald-900/70",
  },
  {
    value: "teal",
    label: "Teal",
    swatchClassName: "bg-teal-100 border-teal-300 dark:bg-teal-950 dark:border-teal-800",
    cardClassName: "bg-teal-50 border-teal-200/80 dark:bg-teal-950/35 dark:border-teal-900/70",
  },
  {
    value: "blue",
    label: "Blue",
    swatchClassName: "bg-blue-100 border-blue-300 dark:bg-blue-950 dark:border-blue-800",
    cardClassName: "bg-blue-50 border-blue-200/80 dark:bg-blue-950/35 dark:border-blue-900/70",
  },
  {
    value: "purple",
    label: "Purple",
    swatchClassName: "bg-violet-100 border-violet-300 dark:bg-violet-950 dark:border-violet-800",
    cardClassName: "bg-violet-50 border-violet-200/80 dark:bg-violet-950/35 dark:border-violet-900/70",
  },
  {
    value: "pink",
    label: "Pink",
    swatchClassName: "bg-pink-100 border-pink-300 dark:bg-pink-950 dark:border-pink-800",
    cardClassName: "bg-pink-50 border-pink-200/80 dark:bg-pink-950/35 dark:border-pink-900/70",
  },
];

const NOTE_COLOR_PATTERN = /\n*<!--\s*goreecloud-note-color:\s*(default|red|orange|yellow|green|teal|blue|purple|pink)\s*-->\s*$/i;

export function getNoteColor(content: string): NoteColor {
  const match = content.match(NOTE_COLOR_PATTERN);
  if (!match) {
    return "default";
  }

  const value = match[1]?.toLowerCase();
  return NOTE_COLOR_VALUES.includes(value as NoteColor) ? (value as NoteColor) : "default";
}

export function stripNoteColorMetadata(content: string): string {
  return content.replace(NOTE_COLOR_PATTERN, "").trimEnd();
}

export function setNoteColor(content: string, color: NoteColor): string {
  const baseContent = stripNoteColorMetadata(content);
  if (color === "default") {
    return baseContent;
  }

  const marker = `<!-- goreecloud-note-color: ${color} -->`;
  return baseContent ? `${baseContent}\n\n${marker}` : marker;
}

export function getNoteColorCardClassName(color: NoteColor): string {
  return NOTE_COLOR_OPTIONS.find((option) => option.value === color)?.cardClassName ?? "";
}
