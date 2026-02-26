'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Loader2,
  Mail,
  Shield,
  ShieldCheck,
  Unlock,
  Trash2,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Search,
  ArrowLeft,
  Download,
  ExternalLink,
  Clock,
  ChevronDown,
  ChevronUp,
  Inbox,
  ScanLine,
  Sparkles,
  MailX,
  Activity,
  CircleDot,
} from 'lucide-react'

// ---- THEME VARS ----
const THEME_VARS = {
  '--background': '0 0% 100%',
  '--foreground': '222 47% 11%',
  '--card': '0 0% 98%',
  '--card-foreground': '222 47% 11%',
  '--primary': '222 47% 11%',
  '--primary-foreground': '210 40% 98%',
  '--secondary': '210 40% 96%',
  '--secondary-foreground': '222 47% 11%',
  '--accent': '210 40% 92%',
  '--accent-foreground': '222 47% 11%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 98%',
  '--muted': '210 40% 94%',
  '--muted-foreground': '215 16% 47%',
  '--border': '214 32% 91%',
  '--input': '214 32% 85%',
  '--ring': '222 47% 11%',
  '--radius': '0.875rem',
  '--chart-1': '12 76% 61%',
  '--chart-2': '173 58% 39%',
  '--chart-3': '197 37% 24%',
  '--chart-4': '43 74% 66%',
  '--chart-5': '27 87% 67%',
} as React.CSSProperties

// ---- TYPES ----
interface EmailCandidate {
  email_id: string
  sender_name: string
  sender_email: string
  subject: string
  date_received: string
  category: string
  reason: string
}

interface ScanResult {
  total_scanned: number
  scan_date: string
  candidates: EmailCandidate[]
  protected_emails: EmailCandidate[]
  summary: string
}

interface UnsubResult {
  email_id: string
  sender_name: string
  sender_email: string
  subject: string
  status: string
  unsubscribe_link: string
  link_source: string
  error_message: string
}

interface UnsubscribeResult {
  total_processed: number
  successfully_extracted: number
  no_link_found: number
  failed: number
  results: UnsubResult[]
  summary: string
}

interface ScanHistoryEntry {
  date: string
  total_scanned: number
  candidates_count: number
  protected_count: number
  summary: string
}

// ---- AGENT IDS ----
const INBOX_SCANNER_AGENT_ID = '69a02c3a46d462ee9ae70432'
const UNSUBSCRIBE_AGENT_ID = '69a02c3b5f1c147fcddc9b85'

// ---- CATEGORIES ----
const ALL_CATEGORIES = ['Financial', 'Work', 'Healthcare', 'Government', 'Shopping', 'Newsletter', 'Marketing', 'Social', 'Other']

// ---- SAMPLE DATA ----
const SAMPLE_SCAN_RESULT: ScanResult = {
  total_scanned: 127,
  scan_date: '2026-02-26',
  candidates: [
    { email_id: 'e1', sender_name: 'Daily Deals', sender_email: 'deals@dailydeals.com', subject: 'Flash Sale: 50% off everything!', date_received: '2026-02-25', category: 'Marketing', reason: 'Promotional content from marketing sender' },
    { email_id: 'e2', sender_name: 'Tech Newsletter', sender_email: 'news@techweekly.io', subject: 'This Week in Tech: AI Revolution', date_received: '2026-02-24', category: 'Newsletter', reason: 'Newsletter subscription detected' },
    { email_id: 'e3', sender_name: 'FitTrack', sender_email: 'noreply@fittrack.app', subject: 'Your weekly fitness summary', date_received: '2026-02-23', category: 'Marketing', reason: 'App notification - promotional' },
    { email_id: 'e4', sender_name: 'SaaS Updates', sender_email: 'updates@saasplatform.com', subject: 'New features available!', date_received: '2026-02-22', category: 'Marketing', reason: 'Product update marketing' },
    { email_id: 'e5', sender_name: 'Travel Insider', sender_email: 'deals@travelinsider.co', subject: 'Weekend getaway deals just for you', date_received: '2026-02-21', category: 'Newsletter', reason: 'Travel deals newsletter' },
  ],
  protected_emails: [
    { email_id: 'p1', sender_name: 'Chase Bank', sender_email: 'alerts@chase.com', subject: 'Your statement is ready', date_received: '2026-02-25', category: 'Financial', reason: 'Banking statement from financial institution' },
    { email_id: 'p2', sender_name: 'HR Department', sender_email: 'hr@mycompany.com', subject: 'Updated PTO policy', date_received: '2026-02-24', category: 'Work', reason: 'Internal work communication' },
    { email_id: 'p3', sender_name: 'Dr. Smith Office', sender_email: 'appointments@drsmith.com', subject: 'Appointment reminder - March 3', date_received: '2026-02-23', category: 'Healthcare', reason: 'Medical appointment notification' },
  ],
  summary: 'Scanned 127 emails from the past 30 days. Found 5 unsubscribe candidates and 3 protected emails. The majority of candidates are marketing and newsletter subscriptions.'
}

