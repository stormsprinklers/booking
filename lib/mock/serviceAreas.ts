import type { ServiceArea } from "@/lib/types";

export const serviceAreas: ServiceArea[] = [
  {
    id: "north-metro",
    name: "North Metro",
    region: "Minneapolis-St. Paul North",
    zipCodes: ["55126", "55127", "55128", "55129", "55433", "55434", "55442"],
  },
  {
    id: "south-metro",
    name: "South Metro",
    region: "Minneapolis-St. Paul South",
    zipCodes: ["55344", "55345", "55369", "55372", "55378", "55420", "55421", "55435"],
  },
  {
    id: "west-metro",
    name: "West Metro",
    region: "Minneapolis-St. Paul West",
    zipCodes: ["55330", "55331", "55344", "55346", "55359", "55416", "55426"],
  },
];
