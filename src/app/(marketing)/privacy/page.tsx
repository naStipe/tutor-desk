import type { Metadata } from "next";
import {
  LegalList,
  LegalSection,
  LegalShell,
} from "../../../features/marketing/components/LegalShell";
import { CONTACT_EMAIL, OPERATOR, OPERATOR_COUNTRY } from "../../../features/marketing/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | TutorDesk",
  description:
    "How TutorDesk collects, uses and protects personal data for tutors, students and guardians.",
  alternates: { canonical: "/privacy" },
};

const mail = (
  <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-ink underline">
    {CONTACT_EMAIL}
  </a>
);

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      intro="TutorDesk helps independent private tutors manage lessons, homework and payments. This policy explains what personal data we handle, why, and what rights you have."
    >
      <LegalSection title="1. Who is responsible">
        <p>
          TutorDesk is run by {OPERATOR}, {OPERATOR_COUNTRY}. You can reach us at {mail}.
        </p>
        <p>Our role depends on the data:</p>
        <LegalList
          items={[
            <>
              <strong className="text-ink">Tutor account data</strong> (your sign-in details and
              profile): we are the controller.
            </>,
            <>
              <strong className="text-ink">Student and guardian data</strong> that a tutor enters
              (names, contacts, notes, lessons, homework, payments): the tutor is the controller and
              we process it on the tutor&apos;s behalf. If you are a student or guardian and want
              access to or deletion of this data, please ask your tutor first. We will help the
              tutor respond.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="2. What data we handle">
        <LegalList
          items={[
            <>
              <strong className="text-ink">Account:</strong> email address and a password (stored as
              a hash by our authentication provider). If you choose Google sign-in, we receive your
              name and email from Google.
            </>,
            <>
              <strong className="text-ink">Tutor profile:</strong> name, time zone, language,
              currency, payment instructions and optional contact email and phone.
            </>,
            <>
              <strong className="text-ink">Tutor-entered records:</strong> student and guardian
              names, email, phone and messenger handles, notes, subjects and rates, lessons and
              their status, lesson packages, payment status, and homework text with feedback.
            </>,
            <>
              <strong className="text-ink">Portal accounts:</strong> if a tutor invites a student or
              guardian, we create a sign-in for them and link it to that student&apos;s records.
            </>,
            <>
              <strong className="text-ink">Technical data:</strong> a session cookie, server logs
              kept by our hosting providers (for example IP address and request time), and anonymous
              page performance measurements.
            </>,
          ]}
        />
        <p>
          TutorDesk records payments but does not process them. We never see card or bank details.
        </p>
      </LegalSection>

      <LegalSection title="3. Why we use it and on what basis">
        <LegalList
          items={[
            <>
              To provide the service you signed up for: accounts, scheduling, homework, payment
              records and the student portal (contract, GDPR Art. 6(1)(b)).
            </>,
            <>
              To send service emails such as sign-up confirmation and password reset, and, where a
              tutor has switched them on, lesson and payment reminders (contract and our legitimate
              interest in a working service, Art. 6(1)(b) and (f)).
            </>,
            <>
              To keep the service secure, prevent abuse and measure performance (legitimate
              interest, Art. 6(1)(f)).
            </>,
            <>To meet legal obligations that apply to us (Art. 6(1)(c)).</>,
          ]}
        />
        <p>We do not sell personal data and we do not use it for advertising.</p>
      </LegalSection>

      <LegalSection title="4. Cookies and local storage">
        <p>
          We use only what the service needs: a sign-in session cookie, and a small local-storage
          entry that remembers your light or dark theme. Our performance measurement does not use
          cookies. We use no advertising or cross-site tracking cookies, so there is no cookie
          banner.
        </p>
      </LegalSection>

      <LegalSection title="5. Who we share data with">
        <p>We use these providers to run TutorDesk:</p>
        <LegalList
          items={[
            <>
              <strong className="text-ink">Supabase</strong>: database and authentication. Our
              database is hosted in the EU (Frankfurt, Germany).
            </>,
            <>
              <strong className="text-ink">Vercel</strong>: web hosting and anonymous performance
              measurement.
            </>,
            <>
              <strong className="text-ink">Resend</strong>: sending email.
            </>,
            <>
              <strong className="text-ink">Google</strong>: only if you choose Google sign-in.
            </>,
          ]}
        />
        <p>
          Some of these providers may process data outside the EU or EEA. Where they do, we rely on
          an EU adequacy decision or Standard Contractual Clauses. We may also disclose data when
          the law requires it.
        </p>
      </LegalSection>

      <LegalSection title="6. How long we keep it">
        <p>
          We keep account and tutor-entered data while the account is active. You can delete your
          account yourself in Settings, under &ldquo;Delete account&rdquo;, or ask us at {mail}. We
          then delete your account and the records you entered, including uploaded homework files,
          except where the law requires us to keep something. Students and guardians who use the
          portal keep their own sign-in, but lose access to your data. Backups and logs expire on
          the schedule of the provider that holds them.
        </p>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>
          Data is encrypted in transit. Every tutor&apos;s records are separated at the database
          level, so one tutor cannot read another tutor&apos;s students. No system is perfectly
          secure. If a breach affects you, we will notify you and the authorities as the law
          requires.
        </p>
      </LegalSection>

      <LegalSection title="8. Children">
        <p>
          Some students are minors. TutorDesk is built for tutors, not for children, and children
          are not meant to create their own accounts without a parent or guardian. Tutors are
          responsible for having the right to store a student&apos;s data and for involving the
          guardian where the law requires it.
        </p>
      </LegalSection>

      <LegalSection title="9. Your rights">
        <p>
          Under the GDPR you can ask to access, correct, delete, restrict or export your personal
          data, and object to processing based on legitimate interest. Email {mail} and we will
          answer within one month. You can also complain to the Finnish Data Protection Ombudsman
          (tietosuoja.fi) or to the authority in your own country.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes">
        <p>
          We may update this policy. When the change is significant, we will tell signed-in users by
          email or in the app. The date at the top shows the latest version.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact">
        <p>
          Questions about privacy: {mail}. {OPERATOR}, {OPERATOR_COUNTRY}.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