const SAMPLE_UNSUB_RESULT: UnsubscribeResult = {
  total_processed: 5,
  successfully_extracted: 3,
  no_link_found: 1,
  failed: 1,
  results: [
    { email_id: 'e1', sender_name: 'Daily Deals', sender_email: 'deals@dailydeals.com', subject: 'Flash Sale: 50% off everything!', status: 'Link Extracted', unsubscribe_link: 'https://dailydeals.com/unsubscribe?token=abc123', link_source: 'List-Unsubscribe header', error_message: '' },
    { email_id: 'e2', sender_name: 'Tech Newsletter', sender_email: 'news@techweekly.io', subject: 'This Week in Tech: AI Revolution', status: 'Link Extracted', unsubscribe_link: 'https://techweekly.io/unsub/def456', link_source: 'Email body link', error_message: '' },
    { email_id: 'e3', sender_name: 'FitTrack', sender_email: 'noreply@fittrack.app', subject: 'Your weekly fitness summary', status: 'No Link Found', unsubscribe_link: '', link_source: '', error_message: 'No unsubscribe link found in email headers or body' },
    { email_id: 'e4', sender_name: 'SaaS Updates', sender_email: 'updates@saasplatform.com', subject: 'New features available!', status: 'Link Extracted', unsubscribe_link: 'https://saasplatform.com/email/unsubscribe', link_source: 'Email body link', error_message: '' },
    { email_id: 'e5', sender_name: 'Travel Insider', sender_email: 'deals@travelinsider.co', subject: 'Weekend getaway deals just for you', status: 'Failed', unsubscribe_link: '', link_source: '', error_message: 'Failed to fetch email content' },
  ],
  summary: 'Processed 5 emails. Successfully extracted unsubscribe links from 3 emails. 1 email had no unsubscribe link. 1 email failed to process.'
}

const SAMPLE_HISTORY: ScanHistoryEntry[] = [
  { date: '2026-02-20', total_scanned: 94, candidates_count: 8, protected_count: 5, summary: 'Found 8 candidates from 94 scanned emails.' },
  { date: '2026-02-13', total_scanned: 112, candidates_count: 12, protected_count: 7, summary: 'Found 12 candidates from 112 scanned emails.' },
]

// ---- HELPERS ----
function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function getCategoryColor(category: string): string {
  const cat = (category ?? '').toLowerCase()
  if (cat.includes('financial') || cat.includes('bank')) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (cat.includes('work') || cat.includes('job')) return 'bg-blue-100 text-blue-800 border-blue-200'
  if (cat.includes('health')) return 'bg-red-100 text-red-800 border-red-200'
  if (cat.includes('government') || cat.includes('gov')) return 'bg-purple-100 text-purple-800 border-purple-200'
  if (cat.includes('shopping') || cat.includes('order')) return 'bg-amber-100 text-amber-800 border-amber-200'
  if (cat.includes('newsletter')) return 'bg-indigo-100 text-indigo-800 border-indigo-200'
  if (cat.includes('marketing') || cat.includes('promo')) return 'bg-orange-100 text-orange-800 border-orange-200'
  if (cat.includes('social')) return 'bg-pink-100 text-pink-800 border-pink-200'
  return 'bg-slate-100 text-slate-800 border-slate-200'
}

function getStatusInfo(status: string): { color: string; icon: React.ReactNode } {
  const s = (status ?? '').toLowerCase()
  if (s.includes('extracted') || s.includes('success')) return { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <Check className="h-3.5 w-3.5" /> }
  if (s.includes('no link') || s.includes('manual')) return { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <AlertTriangle className="h-3.5 w-3.5" /> }
  if (s.includes('fail') || s.includes('error')) return { color: 'bg-red-100 text-red-800 border-red-200', icon: <X className="h-3.5 w-3.5" /> }
  return { color: 'bg-slate-100 text-slate-800 border-slate-200', icon: <CircleDot className="h-3.5 w-3.5" /> }
}

