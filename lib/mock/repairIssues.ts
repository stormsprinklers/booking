export type RepairIssueId =
  | "not-turning-on"
  | "not-turning-off"
  | "low-pressure"
  | "leak"
  | "coverage-issues"
  | "broken-backflow"
  | "main-shutoff"
  | "electrical-error"
  | "broken-heads"
  | "moving-adding-heads"
  | "drip-irrigation"
  | "general";

export interface RepairIssue {
  id: RepairIssueId;
  label: string;
  hasFollowUp: boolean;
  followUpQuestion?: string;
  followUpOptions?: { id: string; label: string; min: number; max: number }[];
  /** Fixed range when no follow-up or fallback */
  min: number;
  max: number;
}

export const REPAIR_ISSUES: RepairIssue[] = [
  {
    id: "not-turning-on",
    label: "Sprinklers won't turn on",
    hasFollowUp: true,
    followUpQuestion: "Is it one section or the whole system?",
    followUpOptions: [
      { id: "one-section", label: "One section", min: 100, max: 150 },
      { id: "one-section-old", label: "One section (older/DIY system)", min: 400, max: 1000 },
      { id: "whole-system", label: "Whole system", min: 50, max: 150 },
    ],
    min: 100,
    max: 500,
  },
  {
    id: "not-turning-off",
    label: "Sprinklers won't turn off",
    hasFollowUp: true,
    followUpQuestion: "Is your system older or DIY-installed?",
    followUpOptions: [
      { id: "no", label: "No (standard system)", min: 100, max: 150 },
      { id: "yes", label: "Yes (may need full valve box replacement)", min: 400, max: 1000 },
    ],
    min: 100,
    max: 150,
  },
  {
    id: "low-pressure",
    label: "Low water pressure",
    hasFollowUp: false,
    min: 200,
    max: 900,
  },
  {
    id: "leak",
    label: "Leak or wet spots",
    hasFollowUp: true,
    followUpQuestion: "Is the leak under concrete or in dense roots?",
    followUpOptions: [
      { id: "no", label: "No", min: 125, max: 250 },
      { id: "yes", label: "Yes", min: 250, max: 400 },
    ],
    min: 125,
    max: 250,
  },
  {
    id: "coverage-issues",
    label: "Coverage issues",
    hasFollowUp: false,
    min: 249,
    max: 249,
  },
  {
    id: "broken-backflow",
    label: "Broken backflow preventer",
    hasFollowUp: true,
    followUpQuestion: "What's the issue?",
    followUpOptions: [
      { id: "install", label: "Need to install (doesn't exist)", min: 800, max: 1500 },
      { id: "crack", label: "Leaking from crack (needs replacement)", min: 500, max: 1500 },
      { id: "vent", label: "Leaking from bottom (vent—usually quick fix)", min: 100, max: 150 },
    ],
    min: 500,
    max: 1500,
  },
  {
    id: "main-shutoff",
    label: "Main shutoff valve (stop and waste)",
    hasFollowUp: true,
    followUpQuestion: "Near a tree or concrete?",
    followUpOptions: [
      { id: "no", label: "No", min: 1950, max: 1950 },
      { id: "yes", label: "Yes", min: 2450, max: 2450 },
    ],
    min: 1950,
    max: 1950,
  },
  {
    id: "electrical-error",
    label: "Electrical error",
    hasFollowUp: false,
    min: 100,
    max: 400,
  },
  {
    id: "broken-heads",
    label: "Broken sprinkler heads",
    hasFollowUp: true,
    followUpQuestion: "Near roots?",
    followUpOptions: [
      { id: "no", label: "No", min: 70, max: 90 },
      { id: "yes", label: "Yes", min: 105, max: 135 },
    ],
    min: 70,
    max: 90,
  },
  {
    id: "moving-adding-heads",
    label: "Moving or adding sprinkler heads",
    hasFollowUp: false,
    min: 150,
    max: 200,
  },
  {
    id: "drip-irrigation",
    label: "Adding drip irrigation",
    hasFollowUp: false,
    min: 800,
    max: 1400,
  },
  {
    id: "general",
    label: "Not sure / other",
    hasFollowUp: false,
    min: 99,
    max: 199,
  },
];
