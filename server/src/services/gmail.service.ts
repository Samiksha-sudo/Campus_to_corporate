import { OAuth2Client } from 'google-auth-library'
import { google }       from 'googleapis'
import { eq, and }      from 'drizzle-orm'
import { randomUUID }   from 'crypto'
import { db }           from '../config/database.js'
import { gmailConnections } from '../db/schema/gmail.js'
import { applications }     from '../db/schema/applications.js'
import { env }          from '../config/env.js'
import { AppError }     from '../utils/errors.js'

function getOAuthClient() {
  return new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI ?? `${env.APP_URL}/api/gmail/callback`,
  )
}

export function getAuthUrl(userId: string): string {
  if (!env.GOOGLE_CLIENT_ID) throw new AppError(503, 'Google OAuth not configured', 'OAUTH_NOT_CONFIGURED')
  const client = getOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt:      'consent',
    scope:       ['openid', 'email', 'https://www.googleapis.com/auth/gmail.readonly'],
    state:       userId,
  })
}

export async function handleCallback(code: string, userId: string): Promise<void> {
  if (!env.GOOGLE_CLIENT_ID) throw new AppError(503, 'Google OAuth not configured', 'OAUTH_NOT_CONFIGURED')
  const client = getOAuthClient()
  const { tokens } = await client.getToken(code)

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new AppError(400, 'Failed to obtain OAuth tokens', 'OAUTH_TOKEN_ERROR')
  }

  client.setCredentials(tokens)

  // Get Gmail address
  const ticket = await client.verifyIdToken({ idToken: tokens.id_token!, audience: env.GOOGLE_CLIENT_ID! })
  const payload = ticket.getPayload()
  const gmailEmail = payload?.email ?? ''

  const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600_000)

  const existing = await db.select({ id: gmailConnections.id }).from(gmailConnections).where(eq(gmailConnections.userId, userId)).limit(1)

  if (existing.length > 0) {
    await db.update(gmailConnections).set({
      gmailEmail,
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry:  expiry,
      lastSyncedAt: new Date(),
    }).where(eq(gmailConnections.userId, userId))
  } else {
    await db.insert(gmailConnections).values({
      id:           randomUUID(),
      userId,
      gmailEmail,
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry:  expiry,
      lastSyncedAt: new Date(),
    })
  }
}

export async function getStatus(userId: string) {
  const [conn] = await db.select().from(gmailConnections).where(eq(gmailConnections.userId, userId)).limit(1)
  if (!conn) return { connected: false, email: null, lastSyncedAt: null }
  return {
    connected:    true,
    email:        conn.gmailEmail,
    lastSyncedAt: conn.lastSyncedAt,
    tokenExpired: conn.tokenExpiry < new Date(),
  }
}

export async function disconnect(userId: string): Promise<void> {
  await db.delete(gmailConnections).where(eq(gmailConnections.userId, userId))
}

interface EmailFound {
  subject:        string
  from:           string
  company:        string
  detectedStatus: string
  matched:        boolean
  appId:          string | null
  updated:        boolean
}

interface SyncResult {
  matched:  number
  updated:  number
  emails:   EmailFound[]
}

