import { RouterOSAPI } from 'routeros-client';
import { MikroTikConfig } from '../types';

let config: MikroTikConfig;

export function initMikroTik(mtConfig: MikroTikConfig) {
  config = mtConfig;
}

async function getConnection(retries = 3): Promise<RouterOSAPI> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const api = new RouterOSAPI({
        host: config.host,
        user: config.user,
        password: config.pass,
        port: config.port,
        timeout: 10,
      });
      
      await api.connect();
      return api;
    } catch (error) {
      console.error(`MikroTik connection attempt ${attempt} failed:`, error);
      if (attempt === retries) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error('Failed to connect to MikroTik');
}

/**
 * Ensure the address list exists
 */
async function ensureAddressList(api: RouterOSAPI): Promise<void> {
  try {
    const lists = await api.write('/ip/firewall/address-list/print', [
      `?list=${config.addressList}`,
    ]);
    
    if (lists.length === 0) {
      console.log(`Address list ${config.addressList} does not exist, it will be created on first IP add`);
    }
  } catch (error) {
    console.error('Error checking address list:', error);
  }
}

/**
 * Ensure NAT rule exists
 */
async function ensureNatRule(api: RouterOSAPI): Promise<void> {
  try {
    const rules = await api.write('/ip/firewall/nat/print', [
      '?chain=srcnat',
      `?src-address-list=${config.addressList}`,
      `?out-interface=${config.interface}`,
    ]);
    
    if (rules.length === 0) {
      console.log('Creating NAT rule for licensed IPs');
      await api.write('/ip/firewall/nat/add', [
        '=chain=srcnat',
        `=src-address-list=${config.addressList}`,
        `=out-interface=${config.interface}`,
        `=to-addresses=${config.publicNatIp}`,
        '=action=src-nat',
        '=comment=Auto-created by License System',
      ]);
      console.log('NAT rule created successfully');
    } else {
      console.log('NAT rule already exists');
    }
  } catch (error) {
    console.error('Error ensuring NAT rule:', error);
    throw error;
  }
}

/**
 * Add an IP address to the MikroTik address list
 */
export async function addIpToMikroTik(ipCidr: string, licenseId: number): Promise<void> {
  if (!config || !config.enabled) {
    console.log('MikroTik sync disabled');
    return;
  }

  let api: RouterOSAPI | null = null;
  try {
    api = await getConnection();
    
    // Ensure address list exists
    await ensureAddressList(api);
    
    // Ensure NAT rule exists
    await ensureNatRule(api);
    
    // Add IP to address list
    await api.write('/ip/firewall/address-list/add', [
      `=list=${config.addressList}`,
      `=address=${ipCidr}`,
      `=comment=License:${licenseId}`,
    ]);
    
    console.log(`Added ${ipCidr} to MikroTik address list ${config.addressList}`);
  } catch (error) {
    console.error('Error adding IP to MikroTik:', error);
    throw error;
  } finally {
    if (api) {
      api.close();
    }
  }
}

/**
 * Remove an IP address from the MikroTik address list
 */
export async function removeIpFromMikroTik(ipCidr: string, licenseId: number): Promise<void> {
  if (!config || !config.enabled) {
    console.log('MikroTik sync disabled');
    return;
  }

  let api: RouterOSAPI | null = null;
  try {
    api = await getConnection();
    
    // Find and remove the address
    const addresses = await api.write('/ip/firewall/address-list/print', [
      `?list=${config.addressList}`,
      `?address=${ipCidr}`,
      `?comment=License:${licenseId}`,
    ]);
    
    for (const addr of addresses) {
      await api.write('/ip/firewall/address-list/remove', [
        `=.id=${addr['.id']}`,
      ]);
      console.log(`Removed ${ipCidr} from MikroTik address list`);
    }
  } catch (error) {
    console.error('Error removing IP from MikroTik:', error);
    throw error;
  } finally {
    if (api) {
      api.close();
    }
  }
}

/**
 * Sync all IPs from database to MikroTik (for manual sync operations)
 */
export async function syncAllIpsToMikroTik(ips: Array<{ ip_cidr: string; license_id: number }>): Promise<void> {
  if (!config || !config.enabled) {
    console.log('MikroTik sync disabled');
    return;
  }

  let api: RouterOSAPI | null = null;
  try {
    api = await getConnection();
    
    // Ensure NAT rule exists
    await ensureNatRule(api);
    
    // Get existing addresses
    const existing = await api.write('/ip/firewall/address-list/print', [
      `?list=${config.addressList}`,
    ]);
    
    // Remove all existing addresses in our list
    for (const addr of existing) {
      await api.write('/ip/firewall/address-list/remove', [
        `=.id=${addr['.id']}`,
      ]);
    }
    
    // Add all IPs from database
    for (const ip of ips) {
      await api.write('/ip/firewall/address-list/add', [
        `=list=${config.addressList}`,
        `=address=${ip.ip_cidr}`,
        `=comment=License:${ip.license_id}`,
      ]);
    }
    
    console.log(`Synced ${ips.length} IPs to MikroTik`);
  } catch (error) {
    console.error('Error syncing IPs to MikroTik:', error);
    throw error;
  } finally {
    if (api) {
      api.close();
    }
  }
}
