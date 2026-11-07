import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

// 1. Audit requirements text using Gemini 2.5 Flash
resolver.define('auditRequirement', async (req) => {
  const { text } = req.payload;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }

  const systemInstruction = `
You are ForgeClarify, an elite Agile & Systems Architecture Auditor.
Audit the provided requirement text. Identify:
1. Ambiguities & edge cases.
2. Architecture risks and non-functional requirements (security, auth, latency, rate limits).
3. Generate structured Jira Backlog items (User Stories with Gherkin Acceptance Criteria, Architecture Spike tickets, Security tasks).

Return strictly JSON matching this structure:
{
  "summary": "Brief executive summary of findings",
  "readinessScore": 72,
  "ambiguities": ["Item 1", "Item 2"],
  "architectureRisks": ["Risk 1", "Risk 2"],
  "suggestedTickets": [
    {
      "summary": "Short title",
      "issueType": "Story",
      "description": "User story details with Given/When/Then acceptance criteria"
    },
    {
      "summary": "Investigate Payment Gateway webhook reliability & replay attacks",
      "issueType": "Task",
      "description": "Technical spike to establish idempotency keys and error retry mechanisms."
    }
  ]
}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

  const response = await api.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `Requirement text to audit:\n${text}` }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const result = await response.json();
  const rawJson = result.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(rawJson);
});

// 2. Export validated items directly into Jira project (SCRUM)
resolver.define('createJiraIssue', async (req) => {
  const { projectKey = 'SCRUM', summary, description, issueType = 'Story' } = req.payload;

  const payload = {
    fields: {
      project: { key: projectKey },
      summary: summary,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: description }]
          }
        ]
      },
      issuetype: { name: issueType }
    }
  };

  const response = await api.asApp().requestJira(route`/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to create Jira ticket: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return { key: data.key, id: data.id };
});

export const handler = resolver.getDefinitions();