function loadScanHistory(): ScanHistoryEntry[] {
  try {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem('gmail-cleaner-history')
    if (stored) {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (_e) { /* ignore */ }
  return []
}

function saveScanHistory(history: ScanHistoryEntry[]) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gmail-cleaner-history', JSON.stringify(history))
    }
  } catch (_e) { /* ignore */ }
}

// ---- EMAIL CARD ----
function EmailCard({
  email,
  mode,
  onMove,
}: {
  email: EmailCandidate
  mode: 'candidate' | 'protected'
  onMove: () => void
}) {
  return (
    <div className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-background hover:shadow-md transition-all duration-200">
      <div className="flex-shrink-0 mt-0.5">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${mode === 'candidate' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {(email?.sender_name ?? '?').charAt(0).toUpperCase()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-foreground truncate">{email?.sender_name ?? 'Unknown'}</span>
          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border ${getCategoryColor(email?.category ?? '')}`}>
            {email?.category ?? 'Unknown'}
          </span>
        </div>
        <p className="text-sm text-foreground truncate mb-0.5">{email?.subject ?? 'No subject'}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground truncate">{email?.sender_email ?? ''}</span>
          <span className="text-xs text-muted-foreground">{email?.date_received ?? ''}</span>
        </div>
        {email?.reason && (
          <p className="text-xs text-muted-foreground mt-1 italic">{email.reason}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMove}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
          title={mode === 'candidate' ? 'Move to Protected' : 'Move to Candidates'}
        >
          {mode === 'candidate' ? <Shield className="h-4 w-4 text-emerald-600" /> : <Unlock className="h-4 w-4 text-orange-600" />}
        </Button>
      </div>
    </div>
  )
}

// ---- UNSUB RESULT CARD ----
function UnsubResultCard({ result }: { result: UnsubResult }) {
  const [expanded, setExpanded] = useState(false)
  const statusInfo = getStatusInfo(result?.status ?? '')

  return (
    <div className="p-4 rounded-xl border border-border bg-background">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusInfo.color}`}>
            {statusInfo.icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-foreground truncate">{result?.sender_name ?? 'Unknown'}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${statusInfo.color}`}>
              {result?.status ?? 'Unknown'}
            </span>
          </div>
          <p className="text-sm text-foreground truncate mb-0.5">{result?.subject ?? 'No subject'}</p>
          <span className="text-xs text-muted-foreground">{result?.sender_email ?? ''}</span>
          {result?.link_source && (
            <p className="text-xs text-muted-foreground mt-1">Source: {result.link_source}</p>
          )}
          {result?.error_message && (
            <p className="text-xs text-red-600 mt-1">{result.error_message}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          {result?.unsubscribe_link && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
      {expanded && result?.unsubscribe_link && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Unsubscribe link:</span>
            <a
              href={result.unsubscribe_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate max-w-xs"
            >
              {result.unsubscribe_link}
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- SKELETON LOADER ----
function ScanSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-medium text-foreground">Scanning your inbox...</span>
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-background">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- AGENT STATUS SECTION ----
function AgentStatusSection({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    {
      id: INBOX_SCANNER_AGENT_ID,
      name: 'Inbox Scanner Agent',
      purpose: 'Scans Gmail inbox, categorizes emails as candidates or protected',
    },
    {
      id: UNSUBSCRIBE_AGENT_ID,
      name: 'Unsubscribe Agent',
      purpose: 'Extracts unsubscribe links from candidate emails',
    },
  ]

  return (
    <Card className="border-border bg-card/50 backdrop-blur-md">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Agents</span>
        </div>
        <div className="space-y-2">
          {agents.map((agent) => (
            <div key={agent.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-background/50">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeAgentId === agent.id ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{agent.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{agent.purpose}</p>
              </div>
              {activeAgentId === agent.id && (
                <Loader2 className="h-3 w-3 animate-spin text-primary flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ---- MAIN PAGE ----
export default function Page() {
  // State: app view
  type AppView = 'dashboard' | 'review' | 'summary'
  const [view, setView] = useState<AppView>('dashboard')

  // State: sample data toggle
  const [showSample, setShowSample] = useState(false)

  // State: scanning
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  // State: review lists (mutable by user)
  const [candidates, setCandidates] = useState<EmailCandidate[]>([])
  const [protectedEmails, setProtectedEmails] = useState<EmailCandidate[]>([])

  // State: category filter
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  // State: protected categories (toggleable on dashboard)
  const [protectedCategories, setProtectedCategories] = useState<string[]>(['Financial', 'Work', 'Healthcare', 'Government', 'Shopping'])

  // State: unsubscribe
  const [unsubscribing, setUnsubscribing] = useState(false)
  const [unsubError, setUnsubError] = useState<string | null>(null)
  const [unsubResult, setUnsubResult] = useState<UnsubscribeResult | null>(null)

  // State: confirmation modal
  const [showConfirm, setShowConfirm] = useState(false)

  // State: scan history
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([])

  // State: active agent
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Load history on mount
  useEffect(() => {
    setScanHistory(loadScanHistory())
  }, [])

  // Sample data effect
  useEffect(() => {
    if (showSample) {
      setScanResult(SAMPLE_SCAN_RESULT)
      setCandidates([...SAMPLE_SCAN_RESULT.candidates])
      setProtectedEmails([...SAMPLE_SCAN_RESULT.protected_emails])
      setUnsubResult(SAMPLE_UNSUB_RESULT)
      setScanHistory(SAMPLE_HISTORY)
    } else {
      setScanResult(null)
      setCandidates([])
      setProtectedEmails([])
      setUnsubResult(null)
      setScanHistory(loadScanHistory())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSample])

  // Parse scan response data
  const parseScanResponse = useCallback((rawResult: any): ScanResult | null => {
    try {
      let data = rawResult
      if (typeof data === 'string') {
        try { data = JSON.parse(data) } catch (_e) { return null }
      }
      const resolved = data?.response?.result || data?.result || data?.response || data
      if (!resolved) return null

      return {
        total_scanned: resolved?.total_scanned ?? 0,
        scan_date: resolved?.scan_date ?? '',
        candidates: Array.isArray(resolved?.candidates) ? resolved.candidates : [],
        protected_emails: Array.isArray(resolved?.protected_emails) ? resolved.protected_emails : [],
        summary: resolved?.summary ?? '',
      }
    } catch (_e) {
      return null
    }
  }, [])

  // Parse unsub response data
  const parseUnsubResponse = useCallback((rawResult: any): UnsubscribeResult | null => {
    try {
      let data = rawResult
      if (typeof data === 'string') {
        try { data = JSON.parse(data) } catch (_e) { return null }
      }
      const resolved = data?.response?.result || data?.result || data?.response || data
      if (!resolved) return null

      return {
        total_processed: resolved?.total_processed ?? 0,
        successfully_extracted: resolved?.successfully_extracted ?? 0,
        no_link_found: resolved?.no_link_found ?? 0,
        failed: resolved?.failed ?? 0,
        results: Array.isArray(resolved?.results) ? resolved.results : [],
        summary: resolved?.summary ?? '',
      }
    } catch (_e) {
      return null
    }
  }, [])

  // Scan inbox
  const handleScan = async () => {
    if (showSample) {
      setView('review')
      return
    }

    setScanning(true)
    setScanError(null)
    setScanResult(null)
    setActiveAgentId(INBOX_SCANNER_AGENT_ID)

    try {
      const protectedList = protectedCategories.join(', ')
      const message = `Scan my Gmail inbox for all unread emails from the past 30 days. Categorize each email as either Protected (categories: ${protectedList}) or Unsubscribe Candidate based on the sender and content. Return the results with total_scanned, scan_date, candidates array, protected_emails array, and summary.`

      const result = await callAIAgent(message, INBOX_SCANNER_AGENT_ID)

      if (result?.success) {
        const parsed = parseScanResponse(result)
        if (parsed) {
          setScanResult(parsed)
          setCandidates([...parsed.candidates])
          setProtectedEmails([...parsed.protected_emails])

          // Save to history
          const entry: ScanHistoryEntry = {
            date: parsed.scan_date || new Date().toISOString().split('T')[0],
            total_scanned: parsed.total_scanned,
            candidates_count: parsed.candidates.length,
            protected_count: parsed.protected_emails.length,
            summary: parsed.summary,
          }
          const newHistory = [entry, ...scanHistory].slice(0, 10)
          setScanHistory(newHistory)
          saveScanHistory(newHistory)

          setView('review')
        } else {
          setScanError('Unable to parse scan results. Please try again.')
        }
      } else {
        setScanError(result?.error ?? 'Scan failed. Please try again.')
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setScanning(false)
      setActiveAgentId(null)
    }
  }

  // Move email between lists
  const moveToProtected = (emailId: string) => {
    const email = candidates.find((c) => c?.email_id === emailId)
    if (email) {
      setCandidates((prev) => prev.filter((c) => c?.email_id !== emailId))
      setProtectedEmails((prev) => [...prev, email])
    }
  }

  const moveToCandidates = (emailId: string) => {
    const email = protectedEmails.find((p) => p?.email_id === emailId)
    if (email) {
      setProtectedEmails((prev) => prev.filter((p) => p?.email_id !== emailId))
      setCandidates((prev) => [...prev, email])
    }
  }

  // Unsubscribe
  const handleUnsubscribe = async () => {
    setShowConfirm(false)

    if (showSample) {
      setView('summary')
      return
    }

    setUnsubscribing(true)
    setUnsubError(null)
    setUnsubResult(null)
    setActiveAgentId(UNSUBSCRIBE_AGENT_ID)

    try {
      const emailDetails = candidates.map((c) => `Email ID: ${c?.email_id ?? 'unknown'}, Sender: ${c?.sender_name ?? 'unknown'} (${c?.sender_email ?? 'unknown'}), Subject: ${c?.subject ?? 'No subject'}`).join('\n')

      const message = `Process these emails for unsubscribe link extraction:\n${emailDetails}\n\nFor each email, fetch the full content, find the unsubscribe link (check List-Unsubscribe header first, then email body), and report the status. Return total_processed, successfully_extracted, no_link_found, failed counts, a results array with each email's status, and a summary.`

      const result = await callAIAgent(message, UNSUBSCRIBE_AGENT_ID)

      if (result?.success) {
        const parsed = parseUnsubResponse(result)
        if (parsed) {
          setUnsubResult(parsed)
          setView('summary')
        } else {
          setUnsubError('Unable to parse unsubscribe results. Please try again.')
        }
      } else {
        setUnsubError(result?.error ?? 'Unsubscribe process failed. Please try again.')
      }
    } catch (err) {
      setUnsubError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setUnsubscribing(false)
      setActiveAgentId(null)
    }
  }

  // Export report
  const handleExportReport = () => {
    if (!unsubResult) return
    const lines: string[] = []
    lines.push('Gmail Inbox Cleaner - Unsubscribe Report')
    lines.push('=' .repeat(44))
    lines.push('')
    lines.push(`Date: ${new Date().toLocaleDateString()}`)
    lines.push(`Total Processed: ${unsubResult.total_processed}`)
    lines.push(`Successfully Extracted: ${unsubResult.successfully_extracted}`)
    lines.push(`No Link Found: ${unsubResult.no_link_found}`)
    lines.push(`Failed: ${unsubResult.failed}`)
    lines.push('')
    lines.push('Summary:')
    lines.push(unsubResult.summary ?? '')
    lines.push('')
    lines.push('Detailed Results:')
    lines.push('-'.repeat(44))
    const results = Array.isArray(unsubResult?.results) ? unsubResult.results : []
    results.forEach((r, i) => {
      lines.push(`\n${i + 1}. ${r?.sender_name ?? 'Unknown'} (${r?.sender_email ?? ''})`)
      lines.push(`   Subject: ${r?.subject ?? 'N/A'}`)
      lines.push(`   Status: ${r?.status ?? 'Unknown'}`)
      if (r?.unsubscribe_link) lines.push(`   Link: ${r.unsubscribe_link}`)
      if (r?.link_source) lines.push(`   Source: ${r.link_source}`)
      if (r?.error_message) lines.push(`   Error: ${r.error_message}`)
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inbox-cleaner-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Reset to dashboard
  const handleBackToDashboard = () => {
    setView('dashboard')
    setScanResult(null)
    setCandidates([])
    setProtectedEmails([])
    setUnsubResult(null)
    setScanError(null)
    setUnsubError(null)
    setCategoryFilter(null)
  }

  // Filter emails by category
  const filteredCandidates = categoryFilter
    ? candidates.filter((c) => (c?.category ?? '').toLowerCase() === categoryFilter.toLowerCase())
    : candidates

  const filteredProtected = categoryFilter
    ? protectedEmails.filter((p) => (p?.category ?? '').toLowerCase() === categoryFilter.toLowerCase())
    : protectedEmails

  // All unique categories in current data
  const allCurrentCategories = Array.from(
    new Set([
      ...candidates.map((c) => c?.category ?? '').filter(Boolean),
      ...protectedEmails.map((p) => p?.category ?? '').filter(Boolean),
    ])
  )

  // ---- RENDER ----
  return (
      <div style={THEME_VARS} className="min-h-screen bg-background text-foreground">
        {/* Gradient Background */}
        <div className="fixed inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, hsl(210 20% 97%) 0%, hsl(220 25% 95%) 35%, hsl(200 20% 96%) 70%, hsl(230 15% 97%) 100%)' }} />

        <div className="relative z-10 min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b border-border bg-background/75 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {view !== 'dashboard' && (
                  <Button variant="ghost" size="sm" onClick={handleBackToDashboard} className="mr-1 h-8 w-8 p-0">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <h1 className="text-lg font-semibold tracking-tight text-foreground">Gmail Inbox Cleaner</h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">Sample Data</Label>
                  <Switch id="sample-toggle" checked={showSample} onCheckedChange={setShowSample} />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-emerald-700">Gmail Connected</span>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* ========== DASHBOARD VIEW ========== */}
            {view === 'dashboard' && (
              <div className="space-y-6">
                {/* Hero Section */}
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/5 mb-4">
                    <Inbox className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Clean Up Your Inbox</h2>
                  <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
                    Scan your Gmail inbox to find unwanted subscriptions. We will categorize emails and help you unsubscribe from the ones you no longer need.
                  </p>
                </div>

                {/* Scan Configuration */}
                <Card className="border-border bg-card/60 backdrop-blur-md shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <ScanLine className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Scan Configuration</CardTitle>
                    </div>
                    <CardDescription>Configure which email categories to protect during scanning</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground font-medium">Date Range</span>
                        <Badge variant="secondary" className="text-xs">Last 30 days</Badge>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground font-medium">Protected Categories</span>
                        <span className="text-xs text-muted-foreground">(emails in these categories will be protected)</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {ALL_CATEGORIES.map((cat) => {
                          const isProtected = protectedCategories.includes(cat)
                          return (
                            <button
                              key={cat}
                              onClick={() => {
                                if (isProtected) {
                                  setProtectedCategories((prev) => prev.filter((c) => c !== cat))
                                } else {
                                  setProtectedCategories((prev) => [...prev, cat])
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer ${isProtected ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background text-muted-foreground border-border hover:border-primary/30'}`}
                            >
                              {isProtected && <Check className="h-3 w-3" />}
                              {cat}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button
                      onClick={handleScan}
                      disabled={scanning}
                      className="w-full h-11 text-sm font-medium"
                      size="lg"
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Scanning Inbox...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Scan Inbox
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Scanning skeleton */}
                {scanning && (
                  <Card className="border-border bg-card/60 backdrop-blur-md shadow-sm">
                    <CardContent className="p-6">
                      <ScanSkeleton />
                    </CardContent>
                  </Card>
                )}

                {/* Scan Error */}
                {scanError && (
                  <Card className="border-red-200 bg-red-50/60 backdrop-blur-md">
                    <CardContent className="p-4 flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">Scan Failed</p>
                        <p className="text-xs text-red-600 mt-0.5">{scanError}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleScan} className="flex-shrink-0">
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        Retry
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Scan History */}
                <Card className="border-border bg-card/60 backdrop-blur-md shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">Scan History</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {scanHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <ScanLine className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No scan history yet. Run your first scan above.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {scanHistory.map((entry, i) => (
                          <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-background/50 border border-border/50">
                            <div className="text-center min-w-[60px]">
                              <p className="text-xs font-medium text-foreground">{entry?.date ?? 'N/A'}</p>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div className="flex items-center gap-4 flex-1">
                              <div className="text-center">
                                <p className="text-lg font-semibold text-foreground">{entry?.total_scanned ?? 0}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">Scanned</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-semibold text-orange-600">{entry?.candidates_count ?? 0}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">Candidates</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-semibold text-emerald-600">{entry?.protected_count ?? 0}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">Protected</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground flex-1 truncate hidden md:block">{entry?.summary ?? ''}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Agent Status */}
                <AgentStatusSection activeAgentId={activeAgentId} />
              </div>
            )}

            {/* ========== REVIEW VIEW ========== */}
            {view === 'review' && (
              <div className="space-y-6">
                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-border bg-card/60 backdrop-blur-md shadow-sm">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{scanResult?.total_scanned ?? 0}</p>
                      <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Emails Scanned</p>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-200 bg-orange-50/60 backdrop-blur-md shadow-sm">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-orange-600">{candidates.length}</p>
                      <p className="text-xs text-orange-600/70 mt-1 uppercase tracking-wider">Candidates</p>
                    </CardContent>
                  </Card>
                  <Card className="border-emerald-200 bg-emerald-50/60 backdrop-blur-md shadow-sm">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-600">{protectedEmails.length}</p>
                      <p className="text-xs text-emerald-600/70 mt-1 uppercase tracking-wider">Protected</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Summary */}
                {scanResult?.summary && (
                  <Card className="border-border bg-card/60 backdrop-blur-md shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-foreground">{renderMarkdown(scanResult.summary)}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Category Filters */}
                {allCurrentCategories.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground mr-1">Filter:</span>
                    <button
                      onClick={() => setCategoryFilter(null)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${!categoryFilter ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/30'}`}
                    >
                      All
                    </button>
                    {allCurrentCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${categoryFilter === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/30'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Two-column layout */}
                {candidates.length === 0 && protectedEmails.length === 0 ? (
                  <Card className="border-border bg-card/60 backdrop-blur-md shadow-sm">
                    <CardContent className="p-8 text-center">
                      <Sparkles className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-foreground mb-1">Your inbox is already clean!</h3>
                      <p className="text-sm text-muted-foreground">No unsubscribe candidates were found in your recent emails.</p>
                      <Button variant="outline" onClick={handleBackToDashboard} className="mt-4">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Candidates Column */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <MailX className="h-4 w-4 text-orange-600" />
                        <h3 className="text-sm font-semibold text-foreground">Unsubscribe Candidates</h3>
                        <Badge variant="secondary" className="text-xs">{filteredCandidates.length}</Badge>
                      </div>
                      <ScrollArea className="h-[500px] pr-1">
                        <div className="space-y-2">
                          {filteredCandidates.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-sm text-muted-foreground">
                                {categoryFilter ? 'No candidates in this category.' : 'No candidates found. All emails have been moved to protected.'}
                              </p>
                            </div>
                          ) : (
                            filteredCandidates.map((email) => (
                              <EmailCard
                                key={email?.email_id ?? Math.random().toString()}
                                email={email}
                                mode="candidate"
                                onMove={() => moveToProtected(email?.email_id ?? '')}
                              />
                            ))
                          )}
                        </div>
                      </ScrollArea>
                      {/* Unsubscribe CTA */}
                      {candidates.length > 0 && (
                        <div className="space-y-2">
                          <Button
                            variant="destructive"
                            className="w-full h-11"
                            onClick={() => setShowConfirm(true)}
                            disabled={unsubscribing || candidates.length === 0}
                          >
                            {unsubscribing ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                Unsubscribe All ({candidates.length})
                              </>
                            )}
                          </Button>
                          {unsubError && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                              <p className="text-xs text-red-600">{unsubError}</p>
                              <Button variant="ghost" size="sm" onClick={() => setShowConfirm(true)} className="ml-auto text-xs h-7">
                                Retry
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Protected Column */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-sm font-semibold text-foreground">Protected Emails</h3>
                        <Badge variant="secondary" className="text-xs">{filteredProtected.length}</Badge>
                      </div>
                      <ScrollArea className="h-[500px] pr-1">
                        <div className="space-y-2">
                          {filteredProtected.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-sm text-muted-foreground">
                                {categoryFilter ? 'No protected emails in this category.' : 'No protected emails found.'}
                              </p>
                            </div>
                          ) : (
                            filteredProtected.map((email) => (
                              <EmailCard
                                key={email?.email_id ?? Math.random().toString()}
                                email={email}
                                mode="protected"
                                onMove={() => moveToCandidates(email?.email_id ?? '')}
                              />
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}

                {/* Unsubscribing overlay */}
                {unsubscribing && (
                  <Card className="border-border bg-card/60 backdrop-blur-md shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm font-medium text-foreground">Processing unsubscribe requests...</span>
                      </div>
                      <Progress value={45} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">This may take a moment while we extract unsubscribe links from each email.</p>
                    </CardContent>
                  </Card>
                )}

                {/* Agent Status */}
                <AgentStatusSection activeAgentId={activeAgentId} />
              </div>
            )}

            {/* ========== SUMMARY VIEW ========== */}
            {view === 'summary' && unsubResult && (
              <div className="space-y-6">
                {/* Summary Header */}
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 mb-3">
                    <Check className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Unsubscribe Complete</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {unsubResult?.total_processed ?? 0} emails processed
                  </p>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-emerald-200 bg-emerald-50/60 backdrop-blur-md shadow-sm">
                    <CardContent className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 mb-2">
                        <Check className="h-5 w-5 text-emerald-600" />
                      </div>
                      <p className="text-2xl font-bold text-emerald-700">{unsubResult?.successfully_extracted ?? 0}</p>
                      <p className="text-xs text-emerald-600/70 mt-1">Links Extracted</p>
                    </CardContent>
                  </Card>
                  <Card className="border-amber-200 bg-amber-50/60 backdrop-blur-md shadow-sm">
                    <CardContent className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 mb-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      </div>
                      <p className="text-2xl font-bold text-amber-700">{unsubResult?.no_link_found ?? 0}</p>
                      <p className="text-xs text-amber-600/70 mt-1">Manual Action Needed</p>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 bg-red-50/60 backdrop-blur-md shadow-sm">
                    <CardContent className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mb-2">
                        <X className="h-5 w-5 text-red-600" />
                      </div>
                      <p className="text-2xl font-bold text-red-700">{unsubResult?.failed ?? 0}</p>
                      <p className="text-xs text-red-600/70 mt-1">Failed</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Summary text */}
                {unsubResult?.summary && (
                  <Card className="border-border bg-card/60 backdrop-blur-md shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-foreground">{renderMarkdown(unsubResult.summary)}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Results List */}
                <Card className="border-border bg-card/60 backdrop-blur-md shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Detailed Results</CardTitle>
                    <CardDescription>Click on an email to see its unsubscribe link</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-1">
                      <div className="space-y-2">
                        {Array.isArray(unsubResult?.results) && unsubResult.results.length > 0 ? (
                          unsubResult.results.map((r, i) => (
                            <UnsubResultCard key={r?.email_id ?? i} result={r} />
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">No detailed results available.</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={handleBackToDashboard} className="flex-1 h-11">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </Button>
                  <Button variant="secondary" onClick={handleExportReport} className="flex-1 h-11">
                    <Download className="h-4 w-4" />
                    Export Report
                  </Button>
                </div>

                {/* Agent Status */}
                <AgentStatusSection activeAgentId={activeAgentId} />
              </div>
            )}

            {/* Summary view fallback when no result */}
            {view === 'summary' && !unsubResult && (
              <div className="text-center py-16">
                <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No Results Available</h3>
                <p className="text-sm text-muted-foreground mb-4">The unsubscribe process did not return any results.</p>
                <Button variant="outline" onClick={handleBackToDashboard}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </Button>
              </div>
            )}
          </main>
        </div>

        {/* ---- CONFIRMATION DIALOG ---- */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Confirm Unsubscribe
              </DialogTitle>
              <DialogDescription>
                You are about to process {candidates.length} email{candidates.length !== 1 ? 's' : ''} for unsubscribe link extraction. This will search for and extract unsubscribe links from the selected emails.
              </DialogDescription>
            </DialogHeader>
            <div className="py-3">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-2">Emails to process:</p>
                <ScrollArea className="h-[120px]">
                  <div className="space-y-1">
                    {candidates.map((c) => (
                      <div key={c?.email_id ?? Math.random().toString()} className="flex items-center gap-2 text-xs">
                        <MailX className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate">{c?.sender_name ?? 'Unknown'}</span>
                        <span className="text-muted-foreground truncate">- {c?.subject ?? 'No subject'}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleUnsubscribe}>
                <Trash2 className="h-4 w-4" />
                Proceed ({candidates.length})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  )
}
