export interface Convergenc3TemplateConfig {
  fonts: {
    primary: string
    headings: string
    body: string
    size: {
      title: number
      h1: number
      h2: number
      h3: number
      h4: number
      body: number
      small: number
    }
  }
  colors: {
    primary: string // Convergenc3 Blue
    heading: string
    text: string
    tableHeader: string
    tableBorder: string
    tableAltRow: string
  }
  spacing: {
    pageMargins: {
      top: number
      right: number
      bottom: number
      left: number
    }
    paragraphBefore: number
    paragraphAfter: number
    lineHeight: number
  }
  logo: {
    width: number
    height: number
    alignment: "left" | "center" | "right"
  }
  coverPage: {
    header: {
      projectName: string // "G20 Knowledge Dashboard"
      version: string // "[Version 0.1]"
      controlDisclosure: string // "Control Disclosure"
      fontSize: number
      alignment: "left" | "center" | "right"
      spacing: {
        afterProjectName: number // Space between project name and version
        afterVersion: number // Space between version and control disclosure
        afterHeader: number // Space between header and logo
      }
    }
    logo: {
      width: number // 285px = ~4 inches
      height: number // 285px = ~4 inches
      alignment: "left" | "center" | "right"
      spacingAfter: number // Space between logo and title
    }
    title: {
      text: string // "BRD AI Agent Builder" (dynamic, from project name)
      fontSize: number
      bold: boolean
      alignment: "left" | "center" | "right"
      spacingAfter: number // Space between title and subtitle
    }
    subtitle: {
      text: string // "Business Requirements Document (BRD)"
      fontSize: number
      bold: boolean
      alignment: "left" | "center" | "right"
    }
    // Deprecated fields kept for backwards compatibility
    titleSize: number
    subtitleSize: number
    versionSize: number
    metadataTableWidth: number
  }
  tables: {
    headerBackgroundColor: string
    headerTextColor: string
    borderColor: string
    borderWidth: number
    cellPadding: number
    alternateRowColor: string
    tableBorder: string
  }
  pageNumbers: {
    position: "bottom-center" | "bottom-left" | "bottom-right"
    fontSize: number
    startPage: number
  }
}

export const CONVERGENC3_TEMPLATE: Convergenc3TemplateConfig = {
  fonts: {
    primary: "Century Gothic",
    headings: "Century Gothic",
    body: "Century Gothic",
    size: {
      title: 32,
      h1: 14,
      h2: 11,
      h3: 11,
      h4: 11,
      body: 9,
      small: 9,
    },
  },
  colors: {
    primary: "0066CC", // Convergenc3 Corporate Blue
    heading: "#4C94D8",
    text: "333333",
    tableHeader: "0066CC",
    tableBorder: "666666",
    tableAltRow: "F9F9F9",
  },
  spacing: {
    pageMargins: {
      top: 1440,
      right: 1440,
      bottom: 1440,
      left: 1440,
    },
    paragraphBefore: 120,
    paragraphAfter: 120,
    lineHeight: 276,
  },
  logo: {
    width: 180,
    height: 60,
    alignment: "center",
  },
  coverPage: {
    header: {
      projectName: "G20 Knowledge Dashboard",
      version: "[Version 0.1]",
      controlDisclosure: "Control Disclosure",
      fontSize: 11, // Standard body text size for header
      alignment: "right", // Header aligned to top right
      spacing: {
        afterProjectName: 0, // No space, appears on same line or next line
        afterVersion: 0, // No space between version and control disclosure
        afterHeader: 2880, // Large space (~2 inches) between header and logo
      },
    },
    logo: {
      width: 4104, // 285px = 4.104 inches = 5909 twips (exact size from uploaded image)
      height: 4104, // Square logo: 285x285 pixels
      alignment: "center", // Logo centered on page
      spacingAfter: 720, // ~0.5 inch space between logo and title
    },
    title: {
      text: "BRD AI Agent Builder", // Default, overridden by dynamic project name
      fontSize: 24, // Large, bold project title
      bold: true,
      alignment: "center", // Title centered below logo
      spacingAfter: 240, // Small space between title and subtitle
    },
    subtitle: {
      text: "Business Requirements Document (BRD)",
      fontSize: 18, // Slightly smaller than title
      bold: false,
      alignment: "center", // Subtitle centered below title
    },
    // Deprecated fields kept for backwards compatibility
    titleSize: 32,
    subtitleSize: 24,
    versionSize: 20,
    metadataTableWidth: 80,
  },
  tables: {
    headerBackgroundColor: "0066CC",
    headerTextColor: "FFFFFF",
    borderColor: "000000",
    borderWidth: 6,
    cellPadding: 150,
    alternateRowColor: "F9F9F9",
    tableBorder: "#D0D0D0",
  },
  pageNumbers: {
    position: "bottom-center",
    fontSize: 20,
    startPage: 2,
  },
}

