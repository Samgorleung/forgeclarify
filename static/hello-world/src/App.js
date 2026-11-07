import React, { useEffect, useState } from 'react';
import { invoke, view } from '@forge/bridge';

function App() {
  const [contextText, setContextText] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [createdTickets, setCreatedTickets] = useState({});
  const [creatingTicket, setCreatingTicket] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    view.getContext()
      .then((ctx) => {
        const selected =
          ctx?.extension?.selection?.text ||
          ctx?.extension?.selectedText ||
          (typeof ctx?.extension?.selection === 'string' ? ctx.extension.selection : '') ||
          '';

        if (selected) {
          setContextText(selected);
        }
      })
      .catch((err) => {
        console.error('Error fetching context:', err);
      });
  }, []);

  const runAudit = async () => {
    if (!contextText || !contextText.trim()) {
      setError('Please provide or highlight requirement text first.');
      return;
    }

    setLoading(true);
    setError(null);
    setAuditData(null);

    try {
      const result = await invoke('auditRequirement', { text: contextText });
      setAuditData(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Audit request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (index, ticket) => {
    setCreatingTicket((prev) => ({ ...prev, [index]: true }));
    try {
      const res = await invoke('createJiraIssue', {
        projectKey: 'SCRUM',
        summary: ticket.summary,
        description: ticket.description,
        issueType: ticket.issueType || 'Story'
      });
      setCreatedTickets((prev) => ({ ...prev, [index]: res.key }));
    } catch (err) {
      alert('Error creating ticket: ' + (err.message || err));
    } finally {
      setCreatingTicket((prev) => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', padding: '16px', color: '#172B4D', fontSize: '13px', maxHeight: '85vh', overflowY: 'auto' }}>
      <div style={{ borderBottom: '2px solid #0052CC', paddingBottom: '8px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0052CC', fontSize: '18px' }}>ForgeClarify</h2>
          <span style={{ color: '#6B778C', fontSize: '11px' }}>AI Systems Architecture & Spec Auditor</span>
        </div>
        {auditData && auditData.readinessScore !== undefined && (
          <div style={{
            background: auditData.readinessScore >= 70 ? '#E3FCEF' : '#FFEBE6',
            color: auditData.readinessScore >= 70 ? '#006644' : '#BF2600',
            padding: '4px 8px',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '12px'
          }}>
            Score: {auditData.readinessScore}/100
          </div>
        )}
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
          Requirement Spec:
        </label>
        <textarea
          rows={5}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #DFE1E6',
            fontSize: '12px'
          }}
          placeholder="Paste or edit requirement spec..."
          value={contextText}
          onChange={(e) => setContextText(e.target.value)}
        />
        <div style={{ marginTop: '8px' }}>
          <button
            disabled={loading}
            onClick={runAudit}
            style={{
              padding: '6px 16px',
              background: loading ? '#A5B2C6' : '#0052CC',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            {loading ? 'Auditing with Gemini 3.8 Flash...' : 'Run Audit'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FFEBE6', color: '#BF2600', padding: '10px', borderRadius: '4px', marginBottom: '14px' }}>
          <strong>Error: </strong>{error}
        </div>
      )}

      {auditData && (
        <div>
          <div style={{ background: '#F4F5F7', padding: '10px', borderRadius: '4px', marginBottom: '12px' }}>
            <strong>Summary: </strong>{auditData.summary}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1, background: '#FFF0B3', padding: '10px', borderRadius: '4px' }}>
              <strong style={{ color: '#172B4D' }}>Ambiguities & Gaps:</strong>
              <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
                {auditData.ambiguities && auditData.ambiguities.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
                ))}
              </ul>
            </div>
            <div style={{ flex: 1, background: '#FFEBE6', padding: '10px', borderRadius: '4px' }}>
              <strong style={{ color: '#BF2600' }}>Architecture Risks:</strong>
              <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
                {auditData.architectureRisks && auditData.architectureRisks.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <h3 style={{ fontSize: '14px', margin: '14px 0 8px 0' }}>Generated Jira Tickets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {auditData.suggestedTickets && auditData.suggestedTickets.map((ticket, idx) => (
              <div key={idx} style={{ border: '1px solid #DFE1E6', borderRadius: '4px', padding: '10px', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>[{ticket.issueType || 'Story'}] {ticket.summary}</span>
                  {createdTickets[idx] ? (
                    <span style={{ color: '#006644', fontWeight: 'bold' }}>Created: {createdTickets[idx]}</span>
                  ) : (
                    <button
                      disabled={Boolean(creatingTicket[idx])}
                      onClick={() => handleCreateTicket(idx, ticket)}
                      style={{
                        padding: '4px 10px',
                        background: '#0052CC',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      {creatingTicket[idx] ? 'Exporting...' : 'Create in Jira'}
                    </button>
                  )}
                </div>
                <p style={{ margin: '6px 0 0 0', color: '#5E6C84', fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                  {ticket.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;