// Status signals — ordered most specific → least specific
// Each signal maps an email pattern to the correct APPLICATION STATUS (not the email type)
const STATUS_SIGNALS: { pattern: RegExp; status: string }[] = [
  // Terminal — offer outcomes
  { pattern: /pleased to accept|i.*accept.*offer|accepting.*offer|accept.*position/i,                                                                                                     status: 'OFFER_ACCEPTED'           },
  { pattern: /decline.*offer|declining.*offer|decided.*not.*to.*accept|withdrawing.*from.*offer|not.*in.*a.*position.*to.*accept/i,                                                       status: 'OFFER_DECLINED'           },
  { pattern: /pleased to offer|formal offer|offer of employment|job offer letter|offer letter|compensation package|we.*like to offer.*position|congratulations.*offer|verbal offer/i,    status: 'OFFER'                    },
  { pattern: /offer.*pending|awaiting.*formal offer|verbal.*offer.*confirmed|we.*intend to offer/i,                                                                                       status: 'OFFER_PENDING'            },
  // Terminal — negative
  { pattern: /unfortunately|regret to inform|not moving forward|not.*successful|not.*been selected|chosen not to proceed|not progressing|will not be proceeding|no longer.*consider|position.*filled|role.*closed|role.*filled|position has been closed|not.*taken forward|other.*candidates/i, status: 'REJECTED' },
  { pattern: /role.*has.*been.*closed|position.*no longer.*available|role.*cancelled|hiring.*paused/i,                                                                                    status: 'ROLE_CLOSED'              },
  { pattern: /talent pool|keep.*your.*details|keep.*cv.*on file|future.*opportunities/i,                                                                                                  status: 'TALENT_POOL'              },
  // Checks & salary
  { pattern: /right to work|rtw check|share code|proof.*right.*work/i,                                                                                                                   status: 'RIGHT_TO_WORK_CHECK'      },
  { pattern: /background.*check|dbs.*check|criminal.*record.*check|vetting/i,                                                                                                             status: 'BACKGROUND_CHECK'         },
  { pattern: /reference.*check|references.*require|could.*you.*provide.*reference|reference.*request/i,                                                                                   status: 'REFERENCE_CHECK'          },
  { pattern: /salary.*discuss|compensation.*discuss|package.*discuss|salary.*expectation|pay.*range/i,                                                                                    status: 'SALARY_DISCUSSION'        },
  // Interviews — most specific first
  { pattern: /final.*interview|final.*round|last.*round|meet the (full |senior )?team|executive.*interview|panel interview|leadership.*interview|c-suite|board.*interview/i,              status: 'FINAL_ROUND'              },
  { pattern: /third.*round|3rd.*round|third.*stage|3rd.*stage/i,                                                                                                                         status: 'THIRD_ROUND'              },
  { pattern: /second.*round|2nd.*round|second.*stage|2nd.*stage|second.*interview/i,                                                                                                     status: 'SECOND_ROUND'             },
  { pattern: /system design|systems design/i,                                                                                                                                             status: 'SYSTEM_DESIGN_INTERVIEW'  },
  { pattern: /coding interview|live coding|pair programming/i,                                                                                                                            status: 'CODING_INTERVIEW'         },
  { pattern: /technical.*interview|technical.*assessment|hackerrank|codility|codesignal|leetcode|testgorilla|pymetrics|karat|take.?home|technical.*test|tech.*screen/i,                  status: 'TECHNICAL_INTERVIEW'      },
  { pattern: /hiring manager.*interview|interview with.*manager|manager.*interview|meet.*hiring.*manager/i,                                                                               status: 'HIRING_MANAGER_INTERVIEW' },
  { pattern: /interview.*invite|invite.*interview|schedule.*interview|book.*interview|interview.*slot|invited.*to.*interview|arrange.*interview|interview.*confirmation|video.*interview|phone.*interview|zoom.*interview|teams.*interview|google meet|calendly|we.*like to.*speak|would you be available|arrange.*time|set up.*call/i, status: 'HIRING_MANAGER_INTERVIEW' },
  // Assessment
  { pattern: /thank.*you.*completing.*assessment|assessment.*complete|assessment.*submitted|test.*submitted|you.*completed/i,                                                             status: 'ASSESSMENT_SUBMITTED'     },
  { pattern: /online.*assessment|assessment.*invitation|skill.*test|aptitude.*test|personality.*test|situational.*judgement|numerical.*reasoning|verbal.*reasoning|please.*complete.*test/i, status: 'ASSESSMENT'            },
  // Screening
  { pattern: /recruiter.*call|initial.*call|introductory.*call|screening call|pre.?screen|brief.*chat|discovery call|quick call|talent.*team.*call/i,                                    status: 'SCREENING'                },
  // Review states
  { pattern: /application.*on hold|put.*on hold|hiring.*paused|currently on hold/i,                                                                                                      status: 'ON_HOLD'                  },
  { pattern: /waiting.*hear|will be in touch|we.ll be in touch|keep you updated|no.*update.*yet/i,                                                                                       status: 'WAITING_FOR_RESPONSE'     },
  { pattern: /under review|being reviewed|shortlist|application.*progressing|moved.*forward|reviewing.*application|considering.*application/i,                                            status: 'UNDER_REVIEW'             },
  // Application confirmations — platform specific (LinkedIn, Indeed, Reed, TotalJobs, CWJobs)
  { pattern: /your application was sent|easy apply|application.*sent to|applied.*via linkedin/i,                                                                                          status: 'APPLIED'                  },
  { pattern: /your indeed application|indeed.*application.*confirm|applied.*via indeed/i,                                                                                                 status: 'APPLIED'                  },
  { pattern: /your reed application|reed.*application|applied.*via reed/i,                                                                                                                status: 'APPLIED'                  },
  { pattern: /your totaljobs application|cwjobs.*application|your.*application.*via/i,                                                                                                    status: 'APPLIED'                  },
  { pattern: /thank you for applying|thanks for applying|application.*received|we.*received your application|successfully submitted|application.*submitted|application.*confirmed|you applied|your application (to|for|at)|applied for|applied to|we have received your|application acknowledged|got your application/i, status: 'APPLIED' },
  // Recruiter outreach
  { pattern: /we came across your profile|exciting opportunity|i.*came across|your background|reach out.*opportunity|career.*opportunity|open to.*new role|open to.*opportunities/i,       status: 'RECRUITER_OUTREACH'       },
]

