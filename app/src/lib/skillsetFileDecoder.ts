/**
 * Skillset File Decoder: Decode .skill files (JSON format for MVP)
 * Handles both new .skill format and legacy .pmtpk format
 */

interface SkillsetData {
  version: string;
  type: 'skillset';
  title: string;
  styleCharacteristics: {
    palette: string;
    technique: string;
    composition: string;
    mood: string;
    subjectMatter?: string;
    extractedAt: number;
  };
  generationPrompt: string;
  referenceImages?: Array<{
    id: string;
    data: string; // base64
  }>;
  previewGenerations?: Array<{
    id: string;
    images: string[]; // base64
    prompt?: string;
  }>;
  exportedAt: number;
}

/**
 * Detect file type by magic bytes or extension
 */
function detectFileType(bytes: Uint8Array): 'skill-json' | 'pmtpk' {
  // Check magic bytes
  if (bytes.length >= 4) {
    const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2]);
    // bytes[3] = type byte (PPK\0 = XOR, PPK\1 = AES-GCM) — kept for forward compat
    if (magic === 'PPK') {
      return 'pmtpk'; // Binary .pmtpk format
    }
  }

  // Try to parse as JSON (for .skill format)
  try {
    const text = new TextDecoder().decode(bytes.slice(0, 100));
    if (text.includes('"version"') && text.includes('"type"')) {
      return 'skill-json';
    }
  } catch {
    // Not UTF-8 decodable, must be binary
  }

  // Default to pmtpk if not sure
  return 'pmtpk';
}

/**
 * Decode .skill file (JSON format)
 */
export function decodeSkillJson(bytes: Uint8Array): SkillsetData {
  const text = new TextDecoder().decode(bytes);
  const data = JSON.parse(text) as SkillsetData;

  // Validate structure
  if (data.type !== 'skillset') {
    throw new Error('Not a skillset file (type must be "skillset")');
  }
  if (!data.styleCharacteristics || !data.generationPrompt) {
    throw new Error('Invalid skillset: missing style characteristics or generation prompt');
  }

  return data;
}

/**
 * Main entry point: Decode either .skill or .pmtpk file
 */
export function decodeSkillsetFile(bytes: Uint8Array): SkillsetData {
  const fileType = detectFileType(bytes);

  if (fileType === 'skill-json') {
    return decodeSkillJson(bytes);
  } else {
    // For .pmtpk, we'd need the same binary decoding as ImportPage
    // For MVP, just try JSON decode in case it's a .pmtpk exported as JSON
    try {
      return decodeSkillJson(bytes);
    } catch {
      throw new Error(
        'File format not supported. Expected .skill (JSON) file. ' +
        '.pmtpk binary format requires separate decoder.'
      );
    }
  }
}
