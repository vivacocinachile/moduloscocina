'use client';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useSession } from './useSession';
import { RULES_DEFAULT, RuleType } from './rules';

export function useReglas() {
  const { session, ready } = useSession();
  const [rules, setRules] = useState<Record<string, RuleType>>(RULES_DEFAULT);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!ready) return;
    if (!supabase || !session) { setLoaded(true); return; }
    supabase.from('vc_config').select('reglas').eq('user_id', session.user.id).maybeSingle().then(({ data, error }) => {
      if (!error && data?.reglas && Object.keys(data.reglas).length) setRules(data.reglas as Record<string, RuleType>);
      setLoaded(true);
    });
  }, [ready, session]);

  async function guardar(next: Record<string, RuleType>) {
    setRules(next);
    if (!supabase || !session) { setMsg('Modo local: inicia sesión para guardar tus propias reglas.'); return; }
    const r = await supabase.from('vc_config').upsert({ user_id: session.user.id, reglas: next, updated_at: new Date().toISOString() });
    setMsg(r.error ? 'No se pudo guardar: ' + r.error.message : 'Reglas guardadas.');
  }

  function resetear() { guardar(JSON.parse(JSON.stringify(RULES_DEFAULT))); }

  return { rules, setRules, guardar, resetear, loaded, msg, session };
}
