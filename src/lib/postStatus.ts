export const POST_STATUSES = ["SCHEDULED", "PUBLISHED", "FAILED"] as const;

export type PostStatus = (typeof POST_STATUSES)[number];