const STATUS_RANK: Record<string, number> = {
  RECRUITER_OUTREACH: 1,
  APPLIED: 2, UNDER_REVIEW: 3,
  SCREENING: 4,
  ASSESSMENT: 5, ASSESSMENT_SUBMITTED: 6,
  HIRING_MANAGER_INTERVIEW: 7,
  TECHNICAL_INTERVIEW: 8, SYSTEM_DESIGN_INTERVIEW: 8, CODING_INTERVIEW: 8,
  SECOND_ROUND: 9, THIRD_ROUND: 10, FINAL_ROUND: 11,
  WAITING_FOR_RESPONSE: 7,
  REFERENCE_CHECK: 12, BACKGROUND_CHECK: 12, RIGHT_TO_WORK_CHECK: 12,
  SALARY_DISCUSSION: 13,
  OFFER_PENDING: 14, OFFER: 15, OFFER_ACCEPTED: 16, OFFER_DECLINED: 16,
  REJECTED: 17, WITHDRAWN: 17, ROLE_CLOSED: 17,
  ON_HOLD: 3, TALENT_POOL: 3, NO_RESPONSE: 2, UNKNOWN: 0,
}

function extractCompanyFromSender(from: string): string {
  // "Deliveroo Careers <careers@deliveroo.co.uk>" → "Deliveroo"
  const name = from.replace(/<[^>]+>/, '').trim().replace(/['"]/g, '')
  if (name && name.length > 0 && name.includes('@') === false) {
    return name.split(/careers|hiring|recruitment|talent|noreply|no-reply/i)[0].trim() || name
  }
  // fallback: extract domain
  const email = from.match(/<([^>]+)>/)?.[1] ?? from
  const domain = email.split('@')[1] ?? ''
  return domain.split('.')[0] ?? 'Unknown'
}

export async function syncEmails(userId: string): Promise<SyncResult> {
  const [conn] = await db.select().from(gmailConnections).where(eq(gmailConnections.userId, userId)).limit(1)
  if (!conn) throw new AppError(400, 'Gmail not connected. Go to Settings → Connect Gmail first.', 'GMAIL_NOT_CONNECTED')

  const client = getOAuthClient()
  client.setCredentials({ access_token: conn.accessToken, refresh_token: conn.refreshToken })

  client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await db.update(gmailConnections).set({
        accessToken: tokens.access_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600_000),
      }).where(eq(gmailConnections.userId, userId))
    }
  })

  const gmailClient = google.gmail({ version: 'v1', auth: client })

  // Fetch user's applications for matching
  const userApps = await db.select().from(applications).where(eq(applications.userId, userId))

  // Search Gmail — last 60 days, broad job-related email search
  // Covers LinkedIn, Indeed, Workday, Greenhouse, Lever, Ashby, direct company emails
  const query = [
    '(',
    // Application confirmations
    'subject:"thank you for applying"',
    'OR subject:"thanks for applying"',
    'OR subject:"application received"',
    'OR subject:"application submitted"',
    'OR subject:"application confirmed"',
    'OR subject:"your application"',
    'OR subject:"you applied"',
    'OR subject:"applied for"',
    'OR subject:"applied to"',
    'OR subject:"we received your"',
    'OR subject:"got your application"',
    'OR subject:"application acknowledged"',
    'OR subject:"application for"',
    // Interview related
    'OR subject:"interview"',
    'OR subject:"next steps"',
    'OR subject:"next stage"',
    'OR subject:"schedule"',
    'OR subject:"screening"',
    'OR subject:"assessment"',
    'OR subject:"invitation to"',
    // Outcomes
    'OR subject:"job offer"',
    'OR subject:"offer of employment"',
    'OR subject:"offer letter"',
    'OR subject:"unfortunately"',
    'OR subject:"not successful"',
    'OR subject:"not been selected"',
    'OR subject:"regret to inform"',
    'OR subject:"not moving forward"',
    'OR subject:"update on your application"',
    'OR subject:"application update"',
    ')',
    'newer_than:60d',
    // Exclude newsletters, marketing, alerts
    '-subject:"job alert"',
    '-subject:"jobs you might"',
    '-subject:"recommended jobs"',
    '-subject:"new jobs"',
    '-subject:"jobs near"',
    '-subject:"unsubscribe"',
  ].join(' ')

  // Paginate Gmail results — fetch up to 500 messages across multiple pages
  const messages: { id?: string | null; threadId?: string | null }[] = []
  let pageToken: string | undefined
  do {
    const listRes = await gmailClient.users.messages.list({
      userId: 'me', q: query, maxResults: 100,
      ...(pageToken ? { pageToken } : {}),
    })
    messages.push(...(listRes.data.messages ?? []))
    pageToken = listRes.data.nextPageToken ?? undefined
  } while (pageToken && messages.length < 500)

  const result: SyncResult = { matched: 0, updated: 0, emails: [] }

  for (const msg of messages) {
    const full    = await gmailClient.users.messages.get({ userId: 'me', id: msg.id!, format: 'metadata', metadataHeaders: ['Subject', 'From', 'Date'] })
    const headers = full.data.payload?.headers ?? []
    const subject = headers.find(h => h.name === 'Subject')?.value ?? ''
    const from    = headers.find(h => h.name === 'From')?.value    ?? ''
    const snippet = full.data.snippet ?? ''
    const body    = `${subject} ${snippet}`

    // Detect status — check subject+snippet first, then subject alone as fallback
    let detectedStatus = ''
    for (const sig of STATUS_SIGNALS) {
      if (sig.pattern.test(body)) { detectedStatus = sig.status; break }
    }
    // Fallback: subject alone must look job-related to avoid noise
    if (!detectedStatus) {
      const sub = subject.toLowerCase()
      if (/application|applied|interview|offer|assessment|screening|unfortunately|rejected|not.*selected|next.*step|right to work|reference|background check|salary/.test(sub)) {
        detectedStatus = 'APPLIED'
      } else {
        continue
      }
    }

    const company = extractCompanyFromSender(from)

    // Try to match against an existing application
    const fromLower    = from.toLowerCase()
    const subjectLower = subject.toLowerCase()
    const snippetLower = snippet.toLowerCase()

    const matchedApp = userApps.find(app => {
      const c = app.companyName.toLowerCase()
      return fromLower.includes(c) || subjectLower.includes(c) || snippetLower.includes(c)
    })

    let updated = false
    let appId: string | null = matchedApp?.id ?? null

    if (matchedApp) {
      // Existing application — update status if progression
      result.matched++
      const currentRank  = STATUS_RANK[matchedApp.status] ?? 0
      const detectedRank = STATUS_RANK[detectedStatus]    ?? 0
      if (detectedRank > currentRank) {
        await db.update(applications)
          .set({ status: detectedStatus as never, updatedAt: new Date() })
          .where(and(eq(applications.id, matchedApp.id), eq(applications.userId, userId)))
        matchedApp.status = detectedStatus
        result.updated++
        updated = true
      }
    } else {
      // No existing application — auto-create it from the email
      const newId = randomUUID()
      const jobTitle = subject
        .replace(/^(re:|fwd?:|your application (to|for|at)|application (to|for|at)|thank you for applying (to|for|at)?)/gi, '')
        .trim()
        .slice(0, 200) || 'Role from email'

      await db.insert(applications).values({
        id:          newId,
        userId,
        companyName: company.slice(0, 255),
        jobTitle:    jobTitle,
        status:      detectedStatus as never,
        source:      'gmail_sync',
        userApproved: 0,
        notes:       `Auto-imported from Gmail: "${subject}"`,
      } as never)

      // Add to in-memory list so duplicate emails in same sync don't create duplicates
      userApps.push({ id: newId, userId, companyName: company, jobTitle, status: detectedStatus } as never)
      appId   = newId
      updated = true
      result.matched++
      result.updated++
    }

    result.emails.push({
      subject,
      from,
      company:        matchedApp?.companyName ?? company,
      detectedStatus,
      matched:        !!matchedApp,
      appId,
      updated,
    })
  }

  await db.update(gmailConnections).set({ lastSyncedAt: new Date() }).where(eq(gmailConnections.userId, userId))

  return result
}
