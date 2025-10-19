import { useState, useEffect } from 'react';
import { getLicenses, getLogStats, getLogs } from '../services/api';
import type { License, LogStats, AuthLog } from '../types';

export default function Dashboard() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuthLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [licensesRes, statsRes, logsRes] = await Promise.all([
        getLicenses(),
        getLogStats(),
        getLogs({ page: 1, perPage: 10 }),
      ]);
      setLicenses(licensesRes.data);
      setStats(statsRes.data);
      setRecentLogs(logsRes.data.logs);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const activeLicenses = licenses.filter(l => l.active).length;
  const totalIPs = licenses.reduce((acc, l) => acc + (l.allowed_ips?.length || 0), 0);

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Licenses</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{licenses.length}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Active Licenses</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">{activeLicenses}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total IPs</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{totalIPs}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Auth Logs (24h)</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats ? Object.values(stats.last24Hours).reduce((a, b) => a + b, 0) : 0}
            </dd>
          </div>
        </div>
      </div>

      {/* Recent Auth Logs */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Authentication Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.license_key?.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.request_ip}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${log.result === 'allowed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {log.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
