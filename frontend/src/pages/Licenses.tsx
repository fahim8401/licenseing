import { useState, useEffect } from 'react';
import { getLicenses, createLicense, deleteLicense, updateLicense } from '../services/api';
import type { License } from '../types';

export default function Licenses() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    license_key: '',
    expires_at: '',
  });

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    try {
      const res = await getLicenses();
      setLicenses(res.data);
    } catch (error) {
      console.error('Error loading licenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLicense({
        name: formData.name || undefined,
        license_key: formData.license_key || undefined,
        expires_at: formData.expires_at || undefined,
      });
      setShowForm(false);
      setFormData({ name: '', license_key: '', expires_at: '' });
      loadLicenses();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create license');
    }
  };

  const handleToggleActive = async (license: License) => {
    try {
      await updateLicense(license.id, { active: !license.active });
      loadLicenses();
    } catch (error) {
      alert('Failed to update license');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this license?')) return;
    try {
      await deleteLicense(id);
      loadLicenses();
    } catch (error) {
      alert('Failed to delete license');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Licenses</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your license keys and their configurations.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            {showForm ? 'Cancel' : 'Create License'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mt-6 bg-white shadow sm:rounded-lg p-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="license_key" className="block text-sm font-medium text-gray-700">
                License Key (optional, auto-generated if empty)
              </label>
              <input
                type="text"
                id="license_key"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                value={formData.license_key}
                onChange={(e) => setFormData({ ...formData, license_key: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700">
                Expires At (optional)
              </label>
              <input
                type="datetime-local"
                id="expires_at"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Create
            </button>
          </form>
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">License Key</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Expires</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {licenses.map((license) => (
                    <tr key={license.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {license.name || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-gray-500">
                        {license.license_key}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                          ${license.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {license.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 space-x-2">
                        <a
                          href={`/licenses/${license.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleToggleActive(license)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          {license.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(license.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
