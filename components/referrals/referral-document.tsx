import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { OrganizationDetails } from "@/lib/org";

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingRight: 36,
    paddingBottom: 40,
    paddingLeft: 36,
    fontSize: 12,
    color: "#111827",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 150,
    height: 54,
    marginBottom: 12,
    objectFit: "contain",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 0.6,
    textAlign: "center",
    color: "#1f2937",
  },
  orgWrapper: {
    marginTop: 12,
    alignItems: "center",
  },
  orgName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
  },
  orgLine: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 2,
  },
  metaSection: {
    marginBottom: 20,
  },
  metaLine: {
    fontSize: 11,
    color: "#374151",
    marginBottom: 4,
  },
  body: {
    fontSize: 11,
    lineHeight: 1.5,
    color: "#1f2937",
  },
  paragraph: {
    marginBottom: 10,
  },
});

export interface ReferralDocumentMetadata {
  patientName?: string | null;
  patientId?: string | null;
  patientDateOfBirth?: string | null;
  patientPhone?: string | null;
  patientEmail?: string | null;
  department?: string | null;
  facility?: string | null;
  specialty?: string | null;
  doctorName?: string | null;
  dateLabel?: string | null;
  toLine?: string | null;
  fromLine?: string | null;
}

export interface ReferralDocumentProps {
  letterText: string;
  organization?: OrganizationDetails | null;
  metadata?: ReferralDocumentMetadata | null;
}

function renderParagraphs(letterText: string) {
  return letterText
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .map((line, index) => (
      <Text key={`paragraph-${index}`} style={styles.paragraph}>
        {line.length > 0 ? line : " "}
      </Text>
    ));
}

export function ReferralDocument({ letterText, organization, metadata }: ReferralDocumentProps) {
  const logoUrl = organization?.logoUrl ?? null;
  const hasOrgDetails = Boolean(
    organization && (organization.name || organization.address || organization.phone),
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {logoUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={logoUrl} style={styles.logo} />
          ) : null}
          <Text style={styles.title}>REFERRAL LETTER</Text>
          {hasOrgDetails ? (
            <View style={styles.orgWrapper}>
              {organization?.name ? <Text style={styles.orgName}>{organization.name}</Text> : null}
              {organization?.address ? (
                <Text style={styles.orgLine}>{organization.address}</Text>
              ) : null}
              {organization?.phone ? <Text style={styles.orgLine}>{organization.phone}</Text> : null}
            </View>
          ) : null}
        </View>

        {metadata ? (
          <View style={styles.metaSection}>
            {metadata.dateLabel ? (
              <Text style={styles.metaLine}>Date: {metadata.dateLabel}</Text>
            ) : null}
            {metadata.toLine ? (
              <Text style={styles.metaLine}>To: {metadata.toLine}</Text>
            ) : null}
            {metadata.fromLine ? (
              <Text style={styles.metaLine}>From: {metadata.fromLine}</Text>
            ) : null}
            {metadata.patientName ? (
              <Text style={styles.metaLine}>Patient: {metadata.patientName}</Text>
            ) : null}
            {metadata.patientId ? (
              <Text style={styles.metaLine}>NRIC / ID: {metadata.patientId}</Text>
            ) : null}
            {metadata.patientDateOfBirth ? (
              <Text style={styles.metaLine}>Date of Birth: {metadata.patientDateOfBirth}</Text>
            ) : null}
            {metadata.patientPhone ? (
              <Text style={styles.metaLine}>Phone: {metadata.patientPhone}</Text>
            ) : null}
            {metadata.patientEmail ? (
              <Text style={styles.metaLine}>Email: {metadata.patientEmail}</Text>
            ) : null}
            {metadata.department ? (
              <Text style={styles.metaLine}>Department: {metadata.department}</Text>
            ) : null}
            {metadata.specialty ? (
              <Text style={styles.metaLine}>Specialty: {metadata.specialty}</Text>
            ) : null}
            {metadata.facility ? (
              <Text style={styles.metaLine}>Facility: {metadata.facility}</Text>
            ) : null}
            {metadata.doctorName ? (
              <Text style={styles.metaLine}>Referred Doctor: {metadata.doctorName}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.body}>{renderParagraphs(letterText)}</View>
      </Page>
    </Document>
  );
}

export default ReferralDocument;
