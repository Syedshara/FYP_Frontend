import { motion } from 'framer-motion';
import { Shield, Construction } from 'lucide-react';

export default function PreventionPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-[60vh] space-y-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
        <Construction className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-xl font-bold text-[var(--text-primary)]">Prevention Rules</h2>
      <p className="text-sm text-[var(--text-muted)] text-center max-w-md">
        Auto-prevention rules and response actions are coming in Phase 2.
        <br />
        This feature will allow automated IP blocking, quarantine, and alerting based on detection thresholds.
      </p>
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] text-sm">
        <Shield className="w-4 h-4" />
        <span>Planned for future release</span>
      </div>
    </motion.div>
  );
}
