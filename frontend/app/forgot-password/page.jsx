"use client";

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { api, formatApiError } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('email');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  async function sendCode(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.requestPasswordCode(email.trim());
      setCode('');
      setStep('code');
      setNotice('Nếu email thuộc tài khoản đang hoạt động, bạn sẽ nhận được mã trong hộp thư. Hãy chờ ít nhất 60 giây trước khi yêu cầu lại.');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    setBusy(true);
    try {
      await api.resetPassword({ email: email.trim(), code, newPassword: password });
      setPassword('');
      setConfirmPassword('');
      setCode('');
      setNotice('');
      setStep('done');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page password-recovery-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span className="brand-icon"><BookOpen size={22}/></span>
          <span className="wordmark">mộc<span>.</span></span>
        </div>
        <h1>{step === 'email' ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}</h1>
        {error && <p className="error-alert" role="alert">{error}</p>}
        {notice && <p className="auth-intro" role="status">{notice}</p>}
        {step === 'email' && <>
          <p className="auth-intro">Nhập email đã đăng ký để nhận mã xác nhận.</p>
          <form className="auth-form" onSubmit={sendCode}>
            <label>Email<input type="email" autoComplete="email" maxLength={255} required value={email} onChange={e => setEmail(e.target.value)}/></label>
            <button className="primary-button auth-submit" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi mã xác nhận'}</button>
          </form>
        </>}
        {step === 'code' && <form className="auth-form" onSubmit={resetPassword}>
          <label>Email<input type="email" value={email} readOnly/></label>
          <label>Mã xác nhận<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))}/></label>
          <label>Mật khẩu mới<input type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={e => setPassword(e.target.value)}/></label>
          <label>Xác nhận mật khẩu mới<input type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}/></label>
          <button className="primary-button auth-submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu mật khẩu mới'}</button>
          <div className="password-recovery-actions">
            <button className="text-button" type="button" disabled={busy} onClick={sendCode}>Gửi lại mã</button>
            <button className="text-button" type="button" disabled={busy} onClick={() => { setStep('email'); setNotice(''); setError(''); setCode(''); setPassword(''); setConfirmPassword(''); }}>Đổi email</button>
          </div>
        </form>}
        {step === 'done' && <p className="success-alert" role="status">Mật khẩu đã được đặt lại. Bạn có thể đăng nhập bằng mật khẩu mới.</p>}
        <p className="auth-switch"><Link href="/login">Quay lại đăng nhập</Link></p>
      </section>
    </main>
  );
}
