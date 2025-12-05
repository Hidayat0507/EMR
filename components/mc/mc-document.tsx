import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { Patient } from "@/lib/models";
import type { OrganizationDetails } from "@/lib/org";

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingRight: 32,
    paddingBottom: 32,
    paddingLeft: 32,
    fontSize: 12,
    color: '#111827',
  },
  header: {
    marginTop: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  logoBox: { width: 160, height: 56, marginBottom: 10 },
  title: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: '#1f2937',
    marginBottom: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
    width: '100%',
  },
  section: {
    marginBottom: 14,
  },
  label: {
    fontWeight: 'bold',
    color: '#374151',
  },
  line: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-start',
    width: '100%',
  },
  signatureText: { textAlign: 'left', width: 'auto' },
  org: { alignItems: 'center', marginTop: 6 },
  orgName: { fontSize: 12, color: '#111827', fontWeight: 'bold' },
  orgText: { fontSize: 10, color: '#6b7280' },
});

export interface McDocumentProps {
  patient: Patient;
  issuedDate: string; // formatted
  startDate: string; // formatted
  endDate: string; // formatted
  numDays: number;
  doctorName: string;
  organization?: OrganizationDetails | null;
}

export function McDocument({
  patient,
  issuedDate,
  startDate,
  endDate,
  numDays,
  doctorName,
  organization,
}: McDocumentProps) {
  const logoUrl = organization?.logoUrl ?? null;
  const org = organization ?? null;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {logoUrl && (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={logoUrl} style={styles.logoBox} />
          )}
          <Text style={styles.title}>MEDICAL CERTIFICATE</Text>
          {org && (org.name || org.address || org.phone) && (
            <View style={styles.org}>
              {org.name ? <Text style={styles.orgName}>{org.name}</Text> : null}
              {org.address ? <Text style={styles.orgText}>{org.address}</Text> : null}
              {org.phone ? <Text style={styles.orgText}>{org.phone}</Text> : null}
            </View>
          )}
        </View>
        <View style={styles.divider} />

        <View style={styles.section}>
          <Text>
            <Text style={styles.label}>Date Issued:</Text> {issuedDate}
          </Text>
          <Text>
            <Text style={styles.label}>Patient Name:</Text> {patient.fullName}
          </Text>
          <Text>
            <Text style={styles.label}>NRIC:</Text> {patient.nric}
          </Text>
        </View>

        <View style={styles.section}>
          <Text>
            This is to certify that the above-named patient was seen at our clinic and is unfit for duty/school from <Text style={styles.label}>{startDate}</Text> to <Text style={styles.label}>{endDate}</Text> ({numDays} day{numDays > 1 ? 's' : ''}).
          </Text>
        </View>

        <View style={styles.line}>
          <Text style={styles.signatureText}>_________________________</Text>
          <Text style={styles.signatureText}>{doctorName}</Text>
          <Text style={styles.signatureText}>Medical Practitioner</Text>
        </View>
      </Page>
    </Document>
  );
}

