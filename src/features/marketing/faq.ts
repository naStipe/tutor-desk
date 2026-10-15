// Single source for the landing FAQ: rendered on the page and mirrored in the FAQPage JSON-LD.
import { PRICE_SENTENCE } from "./pricing";

export const FAQ = [
  {
    q: "How much does it cost?",
    a: `${PRICE_SENTENCE}. There is one plan and it includes every feature.`,
  },
  {
    q: "Who is TutorDesk for?",
    a: "Independent, self-employed private tutors who manage their own students, schedule and payments. It is not a school system.",
  },
  {
    q: "Do you take a commission on my lessons?",
    a: "No. TutorDesk is not a marketplace. You bring your own students and keep what you earn.",
  },
  {
    q: "Can my students and their parents use it?",
    a: "Yes. Invite them to a lightweight portal where they see lessons, complete text homework and check payment status.",
  },
  {
    q: "Do I need video calls built in?",
    a: "No. Keep using Google Meet, Zoom or teach in person. Add your meeting link to any lesson.",
  },
  {
    q: "How fast can I get started?",
    a: "Create an account, add a student and schedule your first lesson. Most tutors are set up in a single sitting.",
  },
] as const;
