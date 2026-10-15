// Single source for the price shown on the landing page, its JSON-LD offer and the terms page.
export const PRICE = { amount: 5, currency: "EUR", period: "month" } as const;
export const PRICE_LABEL = "€5";
export const PRICE_SENTENCE = `${PRICE_LABEL} per ${PRICE.period}`;

// What the one plan includes. Only features that exist in the product.
export const PLAN_INCLUDES = [
  "Calendar with one-off and repeating lessons",
  "Students, subject rates and a separate payer",
  "Payment tracking and prepaid lesson packages",
  "Homework with files and feedback",
  "Portal for students and parents",
] as const;
