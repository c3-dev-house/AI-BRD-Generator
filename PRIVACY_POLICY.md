# Privacy Policy - BRD AI Agent Builder

**Effective Date:** January 5, 2026  
**Last Updated:** January 5, 2026  
**Version:** 1.0

---

## 1. Introduction

This Privacy Policy explains how the BRD AI Agent Builder ("the System", "we", "our") handles your data when you use our Business Requirements Document generation service. We are committed to protecting your privacy and ensuring transparency about our data practices.

**Key Commitment:** We do NOT store, save, or retain your uploaded documents after processing is complete.

---

## 2. Information We Collect

### 2.1 Documents You Upload

**What We Process:**
- PDF files
- Microsoft Word documents (.docx)
- PowerPoint presentations (.pptx)
- Text files (.txt)
- Up to 5 documents simultaneously

**What We Do With Uploaded Documents:**
- ✅ Extract text content for BRD generation
- ✅ Process content through OpenAI GPT-4o API
- ✅ Generate Business Requirements Documents
- ✅ Create process diagrams
- ❌ **WE DO NOT STORE YOUR UPLOADED DOCUMENTS**
- ❌ **WE DO NOT SAVE EXTRACTED TEXT TO PERMANENT STORAGE**
- ❌ **WE DO NOT USE YOUR DOCUMENTS FOR AI TRAINING**

### 2.2 Temporary Processing Data

During active processing, we temporarily hold:
- Extracted text content (in memory only)
- Generated BRD content (in memory only)
- Process diagrams (temporarily cached for download)

**Retention Period:** This data is held ONLY during your active session and is deleted immediately after:
- You download your BRD document, OR
- You close your browser session, OR
- 24 hours of inactivity (whichever comes first)

### 2.3 Optional RAG (Retrieval-Augmented Generation) Data

If you choose to use the optional RAG feature:
- ✅ We create vector embeddings of template guidance documents
- ✅ Embeddings are stored in MongoDB Atlas for retrieval
- ❌ **YOUR UPLOADED DOCUMENTS ARE NEVER ADDED TO RAG DATABASE**
- ❌ Only pre-approved Convergenc3 template guidance is vectorized

### 2.4 System Logs & Metadata

We collect minimal system logs for debugging and performance monitoring:
- File upload timestamps (not content)
- API request/response times
- Error logs (sanitized, no document content)
- User session IDs (anonymized)

**Retention Period:** System logs are retained for 30 days for debugging purposes, then permanently deleted.

---

## 3. How We Process Your Data

### 3.1 Document Extraction Pipeline

```
[Your Document] → [Temporary Memory] → [Text Extraction] → [AI Processing] → [BRD Generated] → [Download] → [Data Deleted]
```

**Step-by-Step:**
1. **Upload:** Document uploaded via HTTPS encrypted connection
2. **Extraction:** Text extracted using specialized libraries (pdfjs-dist, mammoth, PizZip)
3. **Memory Storage:** Extracted text stored in server memory (RAM) only
4. **AI Processing:** Text sent to OpenAI GPT-4o API for BRD generation
5. **Document Generation:** DOCX/PDF created in memory
6. **Download:** You receive your BRD document
7. **Deletion:** ALL data immediately cleared from memory

**No Disk Storage:** Your uploaded documents are NEVER written to disk, databases, or permanent storage.

### 3.2 Third-Party Data Processing

We use the following third-party services:

#### OpenAI (GPT-4o)
- **Purpose:** Generate BRD content from extracted text
- **Data Sent:** Extracted text content (not original files)
- **OpenAI Policy:** As per OpenAI's API Terms (May 2024), API data is NOT used for training
- **Retention:** OpenAI may retain data for 30 days for abuse monitoring, then deleted
- **More Info:** https://openai.com/enterprise-privacy

#### MongoDB Atlas (Optional RAG Only)
- **Purpose:** Store vector embeddings of template guidance
- **Data Sent:** Pre-approved template documents only (NOT your uploads)
- **Your Documents:** NEVER sent to MongoDB
- **Security:** Data encrypted at rest and in transit (TLS 1.2+)

#### Mermaid.ink
- **Purpose:** Render process diagrams as PNG images
- **Data Sent:** Mermaid diagram syntax (generic BPMN notation, no sensitive data)
- **Retention:** Cached temporarily, cleared within 24 hours

#### Vercel Platform
- **Purpose:** Application hosting and deployment
- **Data Processing:** All processing occurs on Vercel serverless functions
- **Logs:** Anonymized function logs retained for 7 days
- **More Info:** https://vercel.com/legal/privacy-policy

---

## 4. Data Security Measures

### 4.1 Encryption

- **In Transit:** All data transmitted via HTTPS/TLS 1.3 encryption
- **At Rest:** No persistent storage of uploaded documents (N/A)
- **API Calls:** Encrypted connections to OpenAI, MongoDB, Mermaid.ink

