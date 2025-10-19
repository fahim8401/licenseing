import * as ipaddr from 'ipaddr.js';

/**
 * Check if an IP address matches a CIDR range or exact IP
 * @param requestIp The IP address to check
 * @param allowedCidr The allowed IP or CIDR range
 * @returns true if the IP matches
 */
export function ipMatches(requestIp: string, allowedCidr: string): boolean {
  try {
    // Parse the request IP
    const addr = ipaddr.parse(requestIp);
    
    // Check if allowedCidr contains a slash (CIDR notation)
    if (allowedCidr.includes('/')) {
      // CIDR range
      const [rangeAddr, rangeBits] = ipaddr.parseCIDR(allowedCidr);
      
      // Ensure IP kinds match (IPv4 vs IPv6)
      if (addr.kind() !== rangeAddr.kind()) {
        return false;
      }
      
      return addr.match(rangeAddr, rangeBits);
    } else {
      // Exact IP match
      const allowedAddr = ipaddr.parse(allowedCidr);
      
      // Ensure IP kinds match
      if (addr.kind() !== allowedAddr.kind()) {
        return false;
      }
      
      return addr.toString() === allowedAddr.toString();
    }
  } catch (error) {
    console.error('Error matching IP:', error);
    return false;
  }
}

/**
 * Validate if a string is a valid IP address or CIDR
 * @param ipOrCidr The IP or CIDR string to validate
 * @returns true if valid
 */
export function isValidIpOrCidr(ipOrCidr: string): boolean {
  try {
    if (ipOrCidr.includes('/')) {
      ipaddr.parseCIDR(ipOrCidr);
    } else {
      ipaddr.parse(ipOrCidr);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if an IP is a private IP address
 * @param ip The IP address to check
 * @returns true if private
 */
export function isPrivateIp(ip: string): boolean {
  try {
    const addr = ipaddr.parse(ip);
    if (addr.kind() === 'ipv4') {
      return (addr as ipaddr.IPv4).range() !== 'unicast';
    } else {
      const range = (addr as ipaddr.IPv6).range();
      return range !== 'unicast';
    }
  } catch {
    return false;
  }
}
