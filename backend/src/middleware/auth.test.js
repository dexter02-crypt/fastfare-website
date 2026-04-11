// auth.test.js
import { protect, admin } from './auth.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ScanPartner from '../models/ScanPartner.js';
import httpMocks from 'node-mocks-http';

jest.mock('jsonwebtoken');
jest.mock('../models/User.js');
jest.mock('../models/ScanPartner.js');

describe('JWT Middleware - protect', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest({ headers: {} });
    res = httpMocks.createResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('should reject request when no Authorization header', async () => {
    await protect(req, res, next);
    expect(res.statusCode).toBe(401);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Not authorized, no token');
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject request when token is expired', async () => {
    req.headers.authorization = 'Bearer expiredToken';
    const tokenError = new jwt.TokenExpiredError('jwt expired', new Date());
    // @ts-ignore
    jwt.verify.mockImplementation(() => { throw tokenError; });
    await protect(req, res, next);
    expect(res.statusCode).toBe(401);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Not authorized, token failed');
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject request when token is tampered', async () => {
    req.headers.authorization = 'Bearer badToken';
    // @ts-ignore
    jwt.verify.mockImplementation(() => { throw new jwt.JsonWebTokenError('invalid token'); });
    await protect(req, res, next);
    expect(res.statusCode).toBe(401);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Not authorized, token failed');
    expect(next).not.toHaveBeenCalled();
  });

  test('should attach regular user to req and call next', async () => {
    req.headers.authorization = 'Bearer goodUserToken';
    const decoded = { id: 'user123', role: 'user' };
    // @ts-ignore
    jwt.verify.mockReturnValue(decoded);
    const mockUser = { _id: 'user123', email: 'test@example.com', role: 'user' };
    // @ts-ignore
    User.findById.mockResolvedValue(mockUser);
    await protect(req, res, next);
    expect(User.findById).toHaveBeenCalledWith('user123');
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  test('should attach scan partner to req and call next', async () => {
    req.headers.authorization = 'Bearer goodPartnerToken';
    const decoded = { id: 'partner123', role: 'scan_partner' };
    // @ts-ignore
    jwt.verify.mockReturnValue(decoded);
    const mockPartner = { _id: 'partner123', name: 'Partner Co', phone: '1234567890' };
    // @ts-ignore
    ScanPartner.findById.mockResolvedValue(mockPartner);
    await protect(req, res, next);
    expect(ScanPartner.findById).toHaveBeenCalledWith('partner123');
    expect(req.user).toMatchObject({
      _id: mockPartner._id,
      name: mockPartner.name,
      phone: mockPartner.phone,
      role: 'scan_partner',
      businessName: mockPartner.name,
    });
    expect(next).toHaveBeenCalled();
  });
});

describe('JWT Middleware - admin', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
  });

  test('allows admin role', () => {
    req.user = { role: 'admin' };
    admin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('blocks non‑admin role', () => {
    req.user = { role: 'user' };
    admin(req, res, next);
    expect(res.statusCode).toBe(403);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Not authorized as admin');
    expect(next).not.toHaveBeenCalled();
  });
});
