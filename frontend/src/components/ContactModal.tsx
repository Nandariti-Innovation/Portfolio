import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Check, Loader2, X } from 'lucide-react';

const inputStyle = 'mt-2 w-full rounded border border-white/20 bg-[#171717] px-3 py-3 text-sm text-[#f2efe9] outline-none focus:border-[#ff6b24] disabled:opacity-60';

export function ContactModal({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
  const submission = useRef<{ fingerprint: string; id: string } | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const element = dialog.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      setStatus('error');
      setFeedback('Please complete the required fields, use a valid email, and enter a message of at least 10 characters.');
      form.reportValidity();
      return;
    }
    const values = Object.fromEntries(new FormData(form));
    inFlight.current = true;
    setStatus('sending');
    setFeedback('');
    try {
      const fingerprint = JSON.stringify(values);
      if (submission.current?.fingerprint !== fingerprint) {
        if (!globalThis.crypto?.randomUUID) throw new Error('Please open this page over HTTPS or localhost to submit your enquiry.');
        submission.current = { fingerprint, id: crypto.randomUUID() };
      }
      const base = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
      const publicKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!base || !publicKey) throw new Error('The contact form is not configured yet. Please try again later.');
      const response = await fetch(`${base}/functions/v1/portfolio-contact`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: publicKey },
        body: JSON.stringify({ ...values, requestId: submission.current.id }),
        signal: AbortSignal.timeout(45000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error('Contact submission failed:', response.status, result.code || '');
        throw new Error(response.status === 404
          ? 'The contact service is not available yet. Please contact me by email for now.'
          : result.message || 'Unable to send your enquiry. Please try again.');
      }
      setFeedback(result.message || 'Your enquiry has been sent. Thank you for getting in touch!');
      setStatus('success');
    } catch (error) {
      console.error('Contact submission could not complete:', error instanceof Error ? error.name : 'Unknown error');
      setStatus('error');
      setFeedback(error instanceof Error && error.name === 'Error' ? error.message : 'Unable to reach the contact service. Please check your connection or contact me by email.');
    } finally {
      inFlight.current = false;
    }
  }

  return createPortal(
    <dialog ref={dialog} aria-labelledby="contact-modal-title" onCancel={event => { event.preventDefault(); if (!inFlight.current) onClose(); }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-[580px] overflow-y-auto rounded-xl border border-white/20 bg-[#0d0d0d] p-6 font-['Manrope',sans-serif] text-[#f2efe9] shadow-2xl backdrop:bg-black/80 sm:p-9">
      <button type="button" onClick={onClose} disabled={status === 'sending'} aria-label="Close contact form" className="absolute right-4 top-4 cursor-pointer rounded p-2 text-[#aaa7a2] hover:text-[#ff6b24] focus-visible:outline-2 focus-visible:outline-[#ff6b24] disabled:opacity-40"><X size={20} /></button>
      <p className="mb-4 pr-8 font-['DM_Mono',monospace] text-[10px] uppercase tracking-[.2em] text-[#ff6b24]">Let’s work together</p>
      <h2 id="contact-modal-title" className="mb-3 font-['Playfair_Display',Georgia,serif] text-4xl leading-tight">Tell me what you<br /><em className="text-[#ff6b24]">have in mind.</em></h2>
      {status === 'success' ? <div className="py-8" role="status"><Check size={32} className="mb-4 text-[#ff6b24]" /><p className="leading-7">{feedback}</p><button type="button" onClick={onClose} className="mt-6 cursor-pointer border-b border-[#ff6b24] py-2">Done</button></div> : <>
        <p className="mb-6 text-sm leading-6 text-[#aaa7a2]">A role, a freelance project, or just an idea—start the conversation.</p>
        <form onSubmit={submit} noValidate>
          {feedback && <p role="alert" className="mb-4 text-sm leading-6 text-[#ffb28d]">{feedback}</p>}
          <fieldset disabled={status === 'sending'} className="grid gap-4 border-0 p-0 text-xs">
            <label>I’m reaching out about<select name="type" required className={inputStyle} defaultValue="hiring"><option value="hiring">Hiring</option><option value="freelancing">Freelancing</option><option value="other">Other</option></select></label>
            <div className="grid gap-4 sm:grid-cols-2"><label>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={100} className={inputStyle} /></label><label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} className={inputStyle} /></label></div>
            <label>Company / organisation <span className="text-[#aaa7a2]">(optional)</span><input name="company" autoComplete="organization" maxLength={160} className={inputStyle} /></label>
            <label>Your message<textarea name="message" required minLength={10} maxLength={5000} rows={4} placeholder="Tell me about the role, project, timeline, or question…" className={`${inputStyle} resize-y`} /></label>
            <label className="hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
            <p className="text-[11px] leading-5 text-[#aaa7a2]">Your details will be saved and emailed to me so I can respond to your enquiry.</p>
            <button type="submit" className="flex cursor-pointer items-center justify-center gap-3 rounded bg-[#ff6b24] px-5 py-3.5 text-sm font-semibold text-[#080808] hover:bg-[#ff854d] disabled:cursor-wait disabled:opacity-60">{status === 'sending' ? <><Loader2 size={17} className="animate-spin motion-reduce:animate-none" />Sending…</> : <>Send enquiry<ArrowUpRight size={17} /></>}</button>
          </fieldset>
        </form>
      </>}
    </dialog>, document.body,
  );
}
