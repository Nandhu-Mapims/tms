import { useEffect, useState } from 'react';
import EntityManagementPage from '../../components/admin/EntityManagementPage.jsx';
import { createSlaConfig, deleteSlaConfig, getSlaConfigs, updateSlaConfig } from '../../services/masterDataService';
import { useAuth } from '../../hooks/useAuth';

function SlaSettingsPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN';
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const response = await getSlaConfigs({ search: appliedSearch });
      setItems(response.data);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to load SLA settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [appliedSearch]);

  const submitCreate = async (payload) => {
    await createSlaConfig({
      ...payload,
      firstResponseMinutes: Number(payload.firstResponseMinutes),
      resolutionMinutes: Number(payload.resolutionMinutes),
      escalationMinutes: Number(payload.escalationMinutes),
    });
    await loadItems();
  };

  const submitUpdate = async (item, payload) => {
    await updateSlaConfig(item.id, {
      ...payload,
      firstResponseMinutes: Number(payload.firstResponseMinutes),
      resolutionMinutes: Number(payload.resolutionMinutes),
      escalationMinutes: Number(payload.escalationMinutes),
    });
    await loadItems();
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete SLA setting for ${item.priority}?`)) return;
    await deleteSlaConfig(item.id);
    await loadItems();
  };

  const handleToggle = async (item) => {
    await updateSlaConfig(item.id, { ...item, isActive: !item.isActive });
    await loadItems();
  };

  return (
    <EntityManagementPage
      title="SLA Settings"
      subtitle="Configure response, resolution, and escalation targets by priority."
      items={items}
      columns={[
        { key: 'priority', label: 'Priority' },
        { key: 'firstResponseMinutes', label: 'First Response (mins)' },
        { key: 'resolutionMinutes', label: 'Resolution (mins)' },
        { key: 'escalationMinutes', label: 'Escalation (mins)' },
      ]}
      fields={[
        {
          name: 'priority',
          label: 'Priority',
          type: 'select',
          required: true,
          options: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((value) => ({ value, label: value })),
          colClass: 'col-md-6',
        },
        { name: 'firstResponseMinutes', label: 'First Response Minutes', type: 'number', min: 1, required: true, colClass: 'col-md-6' },
        { name: 'resolutionMinutes', label: 'Resolution Minutes', type: 'number', min: 1, required: true, colClass: 'col-md-6' },
        { name: 'escalationMinutes', label: 'Escalation Minutes', type: 'number', min: 1, required: true, colClass: 'col-md-6' },
        { name: 'isActive', label: 'Active', type: 'checkbox', colClass: 'col-12' },
      ]}
      searchValue={search}
      onSearchChange={setSearch}
      onSearchSubmit={() => setAppliedSearch(search)}
      onReset={() => {
        setSearch('');
        setAppliedSearch('');
      }}
      isLoading={isLoading}
      errorMessage={errorMessage}
      canManage={canManage}
      onCreate={submitCreate}
      onUpdate={submitUpdate}
      onDelete={handleDelete}
      onToggleStatus={handleToggle}
      modalTitle="SLA Setting"
    />
  );
}

export default SlaSettingsPage;
