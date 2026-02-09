import { AppRoutes } from './routes/AppRoutes'
import { isSupabaseConfigured } from './lib/supabaseClient'

const App = () => {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100">Supabase setup required</h2>
          <p className="mt-2 text-sm text-slate-300">
            Create a .env file at the project root and add:
          </p>
          <div className="mt-4 rounded-lg border border-slate-800/70 bg-slate-950/40 p-4 text-sm text-slate-200">
            <div>VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL</div>
            <div>VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY</div>
          </div>
          <p className="mt-3 text-xs text-slate-400">Restart the dev server after saving the file.</p>
        </div>
      </div>
    )
  }

  return <AppRoutes />
}

export default App
