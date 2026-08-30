/**
 * Campus to Corporate — end-to-end API test suite
 * Run: node server/scripts/test-all.mjs
 */

const BASE = 'http://localhost:4000/api/v1'
const ADMIN_EMAIL    = 'admin@campus-to-corporate.co.uk'
const ADMIN_PASSWORD = 'Admin2024!'
const TEST_EMAIL     = `testuser_${Date.now()}@example.com`
const TEST_PASSWORD  = 'Test1234!'

let pass = 0, fail = 0
const results = []

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

function check(name, condition, actual) {
  if (condition) {
    console.log(`  ✅ ${name}`)
    pass++
    results.push({ name, ok: true })
  } else {
    console.log(`  ❌ ${name}`)
    console.log(`     Got: ${JSON.stringify(actual)?.slice(0, 200)}`)
    fail++
    results.push({ name, ok: false, actual })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🏥 HEALTH CHECK')
const health = await req('GET', '/health')
check('Server responds', health.status === 200, health)
check('Status is ok',   health.data?.data?.status === 'ok', health.data)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔐 AUTH — Registration')
const reg = await req('POST', '/auth/register', {
  email: TEST_EMAIL, password: TEST_PASSWORD,
  firstName: 'Test', lastName: 'User',
})
check('Register returns 201',          reg.status === 201, reg.status)
check('Register returns user object',  reg.data?.data?.user?.email === TEST_EMAIL, reg.data)
check('Register returns accessToken',  !!reg.data?.data?.accessToken, reg.data)
const custToken = reg.data?.data?.accessToken

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔐 AUTH — Duplicate registration')
const dupReg = await req('POST', '/auth/register', {
  email: TEST_EMAIL, password: TEST_PASSWORD, firstName: 'T', lastName: 'U',
})
check('Duplicate email rejected', dupReg.status === 409, dupReg.status)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔐 AUTH — Login (customer)')
const login = await req('POST', '/auth/login', { email: TEST_EMAIL, password: TEST_PASSWORD })
check('Login returns 200',         login.status === 200, login.status)
check('Login returns accessToken', !!login.data?.data?.accessToken, login.data)
check('Login returns user role',   login.data?.data?.user?.role === 'CUSTOMER', login.data)
const freshToken = login.data?.data?.accessToken || custToken

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔐 AUTH — Login (wrong password)')
const badLogin = await req('POST', '/auth/login', { email: TEST_EMAIL, password: 'wrongpass' })
check('Wrong password rejected', badLogin.status === 401, badLogin.status)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔐 AUTH — Admin login')
const adminLogin = await req('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
check('Admin login returns 200',      adminLogin.status === 200, adminLogin.status)
check('Admin role confirmed',         adminLogin.data?.data?.user?.role === 'ADMIN', adminLogin.data)
const adminToken = adminLogin.data?.data?.accessToken

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔐 AUTH — Profile (me)')
const me = await req('GET', '/auth/me', null, freshToken)
check('/me returns 200',       me.status === 200, me.status)
check('/me returns email',     me.data?.data?.email === TEST_EMAIL, me.data)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔐 AUTH — Unauthenticated request')
const noAuth = await req('GET', '/auth/me')
check('Unauthenticated returns 401', noAuth.status === 401, noAuth.status)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📄 CVs — Create')
const cv1 = await req('POST', '/cvs', {
  title: 'Backend Engineer — FinTech',
  targetRole: 'Backend Engineer',
  targetSector: 'FinTech',
  content: 'Test CV content',
}, freshToken)
check('Create CV returns 201',       cv1.status === 201, cv1.status)
check('CV has correct title',        cv1.data?.data?.cv?.title === 'Backend Engineer — FinTech', cv1.data)
check('CV status is DRAFT',          cv1.data?.data?.cv?.status === 'DRAFT', cv1.data)
check('CV is primary (first one)',   cv1.data?.data?.cv?.isPrimary === 1, cv1.data)
const cvId = cv1.data?.data?.cv?.id

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📄 CVs — List')
const cvList = await req('GET', '/cvs', null, freshToken)
check('List CVs returns 200',     cvList.status === 200, cvList.status)
check('List contains created CV', cvList.data?.data?.cvs?.some(c => c.id === cvId), cvList.data)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📄 CVs — Get single')
const cvGet = await req('GET', `/cvs/${cvId}`, null, freshToken)
check('Get CV returns 200', cvGet.status === 200, cvGet.status)
check('Get CV has correct id', cvGet.data?.data?.cv?.id === cvId, cvGet.data)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📄 CVs — Update')
const cvUpdate = await req('PATCH', `/cvs/${cvId}`, { title: 'Updated CV Title' }, freshToken)
check('Update CV returns 200',       cvUpdate.status === 200, cvUpdate.status)
check('Update CV reflects new title', cvUpdate.data?.data?.cv?.title === 'Updated CV Title', cvUpdate.data)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📄 CVs — Submit for review')
const cvSubmit = await req('POST', `/cvs/${cvId}/submit`, {}, freshToken)
check('Submit CV returns 200',       cvSubmit.status === 200, cvSubmit.status)
check('Submit returns success',      cvSubmit.data?.success === true, cvSubmit.data)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📄 CVs — Submit already-in-review CV again (should fail)')
const cvReSubmit = await req('POST', `/cvs/${cvId}/submit`, {}, freshToken)
check('Re-submit IN_REVIEW fails', cvReSubmit.status === 400, cvReSubmit.status)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📄 CVs — EXPLORE plan blocks 2nd CV (correct behaviour)')
const cv2 = await req('POST', '/cvs', { title: 'Data Engineer CV' }, freshToken)
check('EXPLORE plan blocks 2nd CV (403)', cv2.status === 403, cv2.status)
// cv2Id doesn't exist — archive test adjusted below
const cv2Id = null

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📄 CVs — Cannot access another user\'s CV')
const adminCvAccess = await req('GET', `/cvs/${cvId}`, null, adminToken)
check('Cross-user CV access denied (404)', adminCvAccess.status === 404, adminCvAccess.status)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📄 CVs — Archive first CV')
const cvArchive = await req('DELETE', `/cvs/${cvId}`, null, freshToken)
check('Archive CV returns 200', cvArchive.status === 200, cvArchive.status)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n💼 Applications — Create (EXPLORE plan has limit=0)')
const appCreate = await req('POST', '/applications', {
  companyName: 'Monzo', jobTitle: 'Backend Engineer',
  location: 'London', workMode: 'HYBRID', salaryRange: '£60–75k',
  jobUrl: 'https://monzo.com/jobs/123',
  notes: 'Great company',
}, freshToken)
check('EXPLORE plan blocks application', appCreate.status === 403, appCreate.status)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n💳 Stripe — Create checkout session (LAUNCH plan)')
const checkout = await req('POST', '/stripe/checkout', { plan: 'LAUNCH' }, freshToken)
check('Checkout returns 200',   checkout.status === 200, checkout.status)
check('Returns Stripe URL',     checkout.data?.data?.url?.includes('stripe.com'), checkout.data)
const stripeUrl = checkout.data?.data?.url

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n💳 Stripe — Invalid plan')
const badCheckout = await req('POST', '/stripe/checkout', { plan: 'INVALID' }, freshToken)
check('Invalid plan rejected', badCheckout.status === 400, badCheckout.status)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n💳 Stripe — Billing portal (no subscription yet)')
const portal = await req('POST', '/stripe/billing-portal', {}, freshToken)
check('Billing portal handled', [200, 400, 404].includes(portal.status), portal.status)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n👑 Admin — List users (admin token)')
const adminUsers = await req('GET', '/admin/users', null, adminToken)
check('Admin list users returns 200',  adminUsers.status === 200, adminUsers.status)
check('Returns users array',          Array.isArray(adminUsers.data?.data?.users), adminUsers.data)
check('Returns stats object',         !!adminUsers.data?.data?.stats, adminUsers.data)
check('Stats has totalApplications',  'totalApplications' in (adminUsers.data?.data?.stats ?? {}), adminUsers.data)
check('Our test user in list',        adminUsers.data?.data?.users?.some(u => u.email === TEST_EMAIL), adminUsers.data)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n👑 Admin — Non-admin blocked from admin routes')
const custAdmin = await req('GET', '/admin/users', null, freshToken)
check('Customer blocked from admin', custAdmin.status === 403, custAdmin.status)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📊 Gmail — Status (not connected)')
const gmailStatus = await req('GET', '/gmail/status', null, freshToken)
check('Gmail status returns 200',     gmailStatus.status === 200, gmailStatus.status)
check('Gmail not connected by default', gmailStatus.data?.data?.connected === false, gmailStatus.data)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📊 Gmail — Connect URL')
const gmailConnect = await req('GET', '/gmail/connect', null, freshToken)
// Returns 503 when GOOGLE_CLIENT_ID not set (expected until Google Cloud setup)
check('Gmail connect returns 200 or 503', [200, 503].includes(gmailConnect.status), gmailConnect.status)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔐 AUTH — Forgot password')
const forgotPw = await req('POST', '/auth/forgot-password', { email: TEST_EMAIL })
check('Forgot password returns 200', forgotPw.status === 200, forgotPw.status)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n🔐 AUTH — Invalid token for protected route')
const invalidTok = await req('GET', '/cvs', null, 'not-a-valid-token')
check('Invalid token rejected', invalidTok.status === 401, invalidTok.status)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📄 CVs — Missing required fields')
const cvNoTitle = await req('POST', '/cvs', { targetRole: 'SWE' }, freshToken)
check('CV without title rejected', cvNoTitle.status === 400, cvNoTitle.status)

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n💼 Applications — Missing required fields')
const appNoName = await req('POST', '/applications', { jobTitle: 'SWE' }, freshToken)
check('App without companyName rejected', [400, 403].includes(appNoName.status), appNoName.status)

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
console.log('\n' + '═'.repeat(60))
console.log(`📊 RESULTS: ${pass} passed, ${fail} failed out of ${pass + fail} tests`)
if (fail > 0) {
  console.log('\n❌ Failed tests:')
  results.filter(r => !r.ok).forEach(r => console.log(`   - ${r.name}`))
}
console.log('═'.repeat(60))

if (stripeUrl) {
  console.log(`\n💳 Stripe checkout URL (for manual payment test):\n   ${stripeUrl}\n`)
}
