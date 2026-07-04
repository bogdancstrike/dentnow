import { useState, useCallback } from 'react';
import config from '../config';
import { quizQuestions } from '../data/content';
import './ScorIgiena.css';

export default function ScorIgiena() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);

  const select = useCallback((idx) => {
    const next = [...answers];
    next[step] = idx;
    setAnswers(next);
  }, [step, answers]);

  const goNext = () => { setStep(step + 1); };
  const goBack = () => setStep(step - 1);
  const restart = () => { setAnswers([]); setStep(0); };

  const isQuiz = step < quizQuestions.length;

  return (
    <div className="quiz-page">
      {/* Compact inline header */}
      <div className="quiz-hero">
        <div className="quiz-hero-inner">
          <div className="quiz-hero-left">
            <span className="quiz-hero-icon">🦷</span>
            <div>
              <h1 className="quiz-hero-title">Scor Igienă Orală</h1>
              <p className="quiz-hero-sub">7 întrebări rapide · rezultat personalizat</p>
            </div>
          </div>
          {isQuiz && (
            <div className="quiz-hero-progress">
              <span className="quiz-hero-step">{step + 1} / {quizQuestions.length}</span>
              <div className="quiz-hero-bar">
                <div className="quiz-hero-bar-fill" style={{ width: `${((step) / quizQuestions.length) * 100}%` }} />
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
              <h2 className="qc-question">{step + 1}. {quizQuestions[step].q}</h2>
              <div className="qc-options">
                {quizQuestions[step].opts.map((o, i) => (
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
                  {step === quizQuestions.length - 1 ? 'Vezi rezultatul →' : 'Continuă →'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <QuizResult answers={answers} questions={quizQuestions} onRestart={restart} />
        )}
      </div>
    </div>
  );
}

function QuizResult({ answers, questions, onRestart }) {
  const total = answers.reduce((sum, ai, qi) => sum + questions[qi].opts[ai][1], 0);
  const max = questions.length * 5;
  const pct = Math.round((total / max) * 100);

  let emoji, title, desc, color, tips;
  if (pct >= 85) {
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
    tips = ['Sună ACUM la ' + config.phoneDisplay, 'Pachet consultație + igienizare: 350 lei', 'Periuță electrică + irigator oral — esențiale'];
  }

  const circumference = 2 * Math.PI * 54;
  const dash = (pct / 100) * circumference;

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
        <a href={`tel:${config.phone}`} className="btn btn-dark">Sună acum: {config.phoneDisplay}</a>
        <button className="btn btn-outline" onClick={onRestart}>↺ Reia testul</button>
      </div>
    </div>
  );
}
