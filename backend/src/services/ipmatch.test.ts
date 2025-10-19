import { ipMatches, isValidIpOrCidr, isPrivateIp } from './ipmatch';

describe('IP Matching Service', () => {
  describe('ipMatches', () => {
    test('should match exact IPv4 address', () => {
      expect(ipMatches('192.168.1.1', '192.168.1.1')).toBe(true);
      expect(ipMatches('192.168.1.1', '192.168.1.2')).toBe(false);
    });

    test('should match IPv4 CIDR range', () => {
      expect(ipMatches('192.168.1.10', '192.168.1.0/24')).toBe(true);
      expect(ipMatches('192.168.2.10', '192.168.1.0/24')).toBe(false);
    });

    test('should match exact IPv6 address', () => {
      expect(ipMatches('2001:db8::1', '2001:db8::1')).toBe(true);
      expect(ipMatches('2001:db8::1', '2001:db8::2')).toBe(false);
    });

    test('should match IPv6 CIDR range', () => {
      expect(ipMatches('2001:db8::10', '2001:db8::/32')).toBe(true);
      expect(ipMatches('2001:db9::10', '2001:db8::/32')).toBe(false);
    });

    test('should not match IPv4 and IPv6', () => {
      expect(ipMatches('192.168.1.1', '2001:db8::1')).toBe(false);
      expect(ipMatches('2001:db8::1', '192.168.1.1')).toBe(false);
    });

    test('should handle invalid input gracefully', () => {
      expect(ipMatches('invalid', '192.168.1.1')).toBe(false);
      expect(ipMatches('192.168.1.1', 'invalid')).toBe(false);
    });
  });

  describe('isValidIpOrCidr', () => {
    test('should validate IPv4 addresses', () => {
      expect(isValidIpOrCidr('192.168.1.1')).toBe(true);
      expect(isValidIpOrCidr('10.0.0.1')).toBe(true);
      expect(isValidIpOrCidr('256.1.1.1')).toBe(false);
    });

    test('should validate IPv4 CIDR', () => {
      expect(isValidIpOrCidr('192.168.1.0/24')).toBe(true);
      expect(isValidIpOrCidr('10.0.0.0/8')).toBe(true);
      expect(isValidIpOrCidr('192.168.1.0/33')).toBe(false);
    });

    test('should validate IPv6 addresses', () => {
      expect(isValidIpOrCidr('2001:db8::1')).toBe(true);
      expect(isValidIpOrCidr('::1')).toBe(true);
      expect(isValidIpOrCidr('gggg::1')).toBe(false);
    });

    test('should validate IPv6 CIDR', () => {
      expect(isValidIpOrCidr('2001:db8::/32')).toBe(true);
      expect(isValidIpOrCidr('::/0')).toBe(true);
      expect(isValidIpOrCidr('2001:db8::/129')).toBe(false);
    });

    test('should reject invalid input', () => {
      expect(isValidIpOrCidr('')).toBe(false);
      expect(isValidIpOrCidr('invalid')).toBe(false);
      expect(isValidIpOrCidr('192.168.1')).toBe(false);
    });
  });

  describe('isPrivateIp', () => {
    test('should identify private IPv4 addresses', () => {
      expect(isPrivateIp('192.168.1.1')).toBe(true);
      expect(isPrivateIp('10.0.0.1')).toBe(true);
      expect(isPrivateIp('172.16.0.1')).toBe(true);
      expect(isPrivateIp('127.0.0.1')).toBe(true);
    });

    test('should identify public IPv4 addresses', () => {
      expect(isPrivateIp('8.8.8.8')).toBe(false);
      expect(isPrivateIp('1.1.1.1')).toBe(false);
    });

    test('should handle invalid input', () => {
      expect(isPrivateIp('invalid')).toBe(false);
    });
  });
});
