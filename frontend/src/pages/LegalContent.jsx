import config from '../config';
import { legalContent as content } from '../data/legal';
import { usePreviewDraft } from '../api/previewDraft';

function renderParagraphs(section) {
  const paragraphs = section.paragraphs || (section.text ? [section.text] : []);

  if (section.title.startsWith('9. Contact') || section.title.startsWith('7. Drepturi') || section.title.startsWith('12. Contact')) {
      const emailText = paragraphs.find(p => p.includes('email') && !p.includes('telefonie'));
      if (emailText) {
          return paragraphs.map((paragraph) => {
              if (paragraph.includes('email-ul') || paragraph.includes('email')) {
                  const p = paragraph.replace('email-ul sau telefoanele afișate pe site.', `${config.email} sau la ${config.phones.map((p) => `${p.display} (${p.label})`).join(', ')}.`)
                                     .replace('email-ul de contact.', `${config.email}.`)
                                     .replace('email sau la telefoanele clinicii.', `${config.email} sau la ${config.phones.map((p) => `${p.display} (${p.label})`).join(', ')}.`);
                  return <p key={paragraph}>{p}</p>;
              }
              return <p key={paragraph}>{paragraph}</p>;
          });
      }
  }

  return paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>);
}

export default function LegalContent({ type = 'gdpr' }) {
  const legalDraft = usePreviewDraft('legal-document');
  const draftMatches = legalDraft && (
    legalDraft.doc_type === type || (type === 'privacy' && legalDraft.doc_type === 'privacy')
  );
  if (draftMatches && legalDraft.body_html) {
    return <section className="legal-section" dangerouslySetInnerHTML={{ __html: legalDraft.body_html }} />;
  }
  return (
    <>
      {(content[type] || content.gdpr).map((s) => (
        <section key={s.title} className="legal-section">
          <h2>{s.title}</h2>
          {renderParagraphs(s)}
          {s.list && <ul>{s.list.map((l) => <li key={l}>{l}</li>)}</ul>}
        </section>
      ))}
    </>
  );
}
