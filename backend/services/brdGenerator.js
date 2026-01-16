import { openai, AI_MODEL } from '../config/openai.js';

/**
 * Generate a comprehensive Business Requirements Document using OpenAI
 */
export const generateBRD = async (extractedText, topic) => {
  try {
    const prompt = `You are a senior Business Analyst specializing in enterprise system design.

Your task:
1. Read and analyze the full document content provided below.
2. Understand the business context, user requirements, goals, constraints, processes, problems, actors, and any implicit information.
3. Extract hidden meaning, assumptions, and business objectives, even if not explicitly stated.
4. Identify gaps and fill them using logical business reasoning and domain knowledge.
5. Convert all insights into a complete, professional Business Requirements Document (BRD).

IMPORTANT:
- Base your BRD primarily on the content of the uploaded document.
- Only use external business knowledge to fill missing gaps or clarify incomplete details.
- Do NOT invent unrealistic features or irrelevant details.
- Maintain strict alignment with the document's topic, tone, and intended purpose.

=====================
DOCUMENT TO ANALYZE:
${extractedText}
=====================

Now produce a full Business Requirements Document (BRD) with the following structure:

1. **Executive Summary**
   - Clear, concise overview of the business problem, objectives, and expected outcome.

2. **Business Background**
   - Context derived from the document.
   - Industry relevance.
   - Why this project exists.

3. **Business Problem Statement**
   - All problems extracted from the document.
   - Root causes.
   - Impacts on users, stakeholders, and operations.

4. **Goals & Objectives**
   - Derived directly from the document.
   - SMART goals.
   - Success metrics.

5. **Scope**
   - In-scope items.
   - Out-of-scope items.
   - Major boundaries/constraints from the document.

6. **Stakeholders & Actors**
   - End users.
   - Departments.
   - Internal/external roles.
   - Actor descriptions.

7. **Functional Requirements**
   - Feature-by-feature breakdown based on document analysis.
   - Each requirement must include:
     * ID (FR-001, FR-002)
     * Name
     * Description
     * Business justification
     * Acceptance criteria

8. **Non-Functional Requirements (NFRs)**
   - Performance
   - Security
   - Reliability
   - Usability
   - Scalability
   - Compliance (if applicable)

9. **Business Process Flow**
   - Describe how users interact with the system.
   - Derive workflow from document context.

10. **Assumptions**
    - Assumptions pulled from the document + logical reasoning.

11. **Constraints**
    - Technical or business limitations.

12. **Risks**
    - Risks directly or indirectly mentioned in the document.

13. **Dependencies**
    - Internal or external dependencies.

14. **Timeline / High-Level Roadmap**
    - Phases and milestones appropriate for the project type.

15. **Appendix**
    - Additional notes extracted from the document.

Ensure the BRD is:
- Formal and enterprise-grade
- Well-structured
- Clear and easy to understand
- Based deeply on the provided document
- Professional enough to present to executives and stakeholders`;

    console.log(`Calling OpenAI API with model: ${AI_MODEL}`);
    
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a senior Business Analyst specializing in enterprise system design. You excel at analyzing documents, extracting business requirements, identifying hidden assumptions, and producing comprehensive, professional Business Requirements Documents that are ready for executive presentation.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });
    
    const brdContent = response.choices[0].message.content;
    
    if (!brdContent || brdContent.trim().length < 100) {
      throw new Error('Generated BRD content is too short or empty');
    }
    
    console.log(`BRD generated successfully (${brdContent.length} characters)`);
    
    return {
      content: brdContent,
      model: AI_MODEL,
      tokensUsed: response.usage?.total_tokens || 0,
      topic
    };
    
  } catch (error) {
    if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded. Please check your API key and billing.');
    }
    if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key. Please check your configuration.');
    }
    throw new Error(`BRD generation failed: ${error.message}`);
  }
};
