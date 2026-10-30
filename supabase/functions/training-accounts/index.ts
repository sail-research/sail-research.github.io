import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

// This endpoint never accepts a role or returns/stores a plaintext password.
// Every request verifies the live Auth identity and its current database role.
const allowedOrigins = new Set(['https://www.sail-research.com', 'https://sail-research.com', 'http://127.0.0.1:4323', 'http://127.0.0.1:4325']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
class RequestError extends Error { constructor(message: string, public status = 400) { super(message); } }

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin' };
  if (origin && allowedOrigins.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  headers['Access-Control-Allow-Headers'] = 'authorization, apikey, content-type, x-client-info';
  headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !allowedOrigins.has(origin)) return respond({ error: 'Origin is not allowed.' }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return respond({ error: 'Use POST.' }, 405);
  try {
    const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) throw new RequestError('Sign in is required.', 401);
    const api = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
    const auth = await api.auth.getUser(token);
    if (auth.error || !auth.data.user) throw new RequestError('Your session is invalid. Sign in again.', 401);
    const caller = await api.from('training_profiles').select('id,role').eq('auth_user_id', auth.data.user.id).maybeSingle();
    if (caller.error) throw new RequestError('Unable to verify account access.', 503);
    if (!caller.data || !['admin', 'super_admin'].includes(caller.data.role)) throw new RequestError('Only a program admin can manage student accounts.', 403);
    if (!req.headers.get('content-type')?.includes('application/json')) throw new RequestError('Use a JSON request.');
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > 8192) throw new RequestError('Request is too large.', 413);
    let body: Record<string, unknown>;
    try { body = JSON.parse(raw); } catch { throw new RequestError('Invalid JSON.'); }
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new RequestError('Invalid request.');
    if ('role' in body || 'user_metadata' in body || 'app_metadata' in body) throw new RequestError('Account roles cannot be set here.');
    const text = (name: string) => typeof body[name] === 'string' ? (body[name] as string).trim() : '';
    const password = () => {
      const value = typeof body.password === 'string' ? body.password : '';
      if (value.length < 12 || new TextEncoder().encode(value).length > 72) throw new RequestError('Use a password of at least 12 characters and at most 72 UTF-8 bytes.');
      return value;
    };
    if (body.action === 'reset_password') {
      const id = text('profile_id');
      if (!uuid.test(id)) throw new RequestError('Choose a student account.');
      const student = await api.from('training_profiles').select('id,auth_user_id,role').eq('id', id).maybeSingle();
      if (student.error) throw new RequestError('Unable to load the student account.', 503);
      if (student.data?.role !== 'student') throw new RequestError('Password reset is limited to student accounts.', 403);
      const result = await api.auth.admin.updateUserById(student.data.auth_user_id, { password: password(), email_confirm: true });
      if (result.error) throw new RequestError('Password could not be reset. Please retry.', 503);
      return respond({ profile_id: id, password_updated: true });
    }
    if (!['create_student', 'enroll_student'].includes(String(body.action))) throw new RequestError('Unknown account action.');
    const trackId = text('track_id');
    if (!uuid.test(trackId)) throw new RequestError('Choose a training course.');
    const track = await api.from('training_tracks').select('id').eq('id', trackId).eq('is_active', true).maybeSingle();
    if (track.error) throw new RequestError('Unable to load the training course.', 503);
    if (!track.data) throw new RequestError('This course is unavailable for enrollment.');
    let userId: string, email: string, fullName: string, affiliation: string;
    let createdId: string | undefined;
    if (body.action === 'create_student') {
      email = text('email').toLowerCase(); fullName = text('full_name'); affiliation = text('affiliation');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new RequestError('Enter a valid student email.');
      if (fullName.length < 2 || fullName.length > 150 || affiliation.length > 200) throw new RequestError('Enter a full name (2–150 characters) and an affiliation up to 200 characters.');
      const created = await api.auth.admin.createUser({ email, password: password(), email_confirm: true });
      if (created.error || !created.data.user) {
        if (created.error?.code === 'email_exists' || created.error?.code === 'user_already_exists') throw new RequestError('This account already exists. Use Enroll existing student, or reset its password from the student record.', 409);
        throw new RequestError('Student account could not be created. Check the email and password, then retry.', 400);
      }
      userId = created.data.user.id; createdId = userId;
    } else {
      const id = text('profile_id');
      if (!uuid.test(id)) throw new RequestError('Choose a student account.');
      const student = await api.from('training_profiles').select('auth_user_id,email,full_name,affiliation,role').eq('id', id).maybeSingle();
      if (student.error) throw new RequestError('Unable to load the student account.', 503);
      if (student.data?.role !== 'student') throw new RequestError('Choose an existing student account.');
      userId = student.data.auth_user_id; email = student.data.email; fullName = student.data.full_name; affiliation = student.data.affiliation || '';
      const identity = await api.auth.admin.getUserById(userId);
      if (identity.error || !identity.data.user?.email_confirmed_at || identity.data.user.email?.toLowerCase() !== email.toLowerCase()) throw new RequestError('The student account needs administrator attention before enrollment.');
    }
    const provisioned = await api.rpc('provision_training_student', { target_auth_user_id: userId, student_email: email, student_name: fullName, student_affiliation: affiliation, target_track_id: trackId });
    if (provisioned.error) {
      // Compensate only for an Auth identity created in this exact request.
      if (createdId) {
        const cleanup = await api.auth.admin.deleteUser(createdId);
        if (cleanup.error) throw new RequestError('Enrollment failed. Ask a program administrator to inspect the new account before retrying.', 503);
      }
      throw new RequestError('Student enrollment could not be saved. Please retry.', 503);
    }
    return respond({ enrollment: provisioned.data, email, full_name: fullName, created: !!createdId }, createdId ? 201 : 200);
  } catch (error) {
    if (error instanceof RequestError) return respond({ error: error.message }, error.status);
    // Do not log the request body, credentials, Auth user payload, or provider errors.
    return respond({ error: 'Account service is temporarily unavailable. Please retry.' }, 503);
  }
});
