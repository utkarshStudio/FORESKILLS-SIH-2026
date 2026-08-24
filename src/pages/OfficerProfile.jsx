// ============================================================
// OFFICER PROFILE — details of the current local demo session.
// Read-only view over the auth context; no separate auth system.
// ============================================================

import React from 'react';
import { User, ShieldCheck, Database, KeyRound, Building2, Clock, HardDrive } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/Common';
import { useAuth } from '@/hooks/hooks';

/**
 * @param {{ icon: import('react').ComponentType<{ className?: string }>, label: string, value: React.ReactNode }} props
 */
function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0">
      <span className="w-8 h-8 rounded-md bg-muted/60 border border-border flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

export default function OfficerProfile() {
  const { user, isAuthenticated, isLocalSession } = useAuth();

  const displayName = user?.full_name || user?.displayName || 'Government Officer';
  const role = user?.role || 'State Official';
  const dataAccess = user?.dataAccess || 'Reference Dataset';
  const department = user?.department || 'Skill Development Department';
  const signInAt = user?.signInAt
    ? new Date(user.signInAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '—';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Officer Profile"
        subtitle="Session and access details for the currently signed-in officer"
        icon={User}
      />

      <SectionCard title="Officer" subtitle="Identity from the active local session" icon={User}>
        <div className="flex items-center gap-4 p-4 border-b border-border">
          <span className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-lg font-bold">{initials}</span>
          </span>
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground">{displayName}</p>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
          <span
            className={`ml-auto inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium flex-shrink-0 ${
              isAuthenticated
                ? 'bg-[hsl(var(--status-info))]/12 text-[hsl(var(--status-info))] border-[hsl(var(--status-info))]/25'
                : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isAuthenticated ? 'bg-[hsl(var(--status-info))]' : 'bg-muted-foreground'}`}
              aria-hidden="true"
            />
            {isAuthenticated ? 'Signed in' : 'Signed out'}
          </span>
        </div>

        <div>
          <DetailRow icon={ShieldCheck} label="Role" value={role} />
          <DetailRow icon={Building2} label="Department" value={department} />
          <DetailRow
            icon={Database}
            label="Data Access"
            value={
              <span className="inline-flex items-center gap-2">
                {dataAccess}
                <span className="text-[10px] font-normal text-muted-foreground">(read-only)</span>
              </span>
            }
          />
          <DetailRow
            icon={KeyRound}
            label="Authentication"
            value={
              isAuthenticated
                ? `Local demo session${isLocalSession ? ' (no backend login required)' : ''}`
                : 'Signed out — a new demo session starts on next load'
            }
          />
          <DetailRow icon={Clock} label="Signed in at" value={signInAt} />
          <DetailRow
            icon={HardDrive}
            label="Session Persistence"
            value="Stored locally on this device only. No passwords or keys are saved."
          />
        </div>
      </SectionCard>

      <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-md bg-muted/40 border border-border">
        <KeyRound className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <p className="text-xs text-muted-foreground">SSO authentication is a future integration.</p>
      </div>
    </div>
  );
}
