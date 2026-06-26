const requireProfile = require('../../middleware/requireProfile');

function fakeReq(profileComplete, role) {
  return { user: { profileComplete, role } };
}

function fakeRes() {
  return {
    _status: null, _json: null,
    status(c) { this._status = c; return this; },
    json(d) { this._json = d; return this; }
  };
}

test('blocks user with incomplete profile', () => {
  const req = fakeReq(false, 'user');
  const res = fakeRes();
  const next = jest.fn();
  requireProfile(req, res, next);
  expect(res._status).toBe(403);
  expect(res._json).toMatchObject({ redirect: '/onboarding.html' });
  expect(next).not.toHaveBeenCalled();
});

test('allows user with complete profile', () => {
  const req = fakeReq(true, 'user');
  const res = fakeRes();
  const next = jest.fn();
  requireProfile(req, res, next);
  expect(next).toHaveBeenCalled();
});

test('admin bypasses profileComplete check', () => {
  const req = fakeReq(false, 'admin');
  const res = fakeRes();
  const next = jest.fn();
  requireProfile(req, res, next);
  expect(next).toHaveBeenCalled();
});
