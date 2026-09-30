'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/lib/useSession';

export function AuthBar() {
  const { session, ready } = useSession();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');

  if (!supabase) return <span className="text-xs text-ink2">Modo local: los datos se guardan solo en este navegador.</span>;
  if (!ready) return null;

  if (session) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span>{session.user.email}</span>
        <button className="border border-line rounded-md px-2 py-1 text-xs" onClick={() => supabase!.auth.signOut()}>Salir</button>
      </div>
    );
  }

  function valid() {
    if (!email.trim() || !pw.trim()) { setMsg('Escribe tu correo y una clave.'); return false; }
    return true;
  }
  async function login() {
    if (!valid()) return;
    setMsg('');
    const r = await supabase!.auth.signInWithPassword({ email: email.trim(), password: pw });
    if (r.error) setMsg('Credenciales inválidas: ' + r.error.message);
  }
  async function signup() {
    if (!valid()) return;
    setMsg('');
    const r = await supabase!.auth.signUp({ email: email.trim(), password: pw });
    if (r.error) setMsg('Error al crear la cuenta: ' + r.error.message);
    else if (!r.data.session) setMsg('Revisa tu correo para confirmar la cuenta.');
  }

  return (
    <div className="flex items-center gap-2 text-sm flex-wrap">
      <input className="border border-line rounded-md px-2 py-1 w-36" type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
      <input className="border border-line rounded-md px-2 py-1 w-28" type="password" placeholder="Clave" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" onKeyDown={(e) => e.key === 'Enter' && login()} />
      <button className="border border-line rounded-md px-2 py-1 bg-accent text-white" onClick={login}>Entrar</button>
      <button className="border border-line rounded-md px-2 py-1" onClick={signup}>Crear cuenta</button>
      {msg && <span className="text-xs text-red-700">{msg}</span>}
    </div>
  );
}
