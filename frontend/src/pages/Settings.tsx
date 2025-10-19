export default function Settings() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">MikroTik Configuration</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              MikroTik integration settings are configured via environment variables on the backend.
              Please update the .env file on the server to modify these settings.
            </p>
          </div>
          <div className="mt-5">
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Environment Variables</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>ENABLE_MIKROTIK_SYNC - Enable/disable MikroTik synchronization</li>
                      <li>MT_HOST - MikroTik router IP address</li>
                      <li>MT_USER - MikroTik API username</li>
                      <li>MT_PASS - MikroTik API password</li>
                      <li>MT_PORT - MikroTik API port (default: 8728)</li>
                      <li>MT_INTERFACE - WAN interface name</li>
                      <li>MT_PUBLIC_NAT_IP - Public NAT IP address</li>
                      <li>MT_ADDRESS_LIST - Address list name (default: LICENSED_IPS)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">API Keys</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              Your API keys are stored securely in environment variables. Update them in the .env file:
            </p>
          </div>
          <div className="mt-5">
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li><strong>ADMIN_API_KEY</strong> - Used for admin panel access</li>
              <li><strong>INSTALLER_API_KEY</strong> - Used by installer scripts for authentication</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">About</h3>
          <div className="mt-2 text-sm text-gray-500">
            <p className="mb-2">
              <strong>IP-based License Authentication Platform</strong>
            </p>
            <p>
              This system provides license key validation based on IP addresses and CIDR ranges,
              with optional integration to MikroTik RouterOS for automatic NAT management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
