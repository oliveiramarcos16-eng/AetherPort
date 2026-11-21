export default function SetupNotice() {
  return (
    <div className="setup-screen">
      <div className="setup-card panel">
        <p className="eyebrow">Configuração pendente</p>
        <h1>Conecte o Supabase para dar corda na máquina</h1>
        <p>
          O app já está montado, mas ainda não sabe onde ficam os dados. Falta só
          ligar o Supabase:
        </p>
        <ol>
          <li>
            Crie um projeto em <span className="mono">supabase.com</span>.
          </li>
          <li>
            Abra o <strong>SQL Editor</strong> e rode o arquivo{' '}
            <span className="mono">supabase/schema.sql</span> deste projeto.
          </li>
          <li>
            Copie <span className="mono">.env.example</span> para{' '}
            <span className="mono">.env</span> e preencha{' '}
            <span className="mono">VITE_SUPABASE_URL</span> e{' '}
            <span className="mono">VITE_SUPABASE_ANON_KEY</span> (Project Settings → API).
          </li>
          <li>
            Reinicie o servidor com <span className="mono">npm run dev</span>.
          </li>
          <li>
            Torne sua conta administradora com o SQL indicado no fim de{' '}
            <span className="mono">supabase/schema.sql</span>.
          </li>
        </ol>
        <p className="muted">
          Instruções completas no <span className="mono">README.md</span>.
        </p>
      </div>
    </div>
  )
}
