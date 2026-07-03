'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sanchit7295-ats-checker-backend.hf.space';

export default function CheckoutSimulator() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>('');
  const [price, setPrice] = useState<string>('4.99');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [simStatus, setSimStatus] = useState<string>('');

  useEffect(() => {
    // Get parameters from URL
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('session_id') || '';
    const pr = searchParams.get('price') || '4.99';
    setSessionId(id);
    setPrice(pr);
  }, []);

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setSimStatus('Simulating purchase event...');
    
    try {
      // Call the simulator webhook endpoint on the backend
      const res = await fetch(`${API_BASE}/api/v1/webhooks/lemonsqueezy/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!res.ok) {
        throw new Error('Failed to process checkout webhook simulation.');
      }

      setSimStatus('Payment successful! Redirecting you back to your report...');
      setTimeout(() => {
        // Redirect back to home with payment indicators
        window.location.href = `/?session_id=${sessionId}&paid=true`;
      }, 1500);

    } catch (err: any) {
      setSimStatus(`Error: ${err.message || 'Payment simulation failed.'}`);
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    // Redirect back to home without payment
    window.location.href = `/`;
  };

  return (
    <div className="simulator-container">
      <div className="simulator-box">
        <div className="logo" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
          <span className="logo-icon"></span>
          <span>LemonSqueezy Checkout</span>
        </div>

        <h2 className="simulator-header">Mock Payment Portal</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Merchant: <strong>ResuScore.ai Inc.</strong>
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
          Session ID: {sessionId}
        </p>

        <div className="simulator-price">
          ${price} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>one-time</span>
        </div>

        {simStatus && (
          <div className="alert" style={{ background: simStatus.startsWith('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: simStatus.startsWith('Error') ? 'var(--color-danger)' : 'var(--color-success)', borderColor: simStatus.startsWith('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)' }}>
            {simStatus}
          </div>
        )}

        <div className="simulator-actions">
          <button 
            className="btn btn-success" 
            onClick={handleSimulatePayment}
            disabled={isProcessing || !sessionId}
          >
            {isProcessing ? 'Processing Transaction...' : 'Simulate Successful Payment'}
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={handleCancel}
            disabled={isProcessing}
          >
            Cancel Payment
          </button>
        </div>

        <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          🔒 This is a secure sandbox checkout simulator for local evaluation. No real payment credentials are required.
        </div>
      </div>
    </div>
  );
}
