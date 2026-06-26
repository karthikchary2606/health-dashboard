const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const authenticate = require('../../middleware/authenticate');
const User = require('../../models/User');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

function makeReqRes(token) {
  const req = { headers: { authorization: token ? `Bearer ${token}` : undefined } };
  const res = {
    _status: null,
    _json: null,
    status(code) { this._status = code; return this; },
    json(data) { this._json = data; return this; }
  };
  return { req, res };
}

test('rejects request with no token', async () => {
  const { req, res } = makeReqRes(null);
  const next = jest.fn();
  await authenticate(req, res, next);
  expect(res._status).toBe(401);
  expect(next).not.toHaveBeenCalled();
});

test('rejects request with invalid token', async () => {
  const { req, res } = makeReqRes('bad-token');
  const next = jest.fn();
  await authenticate(req, res, next);
  expect(res._status).toBe(401);
});

test('rejects unapproved user', async () => {
  const user = await User.create({
    name: 'Test', email: 'unapp@test.com',
    passwordHash: 'x', isApproved: false
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  const { req, res } = makeReqRes(token);
  const next = jest.fn();
  await authenticate(req, res, next);
  expect(res._status).toBe(403);
  expect(next).not.toHaveBeenCalled();
});

test('attaches full user doc and calls next for approved user', async () => {
  const user = await User.create({
    name: 'Approved', email: 'app@test.com',
    passwordHash: 'x', isApproved: true
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  const { req, res } = makeReqRes(token);
  const next = jest.fn();
  await authenticate(req, res, next);
  expect(next).toHaveBeenCalled();
  expect(req.user).toBeDefined();
  expect(req.user.email).toBe('app@test.com');
  expect(req.user.profileComplete).toBeDefined();
});
