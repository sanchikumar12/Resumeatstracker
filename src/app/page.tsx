'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sanchit7295-ats-checker-backend.hf.space';

const CarbonAd = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear inner HTML to prevent duplicate script loading on state changes
    containerRef.current.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = '//cdn.carbonads.com/carbon.js?serve=CE7DKK7U&placement=resuscoreai';
    script.id = '_carbonads_js';
    script.async = true;
    
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="carbon-ad-box">
      <div ref={containerRef} />
    </div>
  );
};

export default function Home() {
  // Navigation & Step State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loadingStep, setLoadingStep] = useState<0 | 1 | 2 | 3>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [previewText, setPreviewText] = useState<string>('');
  const [extractionQuality, setExtractionQuality] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  
  // Job Description State
  const [jdText, setJdText] = useState<string>('');
  
  // Scoring & Report State
  const [reportData, setReportData] = useState<any>(null);
  const [abPrice, setAbPrice] = useState<string>('$1.99');
  const [isCheckingPayment, setIsCheckingPayment] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check URL parameters for successful checkout return
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlSessionId = searchParams.get('session_id');
    const urlPaid = searchParams.get('paid');

    if (urlSessionId && urlPaid === 'true') {
      setSessionId(urlSessionId);
      setPaymentSuccess(true);
      fetchUnlockedReport(urlSessionId);
    }
  }, []);

  // Fetch the full unlocked report
  const fetchUnlockedReport = async (sessId: string) => {
    setIsCheckingPayment(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/scan/${sessId}/report`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
        setStep(4);
      } else {
        // Fallback: If 402 is returned, it means webhook hasn't processed or payment failed
        const data = await res.json();
        setReportData(data);
        setStep(4);
        setErrorMsg('We are still verifying your payment. Click "Refresh Report" if it does not unlock automatically.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to check payment status.');
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndProcessFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      validateAndProcessFile(selectedFile);
    }
  };

  // Validate file size and type (US-1 AC1)
  const validateAndProcessFile = async (selectedFile: File) => {
    setErrorMsg('');
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setErrorMsg('Error: Please upload a PDF file only.');
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMsg('Error: File size exceeds the 5MB limit. Please upload a smaller file.');
      return;
    }

    setFile(selectedFile);
    await uploadResumeFile(selectedFile);
  };

  // Upload file to backend and get preview (US-1 AC2)
  const uploadResumeFile = async (resumeFile: File) => {
    setIsUploading(true);
    setErrorMsg('');
    
    const formData = new FormData();
    formData.append('file', resumeFile);
    
    try {
      const res = await fetch(`${API_BASE}/api/v1/scan/upload-resume`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to upload and parse resume.');
      }

      const data = await res.json();
      setSessionId(data.session_id);
      setExtractionQuality(data.extraction_quality);
      setPreviewText(data.preview_text_snippet);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during resume parsing.');
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Run the detailed scoring animation (US-2 AC2)
  const handleAnalyze = () => {
    if (jdText.trim().length < 100) {
      setErrorMsg('Error: Job description must be at least 100 characters to perform accurate matching.');
      return;
    }

    setErrorMsg('');
    setStep(3); // Go to loading timeline screen
    setLoadingStep(0);

    // Simulate multi-stage visual steps for authenticity
    const stepTimes = [1500, 1500, 1500, 1500];
    
    setTimeout(() => {
      setLoadingStep(1);
      setTimeout(() => {
        setLoadingStep(2);
        setTimeout(() => {
          setLoadingStep(3);
          setTimeout(() => {
            // Trigger actual analysis after timeline animation completes
            submitAnalysis();
          }, stepTimes[3]);
        }, stepTimes[2]);
      }, stepTimes[1]);
    }, stepTimes[0]);
  };

  const submitAnalysis = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/scan/${sessionId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jd_text: jdText }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Scoring analysis failed.');
      }

      const data = await res.json();
      setReportData(data);
      setStep(4);
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis failed. Please try again.');
      setStep(2);
    }
  };

  // Checkout redirect handling (US-4 AC1) - Now free!
  const handleCheckout = async () => {
    setErrorMsg('');
    setIsCheckingPayment(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/scan/${sessionId}/unlock-free`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        throw new Error('Unlock generation failed.');
      }
      
      await fetchUnlockedReport(sessionId);
    } catch (err) {
      setErrorMsg('Failed to unlock the report. Please try again.');
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const resetScanner = () => {
    setFile(null);
    setPreviewText('');
    setExtractionQuality(null);
    setSessionId('');
    setJdText('');
    setReportData(null);
    setErrorMsg('');
    setPaymentSuccess(false);
    setStep(1);
    
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo" onClick={resetScanner} style={{ cursor: 'pointer' }}>
          <span className="logo-icon"></span>
          <span>ResuScore.ai</span>
        </div>
        <nav>
          <button className="btn btn-secondary" onClick={resetScanner}>
            New Scan
          </button>
        </nav>
      </header>

      <main>
        {errorMsg && <div className="alert">{errorMsg}</div>}

        {/* SCREEN 1: UPLOAD RESUME */}
        {step === 1 && (
          <div className="hero-section">
            <h1 className="hero-title">Audit Your Resume Against Any Job Posting</h1>
            <p className="hero-subtitle">
              Diagnose content mismatch, parser-breaking layouts, and get actionable suggestions in under 60 seconds.
            </p>

            <div className="card">
              <div 
                className={`dropzone-container ${isDragOver ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".pdf" 
                  style={{ display: 'none' }} 
                />
                <div className="dropzone-icon">
                  {isUploading ? '⌛' : '📄'}
                </div>
                <div>
                  <h3 style={{ marginBottom: '0.5rem' }}>
                    {isUploading ? 'Parsing Resume Text...' : 'Upload your resume PDF'}
                  </h3>
                  <p style={{ fontSize: '0.9rem' }}>
                    Drag & drop or click to browse (PDF only, max 5MB)
                  </p>
                </div>
              </div>

              {file && !isUploading && (
                <div className="preview-box">
                  <div className="preview-header">
                    <span className="preview-title">✓ {file.name}</span>
                    {extractionQuality !== null && (
                      <span className="preview-meta">
                        Extraction Quality: {extractionQuality}%
                      </span>
                    )}
                  </div>
                  <div className="preview-text">
                    {previewText || 'No text extracted. Try a different selectable PDF.'}
                  </div>
                  <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                    <button className="btn btn-primary" onClick={() => setStep(2)}>
                      Next: Paste Job Description
                    </button>
                  </div>
                </div>
              )}

              <div className="privacy-badge">
                🛡️ Privacy First: We never save your resume permanently. All files are auto-deleted after 24h.
              </div>
            </div>
            
            {/* Screen 1 Bottom Ad Banner */}
            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
              <CarbonAd />
            </div>
          </div>
        )}

        {/* SCREEN 2: PASTE JOB DESCRIPTION */}
        {step === 2 && (
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
              Paste the Job Description
            </h2>
            
            <div className="screen-2-grid">
              <div className="card textarea-container" style={{ margin: '0' }}>
                <textarea
                  className="jd-textarea"
                  placeholder="Paste the target job posting text here... (minimum 100 characters)"
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`char-counter ${jdText.length >= 100 ? 'success' : 'error'}`}>
                    Characters: {jdText.length} / 100 minimum
                  </span>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => setStep(1)}>
                      Back
                    </button>
                    <button 
                      className="btn btn-primary" 
                      disabled={jdText.length < 100}
                      onClick={handleAnalyze}
                    >
                      Analyze Match Score
                    </button>
                  </div>
                </div>
              </div>

              {/* Screen 2 Sidebar Ad */}
              <div className="card carbon-ad-card">
                <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sponsored Link</h4>
                <CarbonAd />
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 3: DETAILED LOADING TIMELINE */}
        {step === 3 && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <h2 style={{ marginBottom: '2rem' }}>Running ATS Diagnosis</h2>
            
            <div className="timeline">
              <div className={`timeline-step ${loadingStep === 0 ? 'active' : loadingStep > 0 ? 'completed' : ''}`}>
                <div className="step-indicator">1</div>
                <div>Parsing PDF structure & font mappings</div>
              </div>
              <div className={`timeline-step ${loadingStep === 1 ? 'active' : loadingStep > 1 ? 'completed' : ''}`}>
                <div className="step-indicator">2</div>
                <div>Extracting weighted job keywords & variants</div>
              </div>
              <div className={`timeline-step ${loadingStep === 2 ? 'active' : loadingStep > 2 ? 'completed' : ''}`}>
                <div className="step-indicator">3</div>
                <div>Auditing layout against 6 ATS formatting rules</div>
              </div>
              <div className={`timeline-step ${loadingStep === 3 ? 'active' : loadingStep > 3 ? 'completed' : ''}`}>
                <div className="step-indicator">4</div>
                <div>Encoding semantic similarity matrices</div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 4: RESULTS DASHBOARD */}
        {step === 4 && reportData && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Top Score Summary Banner */}
            <div className="card results-header" style={{ marginBottom: '2rem' }}>
              <div className="overall-score-display">
                <div className="gauge-outer" style={{ '--score-deg': reportData.overall_score * 3.6 } as any}>
                  <div className="gauge-inner">
                    <span className="gauge-score">{reportData.overall_score}</span>
                    <span className="gauge-total">/ 100</span>
                  </div>
                </div>
                <div>
                  <h2 className="score-meta-title">Overall ATS Score</h2>
                  <span className={`score-badge ${reportData.overall_score >= 80 ? 'high' : reportData.overall_score >= 50 ? 'medium' : 'low'}`}>
                    {reportData.overall_score >= 80 ? 'Good Match' : reportData.overall_score >= 50 ? 'Fair Match' : 'High Rejection Risk'}
                  </span>
                </div>
              </div>
              
              <div className="sub-scores-grid">
                <div className="sub-score-item">
                  <div className="sub-score-label">Keyword Match</div>
                  <div className="sub-score-value" style={{ color: reportData.keyword_score >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {reportData.keyword_score}%
                  </div>
                </div>
                <div className="sub-score-item">
                  <div className="sub-score-label">Formatting Audit</div>
                  <div className="sub-score-value" style={{ color: reportData.formatting_score >= 80 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {reportData.formatting_score}%
                  </div>
                </div>
                <div className="sub-score-item">
                  <div className="sub-score-label">Semantic Match</div>
                  <div className="sub-score-value" style={{ color: reportData.semantic_score >= 60 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {reportData.semantic_score}%
                  </div>
                </div>
              </div>
            </div>

            {/* FREE tier / LOCKED report representation */}
            {!reportData.is_paid ? (
              <div className="locked-section-container">
                {/* Blurred preview of the full checklist */}
                <div className="locked-preview">
                  <div className="card">
                    <h3>Exhaustive Keyword Audit</h3>
                    <div className="keyword-grid" style={{ marginTop: '1rem' }}>
                      <div className="keyword-pill missing">React</div>
                      <div className="keyword-pill missing">Typescript</div>
                      <div className="keyword-pill missing">Next.js</div>
                      <div className="keyword-pill missing">Tailwind</div>
                      <div className="keyword-pill missing">Node</div>
                    </div>
                  </div>
                </div>

                {/* Overlaid paywall card (US-4) */}
                <div className="paywall-overlay">
                  <div className="card pricing-card">
                    <span className="score-badge medium">Exclusive Report Unlock</span>
                    <div className="price-display">
                      <span className="price-original">$14.99</span>
                      <span className="price-original">{abPrice}</span>
                      <span className="price-amount" style={{ color: 'var(--color-success)' }}>Free</span>
                      <span className="price-currency" style={{ color: 'var(--color-success)' }}>USD</span>
                    </div>
                    <h3 style={{ marginBottom: '1rem' }}>Get the detailed fix checklist</h3>
                    <ul className="pricing-features">
                      <li className="pricing-feature-item">
                        <span className="pricing-feature-icon">✓</span>
                        Full missing keyword list ranked by importance
                      </li>
                      <li className="pricing-feature-item">
                        <span className="pricing-feature-icon">✓</span>
                        Formatting issue coordinates & actionable warnings
                      </li>
                      <li className="pricing-feature-item">
                        <span className="pricing-feature-icon">✓</span>
                        Section-by-section ATS categorization audit
                      </li>
                      <li className="pricing-feature-item">
                        <span className="pricing-feature-icon">✓</span>
                        One-time fee, no recurring subscription
                      </li>
                    </ul>
                    
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%' }} 
                      onClick={handleCheckout}
                      disabled={isCheckingPayment}
                    >
                      {isCheckingPayment ? 'Unlocking...' : 'Unlock Detailed Audit Report'}
                    </button>
                    <p style={{ fontSize: '0.75rem', marginTop: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Secure Checkout with LemonSqueezy. VAT/tax calculated at checkout.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* PAID tier / UNLOCKED report representation */
              <div className="unlocked-section">
                {/* Keywords Audit */}
                <div className="card">
                  <h3 className="section-title">🔍 Keyword Match Audit</h3>
                  <p style={{ marginBottom: '1.5rem' }}>
                    We identified the critical requirements in the Job Description and mapped them against your resume content (using variant-aware normalization).
                  </p>

                  <h4 style={{ color: 'var(--color-danger)', marginBottom: '0.75rem' }}>Missing Keywords ({reportData.missing_keywords.length})</h4>
                  {reportData.missing_keywords.length > 0 ? (
                    <div className="keyword-grid">
                      {reportData.missing_keywords.map((kw: any, idx: number) => (
                        <div key={idx} className="keyword-pill missing" title={`Variants checked: ${kw.variants.join(', ')}`}>
                          <span>{kw.term}</span>
                          <span style={{ fontSize: '0.75rem', opacity: 0.65 }}>w:{kw.weight}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--color-success)', marginBottom: '1.5rem' }}>✓ Excellent! No critical keywords missing.</p>
                  )}

                  <h4 style={{ color: 'var(--color-success)', marginBottom: '0.75rem', marginTop: '1.5rem' }}>Matching Keywords ({reportData.matching_keywords.length})</h4>
                  {reportData.matching_keywords.length > 0 ? (
                    <div className="keyword-grid">
                      {reportData.matching_keywords.map((kw: any, idx: number) => (
                        <div key={idx} className="keyword-pill matching">
                          <span>{kw.term}</span>
                          <span>✓</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>No keywords matched yet.</p>
                  )}
                </div>

                {/* Formatting Audit */}
                <div className="card">
                  <h3 className="section-title">📐 Layout & Formatting Risks</h3>
                  <p style={{ marginBottom: '1.5rem' }}>
                    Deterministic layout check for elements that trigger parsing corruption in common corporate ATS engines.
                  </p>

                  {reportData.formatting_issues.length > 0 ? (
                    <div className="issue-list">
                      {reportData.formatting_issues.map((issue: any, idx: number) => (
                        <div key={idx} className={`issue-item ${issue.severity >= 0.3 ? 'danger' : 'warning'}`}>
                          <div className="issue-header">
                            <span style={{ color: issue.severity >= 0.3 ? '#fca5a5' : '#fcd34d' }}>
                              ⚠️ {issue.severity >= 0.3 ? 'High Risk' : 'Medium Risk'}
                            </span>
                            <span className="issue-location">{issue.location || 'Global'}</span>
                          </div>
                          <p style={{ fontSize: '0.92rem' }}>{issue.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '8px', color: 'var(--color-success)' }}>
                      ✓ Outstanding! No layout or formatting risks detected. Your PDF structure is highly parse-friendly.
                    </div>
                  )}
                </div>

                {/* Section breakdown categorizer */}
                <div className="card">
                  <h3 className="section-title">📂 ATS Section Categorization</h3>
                  <p style={{ marginBottom: '1.5rem' }}>
                    This demonstrates how a standard ATS parser isolates blocks. If a block is checked &apos;No&apos;, it means the parsing algorithm could not identify standard headings.
                  </p>

                  <div className="checklist-item">
                    <span>Header Contact Information</span>
                    <span className={`checklist-status ${reportData.section_breakdown.contact_info ? 'success' : 'fail'}`}>
                      {reportData.section_breakdown.contact_info ? 'Parsed Successfully (Yes)' : 'Detection Failed (No)'}
                    </span>
                  </div>
                  <div className="checklist-item">
                    <span>Experience Section Block</span>
                    <span className={`checklist-status ${reportData.section_breakdown.experience ? 'success' : 'fail'}`}>
                      {reportData.section_breakdown.experience ? 'Parsed Successfully (Yes)' : 'Detection Failed (No)'}
                    </span>
                  </div>
                  <div className="checklist-item">
                    <span>Skills Section Block</span>
                    <span className={`checklist-status ${reportData.section_breakdown.skills ? 'success' : 'fail'}`}>
                      {reportData.section_breakdown.skills ? 'Parsed Successfully (Yes)' : 'Detection Failed (No)'}
                    </span>
                  </div>
                  <div className="checklist-item">
                    <span>Education Section Block</span>
                    <span className={`checklist-status ${reportData.section_breakdown.education ? 'success' : 'fail'}`}>
                      {reportData.section_breakdown.education ? 'Parsed Successfully (Yes)' : 'Detection Failed (No)'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => window.print()}>
                    🖨️ Export PDF
                  </button>
                  <button className="btn btn-primary" onClick={resetScanner}>
                    Start New Scan
                  </button>
                </div>
              </div>
            )}

            {!reportData.is_paid && (
              <div className="free-tier-results-grid" style={{ marginTop: '2.5rem' }}>
                <div className="card" style={{ marginBottom: '0' }}>
                  <h3 style={{ marginBottom: '1.5rem' }}>Free Tier Match Insights</h3>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ color: 'var(--color-danger)', marginBottom: '0.75rem' }}>Top Missing Keywords</h4>
                    {reportData.top_missing_keywords && reportData.top_missing_keywords.length > 0 ? (
                      <div className="keyword-grid">
                        {reportData.top_missing_keywords.map((kw: any, idx: number) => (
                          <div key={idx} className="keyword-pill missing">
                            <span>{kw.term}</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.65 }}>w:{kw.weight}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--color-success)' }}>No critical keywords missing.</p>
                    )}
                  </div>

                  <div>
                    <h4 style={{ color: 'var(--color-warning)', marginBottom: '0.75rem' }}>Top Formatting Risk</h4>
                    {reportData.top_formatting_issue ? (
                      <div className="issue-item warning">
                        <div className="issue-header">
                          <span style={{ color: '#fcd34d' }}>⚠️ Layout Flag</span>
                          <span className="issue-location">{reportData.top_formatting_issue.location || 'Global'}</span>
                        </div>
                        <p style={{ fontSize: '0.92rem' }}>{reportData.top_formatting_issue.message}</p>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--color-success)' }}>✓ No formatting risk detected in the top check.</p>
                    )}
                  </div>
                </div>

                <div className="card carbon-ad-card">
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sponsored Link</h4>
                  <CarbonAd />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      <footer style={{ marginTop: '5rem', borderTop: '1px solid var(--border-card)', paddingTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
        <p style={{ marginBottom: '0.75rem' }}>© 2026 ResuScore.ai. All rights reserved.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("Privacy Policy:\n\nWe take your privacy seriously. All uploaded resume PDF documents and extracted texts are strictly processed in-memory and permanently deleted from our database servers within 24 hours of scan processing. We do not share, sell, or utilize your resumes for any machine learning training models."); }} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="#terms" onClick={(e) => { e.preventDefault(); alert("Terms of Service:\n\nResuScore.ai provides diagnostic analysis metrics to assist job seekers. We do not guarantee employment, resume parse pass results, or interview placement. Scans are provided on an as-is basis."); }} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Terms of Service</a>
          <a href="#refunds" onClick={(e) => { e.preventDefault(); alert("Refund Policy:\n\nWe offer a 100% money-back guarantee if you are not satisfied with the detailed audit report. To request a refund, please contact our support team at support@resuscore.ai with your Transaction ID or Session ID within 14 days of purchase."); }} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Refund Policy</a>
          <a href="mailto:support@resuscore.ai" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Contact Support</a>
        </div>
      </footer>
    </div>
  );
}