### 4.2 Access Controls

- **No User Accounts:** System does not require login or user accounts
- **Session-Based:** Each session is isolated and anonymous
- **No Admin Access:** No administrators can access your uploaded documents
- **Ephemeral Processing:** All processing occurs in stateless serverless functions

### 4.3 Security Best Practices

- Input validation and sanitization for all uploads
- File type verification (PDF, DOCX, PPTX, TXT only)
- File size limits (50MB per file, 250MB total)
- Rate limiting to prevent abuse
- CORS policies to prevent unauthorized access
- Content Security Policy (CSP) headers

---

## 5. Data Retention Summary

| Data Type | Retention Period | Storage Location |
|-----------|------------------|------------------|
| **Uploaded Documents** | **DELETED IMMEDIATELY AFTER PROCESSING** | **In-memory only (RAM)** |
| **Extracted Text** | **Session duration only (max 24 hours)** | **In-memory only (RAM)** |
| **Generated BRD** | **Session duration only (until download)** | **In-memory only (RAM)** |
| Process Diagrams | Cached for download (24 hours max) | Temporary cache |
| System Logs | 30 days | Vercel logging system |
| RAG Template Vectors | Permanent (template guidance only) | MongoDB Atlas |
| Session Metadata | 24 hours | In-memory session store |

---

## 6. Your Rights

### 6.1 Right to Data Deletion

Since we do NOT store your uploaded documents, there is no persistent data to delete. However:
- You can clear your browser cache to remove any local session data
- Contact us to request deletion of system logs mentioning your session ID

### 6.2 Right to Access

As we do not retain your uploaded documents or extracted content, there is no data to access after your session ends.

### 6.3 Right to Opt-Out

- **RAG Feature:** You can choose to skip the optional RAG search step
- **Analytics:** No analytics or tracking cookies are used
- **Third-Party Processing:** By using the system, you consent to OpenAI processing your extracted text for BRD generation

### 6.4 Right to Withdraw Consent

- You can withdraw consent at any time by closing your browser session
- All data will be immediately cleared from memory

---

## 7. Compliance

### 7.1 GDPR (General Data Protection Regulation)

We comply with GDPR principles:
- **Data Minimization:** We collect only essential data for BRD generation
- **Purpose Limitation:** Data used solely for document generation
- **Storage Limitation:** No long-term storage of personal data
- **Integrity & Confidentiality:** Encrypted connections and secure processing

### 7.2 POPIA (Protection of Personal Information Act - South Africa)

As a system designed for South African consulting firm Convergenc3:
- We process data lawfully and transparently
- We do not store personal information unnecessarily
- We ensure data subject rights are respected
- We implement appropriate security measures

### 7.3 CCPA (California Consumer Privacy Act)

For users in California:
- We do NOT sell your data
- We do NOT share your documents with third parties for marketing
- You have the right to know what data we process (see Section 2)

---

## 8. Cookies & Tracking

**We do NOT use cookies for tracking or analytics.**

The only cookies used are:
- **Session Cookie:** Temporary cookie to maintain your workflow state (deleted when browser closes)
- **No Tracking:** No Google Analytics, Facebook Pixel, or other tracking technologies

---

## 9. Children's Privacy

This system is designed for business professionals and is not intended for use by individuals under 18 years of age. We do not knowingly collect data from children.

---

## 10. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date. Continued use of the system after changes constitutes acceptance of the updated policy.

---

## 11. Contact Information

If you have questions or concerns about this Privacy Policy or our data practices:

**Email:** privacy@convergenc3.co.za  
**Support:** support@convergenc3.co.za  
**Website:** https://convergenc3.co.za

---

## 12. Data Processing Agreement (DPA)

For enterprise customers requiring a formal Data Processing Agreement (DPA) for compliance purposes, please contact us at legal@convergenc3.co.za.

---

## 13. Summary: What You Should Know

✅ **Your documents are NEVER saved to our servers**  
✅ **All processing happens in temporary memory only**  
✅ **Data is deleted immediately after you download your BRD**  
✅ **We use encrypted connections for all data transfer**  
✅ **OpenAI does not use your data for AI training (API policy)**  
✅ **You can use the system anonymously (no login required)**  
✅ **We comply with GDPR, POPIA, and CCPA regulations**  

❌ **We do NOT store your uploaded documents**  
❌ **We do NOT use your content for training AI models**  
❌ **We do NOT share your documents with third parties**  
❌ **We do NOT track you with analytics or advertising cookies**  

---

**By using the BRD AI Agent Builder, you acknowledge that you have read and understood this Privacy Policy and consent to the data processing practices described herein.**

---

*This Privacy Policy is effective as of January 5, 2026 and applies to all users of the BRD AI Agent Builder system.*
