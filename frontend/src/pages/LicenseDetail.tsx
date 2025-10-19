import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getLicense, addIP, removeIP } from '../services/api';
import type { License } from '../types';

export default function LicenseDetail() {
  const { id } = useParams<{ id: string }>();
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ip_cidr: '', note: '' });

  useEffect(() => {
    if (id) {
      loadLicense();
    }
  }, [id]);

  const loadLicense = async () => {
    try {
      const res = await getLicense(parseInt(id!));
      setLicense(res.data);
    } catch (error) {
      console.error('Error loading license:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addIP(parseInt(id!), formData);
      setShowForm(false);
      setFormData({ ip_cidr: '', note: '' });
      loadLicense();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add IP');
    }
  };

  const handleRemoveIP = async (ipId: number) => {
    if (!confirm('Are you sure you want to remove this IP?')) return;
    try {
      await removeIP(parseInt(id!), ipId);
      loadLicense();
    } catch (error) {
      alert('Failed to remove IP');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!license) {
    return <div className="text-center py-8">License not found</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <a href="/licenses" className="text-indigo-600 hover:text-indigo-900">
          ← Back to Licenses
        </a>
      </div>

      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">License Details</h3>
          <div className="mt-5 border-t border-gray-200 pt-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{license.name || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">License Key</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{license.license_key}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                    ${license.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {license.active ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Expires At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {license.expires_at ? new Date(license.expires_at).toLocaleString() : 'Never'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(license.created_at).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Allowed IPs</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            {showForm ? 'Cancel' : 'Add IP'}
          </button>
        </div>

        {showForm && (
          <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
            <form onSubmit={handleAddIP} className="space-y-4">
              <div>
                <label htmlFor="ip_cidr" className="block text-sm font-medium text-gray-700">
                  IP Address or CIDR
                </label>
                <input
                  type="text"
                  id="ip_cidr"
                  required
                  placeholder="e.g., 192.168.1.1 or 192.168.1.0/24"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={formData.ip_cidr}
                  onChange={(e) => setFormData({ ...formData, ip_cidr: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                  Note (optional)
                </label>
                <input
                  type="text"
                  id="note"
                  placeholder="e.g., Customer A WAN"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                Add IP
              </button>
            </form>
          </div>
        )}

        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP/CIDR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {license.allowed_ips?.map((ip) => (
                <tr key={ip.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {ip.ip_cidr}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ip.note || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ip.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleRemoveIP(ip.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!license.allowed_ips || license.allowed_ips.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              No IPs configured. Add an IP to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
