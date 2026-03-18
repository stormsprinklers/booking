export const INSTALL_QUOTE_EMPLOYEE_ID =
  "pro_6be40356da6d494ca9f624ffde71dec5";

// 0 = Sunday, 1 = Monday, ..., 6 = Saturday
export const INSTALL_QUOTE_ZONE_BY_DOW: Record<number, string[]> = {
  // Monday: Salt Lake County North + Central
  1: [
    "96e638a8-ab38-411a-b3ca-4a7cb09614d4", // Salt Lake County North
    "693b54d4-522d-4bbc-9a8d-d8715dc5266d", // Salt Lake County Central
  ],
  // Tuesday: Salt Lake County North + Central
  2: [
    "96e638a8-ab38-411a-b3ca-4a7cb09614d4",
    "693b54d4-522d-4bbc-9a8d-d8715dc5266d",
  ],
  // Wednesday: Salt Lake County South + Utah County North
  3: [
    "432adc34-f00d-48f7-a61d-07cd0ead8e52", // Salt Lake County South
    "337c4400-6345-4c73-8c3b-cdeab3c7c215", // Utah County North
  ],
  // Thursday: Salt Lake County South + Utah County North
  4: [
    "432adc34-f00d-48f7-a61d-07cd0ead8e52",
    "337c4400-6345-4c73-8c3b-cdeab3c7c215",
  ],
  // Friday: Utah County Central + South
  5: [
    "948d8e3d-a66d-431f-9a8b-f334b35d8769", // Utah County Central
    "56723b78-8e0e-4626-ac50-9fdae075f23f", // Utah County South
  ],
  // 0 (Sunday) and 6 (Saturday) omitted → no install-quote zones those days
};

