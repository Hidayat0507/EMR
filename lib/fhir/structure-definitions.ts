/**
 * Canonical URLs for custom extensions used in the app.
 * These can be published to a FHIR server as StructureDefinitions for interoperability.
 */

export const TRIAGE_EXTENSION_URL = 'https://ucc.emr/triage';
export const STORAGE_PATH_EXTENSION_URL = 'https://ucc.emr/storage-path';

export type ExtensionDefinition = {
  url: string;
  purpose: string;
  example?: Record<string, unknown>;
};

export const STRUCTURE_DEFINITIONS: Record<string, ExtensionDefinition> = {
  [TRIAGE_EXTENSION_URL]: {
    url: TRIAGE_EXTENSION_URL,
    purpose: 'Carries triage and queue metadata for a patient (vitals, triage level, queue status).',
    example: {
      url: TRIAGE_EXTENSION_URL,
      extension: [
        { url: 'triageLevel', valueInteger: 3 },
        { url: 'chiefComplaint', valueString: 'Chest pain' },
        { url: 'queueStatus', valueString: 'waiting' },
      ],
    },
  },
  [STORAGE_PATH_EXTENSION_URL]: {
    url: STORAGE_PATH_EXTENSION_URL,
    purpose: 'Stores bucket object path for a DocumentReference attachment to enable deletions/cleanup.',
    example: {
      url: STORAGE_PATH_EXTENSION_URL,
      valueString: 'patients/123/documents/abc.pdf',
    },
  },
};

export function getExtensionDefinition(url: string): ExtensionDefinition | undefined {
  return STRUCTURE_DEFINITIONS[url];
}

/**
 * Register StructureDefinitions in Medplum
 * 
 * This function registers custom extensions as StructureDefinition resources in Medplum.
 * It checks if they already exist before creating them.
 */
export async function registerStructureDefinitions(medplum: any): Promise<void> {
  try {
    // Check if storage-path extension is already registered
    const existingStorage = await medplum.searchOne('StructureDefinition', {
      url: 'https://ucc.emr/StructureDefinition/storage-path',
    });
    if (!existingStorage) {
      // Create StructureDefinition for storage-path extension
      // Note: Full StructureDefinition resource creation would go here
      console.log('⚠️  StructureDefinition registration not fully implemented');
    }

    // Check if triage extension is already registered
    const existingTriage = await medplum.searchOne('StructureDefinition', {
      url: 'https://ucc.emr/StructureDefinition/triage',
    });
    if (!existingTriage) {
      // Create StructureDefinition for triage extension
      // Note: Full StructureDefinition resource creation would go here
      console.log('⚠️  StructureDefinition registration not fully implemented');
    }
  } catch (error) {
    console.error('❌ Failed to register StructureDefinitions:', error);
    throw error;
  }
}
