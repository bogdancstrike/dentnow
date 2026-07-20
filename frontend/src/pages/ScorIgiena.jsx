import { useState, useCallback } from 'react';
import { quizQuestions } from '../data/content';
import { buildWhatsAppLeadUrl } from '../lib/leadCapture';
import { useClinicPicker } from '../hooks/useClinicPicker';
import Seo from '../components/seo/Seo';
import './ScorIgiena.css';
import { usePreviewDraft } from '../api/previewDraft';
import { useSiteData } from '../public-site/SiteDataProvider';
import { siteLink } from '../lib/siteContent';

export default function ScorIgiena() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const quizDraft = usePreviewDraft('quiz');
  const { quiz, links } = useSiteData();
  const leadPhone = siteLink(links, 'phone')?.value || '';
  const questions = quiz?.questions?.length
    ? quiz.questions.map((question) => ({
        q: question.prompt,
        opts: question.options.map((option) => [option.label, option.score, '🦷']),
      }))
    : quizQuestions;

  const select = useCallback((idx) => {
    const next = [...answers];
    next[step] = idx;
    setAnswers(next);
  }, [step, answers]);

  const goNext = () => { setStep(step + 1); };
  const goBack = () => setStep(step - 1);
  const restart = () => { setAnswers([]); setStep(0); };

  const isQuiz = step < questions.length;

  return (
    <div className="quiz-page">
      <Seo title="Scor Igiena Orala DentNow" description="Test rapid DentNow pentru igiena orala si recomandari personalizate." path="/scor-igiena" />
      {/* Compact inline header */}
      <div className="quiz-hero">
        <div className="quiz-hero-inner">
          <div className="quiz-hero-left">
            <span className="quiz-hero-icon">🦷</span>
            <div>
              <h1 className="quiz-hero-title">{quizDraft?.title || quiz?.title || 'Scor Igienă Orală'}</h1>
              <p className="quiz-hero-sub">{quizDraft?.intro || quiz?.intro || `${questions.length} întrebări rapide · rezultat personalizat`}</p>
            </div>
          </div>
          {isQuiz && (
            <div className="quiz-hero-progress">
              <span className="quiz-hero-step">{step + 1} / {questions.length}</span>
              <div className="quiz-hero-bar">
                <div className="quiz-hero-bar-fill" style={{ width: `${((step) / questions.length) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quiz content */}
      <div className="quiz-content">
        {isQuiz ? (
          <div className="quiz-card" key={step}>
            <div className="quiz-card-inner">
              <h2 className="qc-question">{step + 1}. {questions[step].q}</h2>
              <div className="qc-options">
                {questions[step].opts.map((o, i) => (
                  <button key={i} className={`qc-opt${answers[step] === i ? ' selected' : ''}`} onClick={() => select(i)}>
                    <span className="qc-opt-emoji">{o[2]}</span>
                    <span className="qc-opt-text">{o[0]}</span>
                    {answers[step] === i && <span className="qc-opt-check">✓</span>}
                  </button>
                ))}
              </div>
              <div className="qc-nav">
                {step > 0 ? <button className="qc-back" onClick={goBack}>← Înapoi</button> : <div />}
                <button className="qc-next" disabled={answers[step] === undefined} onClick={goNext}>
                  {step === questions.length - 1 ? 'Vezi rezultatul →' : 'Continuă →'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <QuizResult answers={answers} questions={questions} bands={quiz?.result_bands || []} leadPhone={leadPhone} onRestart={restart} />
        )}
      </div>
    </div>
  );
}

function QuizResult({ answers, questions, bands, leadPhone, onRestart }) {
  const openPicker = useClinicPicker();
  const total = answers.reduce((sum, ai, qi) => sum + questions[qi].opts[ai][1], 0);
  const max = Math.max(1, questions.reduce((sum, question) => (
    sum + Math.max(0, ...question.opts.map((option) => Number(option[1]) || 0))
  ), 0));
  const pct = Math.round((total / max) * 100);

  let emoji, title, desc, color, tips;
  const configuredBand = bands.find((band) => total >= band.min_score && total <= band.max_score);
  if (configuredBand) {
    emoji = pct >= 85 ? '🏆' : pct >= 65 ? '👍' : pct >= 40 ? '⚠️' : '🦷';
    title = configuredBand.title;
    desc = configuredBand.description || 'Rezultatul tău a fost calculat pe baza răspunsurilor.';
    color = pct >= 65 ? 'var(--accent)' : 'var(--orange)';
    tips = (configuredBand.recommendations || '')
      .split(/\r?\n|;/)
      .map((tip) => tip.trim())
      .filter(Boolean);
    if (tips.length === 0) tips = ['Discută rezultatul cu echipa DentNow.'];
  } else if (pct >= 85) {
    emoji = '🏆'; title = 'Excelent!'; color = '#1a7a3a';
    desc = 'Ai o igienă orală remarcabilă. Continuă rutina actuală.';
    tips = ['Continuă periajul de 2-3 ori/zi + ață dentară zilnic', 'Igienizare GBT la 6-12 luni ca mentenanță', 'Atenție la alimentele care colorează dinții'];
  } else if (pct >= 65) {
    emoji = '👍'; title = 'Bine, dar poți mai mult!'; color = 'var(--accent)';
    desc = 'Igienă bună cu aspecte de îmbunătățit.';
    tips = ['Adaugă ața dentară sau irigatorul oral zilnic', 'Fă o igienizare profesională GBT — 320 lei', 'Prelungește periajul la minimum 2 minute'];
  } else if (pct >= 40) {
    emoji = '⚠️'; title = 'Necesită îmbunătățiri'; color = 'var(--orange)';
    desc = 'Riscuri crescute de carii și gingivită.';
    tips = ['Programează urgent o igienizare GBT (320 lei)', 'Investește într-o periuță electrică', 'Începe ața dentară zilnic — 2 minute seara'];
  } else {
    emoji = '🚨'; title = 'Acționează urgent!'; color = 'var(--red)';
    desc = 'Necesită intervenție medicală imediată.';
    tips = ['Contactează echipa pentru o evaluare', 'Discută opțiunile potrivite situației tale', 'Stabilește împreună cu medicul următorii pași'];
  }

  const circumference = 2 * Math.PI * 54;
  const dash = (pct / 100) * circumference;

  const waUrl = buildWhatsAppLeadUrl({ source: 'scor igiena', service: 'Igienizare GBT', score: `${pct}% - ${title}`, message: tips.join('; ') }, leadPhone);

  return (
    <div className="quiz-result">
      <div className="qr-top">
        <div className="qr-ring">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--light)" strokeWidth="8" />
            <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8"
              strokeDasharray={`${dash} ${circumference}`} strokeDashoffset={circumference / 4}
              strokeLinecap="round" transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 1.2s ease' }} />
          </svg>
          <div className="qr-ring-inner">
            <span className="qr-pct" style={{ color }}>{pct}%</span>
          </div>
        </div>
        <div className="qr-summary">
          <span className="qr-emoji">{emoji}</span>
          <h2 className="qr-title">{title}</h2>
          <p className="qr-desc">{desc}</p>
        </div>
      </div>

      <div className="qr-tips">
        <h3 className="qr-tips-title">Recomandări DentNow</h3>
        {tips.map((t, i) => <div key={i} className="qr-tip">→ {t}</div>)}
      </div>

      <div className="qr-actions">
        <button type="button" onClick={() => openPicker('call')} className="btn btn-dark">Suna acum</button>
        {waUrl && <a className="btn btn-outline" href={waUrl} target="_blank" rel="noopener noreferrer">Trimite scorul pe WhatsApp</a>}
        <button className="btn btn-outline" onClick={onRestart}>Reia testul</button>
      </div>
    </div>
  );
}
