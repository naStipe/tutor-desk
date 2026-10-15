import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalList,
  LegalSection,
  LegalShell,
} from "../../../features/marketing/components/LegalShell";
import { CONTACT_EMAIL, OPERATOR, OPERATOR_COUNTRY } from "../../../features/marketing/legal";
import { PRICE_SENTENCE } from "../../../features/marketing/pricing";

export const metadata: Metadata = {
  title: "Terms of Service | TutorDesk",
  description: "The rules for using TutorDesk, the scheduling and payments workspace for tutors.",
  alternates: { canonical: "/terms" },
};

const mail = (
  <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-ink underline">
    {CONTACT_EMAIL}
  </a>
);

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      intro="These terms apply when you use TutorDesk. By creating an account or using the service, you agree to them."
    >
      <LegalSection title="1. The service">
        <p>
          TutorDesk is a web workspace for independent private tutors. It helps you schedule
          lessons, track homework, record payments and lesson packages, and share a portal with
          students and families. It is operated by {OPERATOR}, {OPERATOR_COUNTRY}. TutorDesk is not
          a marketplace, does not find students for you and takes no commission on your lessons.
        </p>
      </LegalSection>

      <LegalSection title="2. Your account">
        <LegalList
          items={[
            <>You must be at least 18 years old to create a tutor account.</>,
            <>
              Give accurate details and keep your password secret. You are responsible for what
              happens under your account.
            </>,
            <>Tell us at once if you think someone else has accessed your account.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Your students' data">
        <p>
          You decide what you enter about students and guardians. You must have the right to store
          it, and you must follow the data protection and other laws that apply to your tutoring
          work, including involving a guardian where a student is a minor. For this data you are the
          controller and we process it on your behalf, as described in our{" "}
          <Link href="/privacy" className="font-medium text-ink underline">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="4. Acceptable use">
        <p>You agree not to:</p>
        <LegalList
          items={[
            <>break the law or infringe anyone&apos;s rights using TutorDesk;</>,
            <>
              upload malicious code, or try to disrupt, probe or bypass the security of the service;
            </>,
            <>
              access another user&apos;s data or use the service to send spam or abusive content;
            </>,
            <>resell or copy the service, or use automated tools to scrape it.</>,
          ]}
        />
        <p>
          We may suspend an account that breaks these rules, and we will explain why where we can.
        </p>
      </LegalSection>

      <LegalSection title="5. Payments between you and students">
        <p>
          TutorDesk records lessons, packages and payment status. It does not collect, hold or
          transfer money, and it is not a party to any agreement between you and your students. You
          are responsible for the accuracy of your records, your pricing, your refunds and your
          taxes.
        </p>
      </LegalSection>

      <LegalSection title="6. Price">
        <p>
          TutorDesk costs {PRICE_SENTENCE}, one plan with every feature. Billing is not switched on
          yet, so nothing is charged today. We will tell you before the first charge applies, and
          you can stop using the service instead of paying.
        </p>
      </LegalSection>

      <LegalSection title="7. Your content and our rights">
        <p>
          You own the content you enter. You give us permission to store and process it only to run
          the service for you. TutorDesk&apos;s software, design and brand belong to {OPERATOR} or
          its licensors, and these terms do not transfer them to you.
        </p>
      </LegalSection>

      <LegalSection title="8. Availability">
        <p>
          We work to keep TutorDesk running, but we do not promise it will always be available or
          free of errors. We may change or remove features. Keep your own copy of information you
          cannot afford to lose.
        </p>
      </LegalSection>

      <LegalSection title="9. Liability">
        <p>
          TutorDesk is provided &ldquo;as is&rdquo;. To the extent the law allows, we are not liable
          for indirect or consequential loss, lost income or lost data, and our total liability for
          any claim is limited to the amount you paid us in the previous 12 months. Nothing in these
          terms limits liability that cannot be limited by law, or the mandatory rights of
          consumers.
        </p>
      </LegalSection>

      <LegalSection title="10. Ending your use">
        <p>
          You can stop using TutorDesk at any time. Delete your account in Settings, or ask us to do
          it at {mail}. We may close an account that stays inactive for a long time or that
          seriously breaks these terms. Sections that by their nature should continue, such as
          liability, will continue.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to these terms">
        <p>
          We may update these terms. If a change matters, we will give signed-in users notice before
          it applies. If you keep using TutorDesk after the date shown, you accept the updated
          terms.
        </p>
      </LegalSection>

      <LegalSection title="12. Governing law">
        <p>
          These terms follow the laws of Finland. Disputes go to the courts of Finland, except that
          a consumer may also use the courts of their own country where the law gives them that
          right.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>
          {OPERATOR}, {OPERATOR_COUNTRY}. Email: {mail}.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