// Helper function to convert hex color to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace("#", "")
  return {
    r: Number.parseInt(cleanHex.substring(0, 2), 16),
    g: Number.parseInt(cleanHex.substring(2, 4), 16),
    b: Number.parseInt(cleanHex.substring(4, 6), 16),
  }
}

// Helper function to validate if diagrams exist and are saved
export function validateDiagrams(diagrams: any[]): { valid: boolean; savedDiagrams: any[] } {
  if (!diagrams || diagrams.length === 0) {
    return { valid: true, savedDiagrams: [] }
  }

  // Extract diagrams that have valid code (saved or not)
  const validDiagrams = diagrams.filter((d) => d && d.code && d.code.trim() !== "")

  return {
    valid: true, // Always allow downloads if we have diagrams with code
    savedDiagrams: validDiagrams,
  }
}

export const CONVERGENC3_BRD_PROMPT = `Generate a Convergenc3 BRD by extracting REAL information from the uploaded document. Use South African Rand (R) for currency.

CRITICAL INSTRUCTIONS:
1. Read and analyze the ENTIRE uploaded document carefully.
2. Extract actual project details, stakeholders, requirements, and business problems.
3. Generate user stories based on the REAL capabilities and features described in the document.
4. DO NOT use hardcoded or generic examples - everything must come from the uploaded content.
5. If information is missing, indicate "To be determined during requirements gathering".
6. VERIFICATION: Before outputting, ask yourself: "Is this specific to the uploaded document?" If no, REWRITE it.

STRUCTURE (follow exactly):
## Executive Summary
Extract ONE complete paragraph from the document that summarizes: what the project is, why it exists, the problem it solves, the solution approach, and key benefits. Make this detailed and informative. Keep it under 100 words.

## 1 Governance: Stakeholder List
[Table with real stakeholders from document - if none, note "To be completed during stakeholder engagement"] 4 columns: Name & Surname, Role, Review Type.

## 2 Revision History
[Version 0.1, USE THE EXACT CURRENT DATE FROM THE USER MESSAGE (IT WILL BE PROVIDED IN FORMAT YYYY-MM-DD), real project name from document]
⚠️ CRITICAL: Use ONLY the date explicitly provided in the user message. columns: version, date, author, document name, Summary of changes.

## 3 Supporting Documents
[List any documents referenced in uploaded content - if none, leave empty] columns: Version No, Document Name, Description, Author, Attachment, Location/Link.

## 4 Glossary
[2-column table, alphabetical, 10 REAL terms extracted from document with professional definitions] columns: Term, Definition.

## 5 Business Problem/Opportunity
[2-3 paragraphs extracted from uploaded document describing existing situation] not more 150 words. Problem,Opportunity.


## 6.1 Business Objectives
[Table with 4 REAL objectives extracted from document - format: BO1, BO2, etc.] 3 columns: Objective ID, Objective Description, Key strategic Drivers.


## 7 Scope
### In Scope / Out of Scope
[Real items extracted from document capabilities and exclusions]


## 8 Current State/As-Is
[3-4 paragraphs from document describing current processes]
### 8.1 Business Process Map Diagram
[Diagram inserted separately]

## 9 Future State/To-Be
[3-4 paragraphs from document describing future vision]
### 9.1 Business Process Map Diagram
[Diagram inserted separately]

## 10 Business Requirements
### 10.1 High Level Requirements
Analyze the uploaded document and identify ALL major capabilities. Present them in a table with the following columns:

| ID | User Story | Description | MoSCoW Priority | Business Objective |
|---------------|-----------|-------------|-----------------|-------------------|
| A1 | [Real capability name] | [Detailed description] | Must Have / Should Have / Could Have / Won't Have | BO1, BO2 |
| A2 | [Real capability name] | [Detailed description] | Must Have / Should Have / Could Have / Won't Have | BO1 |

Extract this information from the uploaded document. List ALL capabilities as separate rows.

### 10.2 Business Requirements
MANDATORY: Write a complete section for EVERY user story in 10.1. If you listed 8 user stories, write 8 complete sections. If 10, write 10. NO shortcuts or placeholders allowed.[table with detailed user stories ID & Name, As a( responsible Person ), I want To (action), So That (benefit) ] another Row for impacted Systems.and last 2 rows should be Business Rules ans Business Requirements.

Each user story section must have:
- User Story table
- 7+ Business Rules (numbered 1-7 minimum)
- 8+ Business Requirements (BR A#.1 through BR A#.8 minimum)

#### User Story A1: [Real capability from document]
[Complete table with all columns]

Business Rules:
1. [Real rule from document]
2. [Real rule from document]
3. [Real rule from document]
4. [Real rule from document]
5. [Real rule from document]
6. [Real rule from document]
7. [Real rule from document]

Business Requirements:
BR A1.1: [Real requirement]
BR A1.2: [Real requirement]
BR A1.3: [Real requirement]
BR A1.4: [Real requirement]
BR A1.5: [Real requirement]
BR A1.6: [Real requirement]
BR A1.7: [Real requirement]
BR A1.8: [Real requirement]

#### User Story A2: [Real capability from document]
[Complete table]

Business Rules:
1. [Real rule for A2]
2. [Real rule for A2]
3. [Real rule for A2]
4. [Real rule for A2]
5. [Real rule for A2]
6. [Real rule for A2]
7. [Real rule for A2]

Business Requirements:
BR A2.1: [Real requirement for A2]
BR A2.2: [Real requirement for A2]
BR A2.3: [Real requirement for A2]
BR A2.4: [Real requirement for A2]
BR A2.5: [Real requirement for A2]
BR A2.6: [Real requirement for A2]
BR A2.7: [Real requirement for A2]
BR A2.8: [Real requirement for A2]

#### User Story A3: [Real capability from document]
[Complete table]

Business Rules:
1. [Real rule for A3]
2. [Real rule for A3]
3. [Real rule for A3]
4. [Real rule for A3]
5. [Real rule for A3]
6. [Real rule for A3]
7. [Real rule for A3]

Business Requirements:
BR A3.1: [Real requirement for A3]
BR A3.2: [Real requirement for A3]
BR A3.3: [Real requirement for A3]
BR A3.4: [Real requirement for A3]
BR A3.5: [Real requirement for A3]
BR A3.6: [Real requirement for A3]
BR A3.7: [Real requirement for A3]
BR A3.8: [Real requirement for A3]

#### User Story A4: [Real capability from document]
[Complete table]

Business Rules:
1. [Real rule for A4]
2. [Real rule for A4]
3. [Real rule for A4]
4. [Real rule for A4]
5. [Real rule for A4]
6. [Real rule for A4]
7. [Real rule for A4]

Business Requirements:
BR A4.1: [Real requirement for A4]
BR A4.2: [Real requirement for A4]
BR A4.3: [Real requirement for A4]
BR A4.4: [Real requirement for A4]
BR A4.5: [Real requirement for A4]
BR A4.6: [Real requirement for A4]
BR A4.7: [Real requirement for A4]
BR A4.8: [Real requirement for A4]

#### User Story A5: [Real capability from document]
[Complete table]

Business Rules:
1. [Real rule for A5]
2. [Real rule for A5]
3. [Real rule for A5]
4. [Real rule for A5]
5. [Real rule for A5]
6. [Real rule for A5]
7. [Real rule for A5]

Business Requirements:
BR A5.1: [Real requirement for A5]
BR A5.2: [Real requirement for A5]
BR A5.3: [Real requirement for A5]
BR A5.4: [Real requirement for A5]
BR A5.5: [Real requirement for A5]
BR A5.6: [Real requirement for A5]
BR A5.7: [Real requirement for A5]
BR A5.8: [Real requirement for A5]

#### User Story A6: [Real capability from document]
[Complete table]

Business Rules:
1. [Real rule for A6]
2. [Real rule for A6]
3. [Real rule for A6]
4. [Real rule for A6]
5. [Real rule for A6]
6. [Real rule for A6]
7. [Real rule for A6]

Business Requirements:
BR A6.1: [Real requirement for A6]
BR A6.2: [Real requirement for A6]
BR A6.3: [Real requirement for A6]
BR A6.4: [Real requirement for A6]
BR A6.5: [Real requirement for A6]
BR A6.6: [Real requirement for A6]
BR A6.7: [Real requirement for A6]
BR A6.8: [Real requirement for A6]

#### User Story A7: [Real capability from document]
[Complete table]

Business Rules:
1. [Real rule for A7]
2. [Real rule for A7]
3. [Real rule for A7]
4. [Real rule for A7]
5. [Real rule for A7]
6. [Real rule for A7]
7. [Real rule for A7]

Business Requirements:
BR A7.1: [Real requirement for A7]
BR A7.2: [Real requirement for A7]
BR A7.3: [Real requirement for A7]
BR A7.4: [Real requirement for A7]
BR A7.5: [Real requirement for A7]
BR A7.6: [Real requirement for A7]
BR A7.7: [Real requirement for A7]
BR A7.8: [Real requirement for A7]

#### User Story A8: [Real capability from document]
[Complete table]

Business Rules:
1. [Real rule for A8]
2. [Real rule for A8]
3. [Real rule for A8]
4. [Real rule for A8]
5. [Real rule for A8]
6. [Real rule for A8]
7. [Real rule for A8]

Business Requirements:
BR A8.1: [Real requirement for A8]
BR A8.2: [Real requirement for A8]
BR A8.3: [Real requirement for A8]
BR A8.4: [Real requirement for A8]
BR A8.5: [Real requirement for A8]
BR A8.6: [Real requirement for A8]
BR A8.7: [Real requirement for A8]
BR A8.8: [Real requirement for A8]

If the document describes MORE than 8 capabilities (A9, A10, A11, etc.), you MUST write complete sections for those too using the same format above.

## Appendices
### Appendix A: Reference Materials
[From document]
### Appendix B: Assumptions Log
[From document]
### Appendix C: Risk Register
[Table with risks from document: ID, Description, Impact, Probability, Mitigation, Owner]
### Appendix D: Dependencies
[Table with dependencies from document: ID, Dependency, Type, Impact, Status, Owner]

FINAL CHECK BEFORE SUBMITTING YOUR RESPONSE:
- Did I write a complete detailed section for EVERY user story in 11.1?
- Does each section have a table + 7+ business rules + 8+ requirements?
- Is everything based on the uploaded document, not generic examples?
- Did I avoid ANY placeholder text like "[Continue pattern]" or "[Repeat format]"?
If NO to any question, DO NOT SUBMIT - complete all missing sections first.`
