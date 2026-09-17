export type Place = "shop" | "office" | "warehouse" | "other";
export type Size = "1-5" | "6-15" | "16-50" | "50+";
export type Pain = "numbers" | "email" | "jobs" | "lists" | "unsure";
export type Hours = "1-2" | "3-5" | "6-10" | "10+";
export type OwnerKind = "owner" | "office-manager" | "whoever" | "outside";
export type OfferId = "audit" | "sprint" | "seat";

export interface ScanAnswers {
  place: Place;
  size: Size;
  pain: Pain;
  hours: Hours;
  owner: OwnerKind;
}

export interface ScanResult {
  answers: ScanAnswers;
  hoursMidpoint: number;
  annualHours: number;
  recommend: OfferId;
  mentionSeat: boolean;
  paragraph: string;
  why: string;
}

export const HOURS_MIDPOINT: Record<Hours, number> = {
  "1-2": 1.5,
  "3-5": 4,
  "6-10": 8,
  "10+": 12,
};

export const SIZE_RANK: Record<Size, number> = {
  "1-5": 1,
  "6-15": 2,
  "16-50": 3,
  "50+": 4,
};

const PLACE_NOUN: Record<Place, string> = {
  shop: "shop",
  office: "office",
  warehouse: "warehouse or plant",
  other: "place",
};

const SIZE_PEOPLE: Record<Size, string> = {
  "1-5": "a handful of people",
  "6-15": "a 12-person",
  "16-50": "a few dozen people in a",
  "50+": "a 50-plus-person",
};

const PAIN_PHRASE: Record<Pain, string> = {
  numbers: "rebuilding the Friday numbers",
  email: "chasing email and follow-ups",
  jobs: "chasing jobs, inventory, or invoices",
  lists: "keeping customer or vendor lists straight",
  unsure: "computer work nobody has named yet",
};

const HOURS_PHRASE: Record<Hours, string> = {
  "1-2": "a couple of hours a week",
  "3-5": "about four hours a week",
  "6-10": "six to ten hours a week",
  "10+": "more than ten hours a week",
};

const OFFER_WHY: Record<OfferId, string> = {
  audit:
    "Start with a look under the hood. Sit with how the week actually runs before buying a fix.",
  sprint:
    "The hours (or the owner carrying them) are high enough that one stuck process is worth taking off the plate.",
  seat:
    "The computer work needs an owner who is not also running the floor. That is the seat, after the first fix.",
};

const QUERY_KEYS = {
  a: "place",
  s: "size",
  p: "pain",
  h: "hours",
  o: "owner",
} as const;

const PLACE_VALUES: Place[] = ["shop", "office", "warehouse", "other"];
const SIZE_VALUES: Size[] = ["1-5", "6-15", "16-50", "50+"];
const PAIN_VALUES: Pain[] = ["numbers", "email", "jobs", "lists", "unsure"];
const HOURS_VALUES: Hours[] = ["1-2", "3-5", "6-10", "10+"];
const OWNER_VALUES: OwnerKind[] = ["owner", "office-manager", "whoever", "outside"];

function includes<T extends string>(list: readonly T[], value: string): value is T {
  return (list as readonly string[]).includes(value);
}

export function evaluateScan(answers: ScanAnswers): ScanResult {
  const hoursMidpoint = HOURS_MIDPOINT[answers.hours];
  const annualHours = hoursMidpoint * 50;
  const ownerDoesIt = answers.owner === "owner";
  const sizeAtLeastMid = SIZE_RANK[answers.size] >= 2;

  let recommend: OfferId = "audit";
  if (annualHours >= 400 || (ownerDoesIt && sizeAtLeastMid)) {
    recommend = "sprint";
  } else if (answers.pain === "unsure" || answers.size === "50+") {
    recommend = "audit";
  }

  const mentionSeat =
    answers.pain !== "unsure" && hoursMidpoint >= 8 && recommend !== "seat";

  const place = PLACE_NOUN[answers.place];
  const people = SIZE_PEOPLE[answers.size];
  const pain = PAIN_PHRASE[answers.pain];
  const hours = HOURS_PHRASE[answers.hours];
  const weeks = Math.round(annualHours / 40);

  const sizeLead =
    answers.size === "6-15"
      ? `If this is ${people} ${place} spending ${hours} on ${pain}`
      : `If this is ${people} ${place} spending ${hours} on ${pain}`;

  const paragraph = `${sizeLead}, that is about ${annualHours} hours a year — roughly ${weeks} full work week${weeks === 1 ? "" : "s"} sitting in a spreadsheet or an inbox.`;

  return {
    answers,
    hoursMidpoint,
    annualHours,
    recommend,
    mentionSeat,
    paragraph,
    why: OFFER_WHY[recommend],
  };
}

export function serializeScan(answers: ScanAnswers): string {
  const params = new URLSearchParams({
    a: answers.place,
    s: answers.size,
    p: answers.pain,
    h: answers.hours,
    o: answers.owner,
  });
  return params.toString();
}

export function parseScan(search: string | URLSearchParams): ScanAnswers | null {
  const params = typeof search === "string" ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search) : search;
  const place = params.get("a") ?? "";
  const size = params.get("s") ?? "";
  const pain = params.get("p") ?? "";
  const hours = params.get("h") ?? "";
  const owner = params.get("o") ?? "";
  if (
    includes(PLACE_VALUES, place) &&
    includes(SIZE_VALUES, size) &&
    includes(PAIN_VALUES, pain) &&
    includes(HOURS_VALUES, hours) &&
    includes(OWNER_VALUES, owner)
  ) {
    return { place, size, pain, hours, owner };
  }
  return null;
}

export { QUERY_KEYS, OFFER_WHY };
