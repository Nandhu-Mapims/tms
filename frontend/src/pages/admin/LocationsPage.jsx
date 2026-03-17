import { useEffect, useState } from 'react';
import EntityManagementPage from '../../components/admin/EntityManagementPage.jsx';
import { createLocation, deleteLocation, getLocations, updateLocation } from '../../services/masterDataService';
import { useAuth } from '../../hooks/useAuth';

function LocationsPage() {
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
      const response = await getLocations({ search: appliedSearch });
      setItems(response.data);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to load locations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [appliedSearch]);

  const submitCreate = async (payload) => {
    await createLocation(payload);
    await loadItems();
  };

  const submitUpdate = async (item, payload) => {
    await updateLocation(item.id, payload);
    await loadItems();
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this location?')) return;
    await deleteLocation(item.id);
    await loadItems();
  };

  const handleToggle = async (item) => {
    await updateLocation(item.id, { ...item, isActive: !item.isActive });
    await loadItems();
  };

  return (
    <EntityManagementPage
      title="Locations"
      subtitle="Maintain hospital blocks, wards, floors, rooms, and units."
      items={items}
      columns={[
        { key: 'block', label: 'Block' },
        { key: 'floor', label: 'Floor' },
        { key: 'ward', label: 'Ward' },
        { key: 'room', label: 'Room' },
        { key: 'unit', label: 'Unit' },
      ]}
      fields={[
        { name: 'block', label: 'Block', required: true, colClass: 'col-md-6' },
        { name: 'floor', label: 'Floor', colClass: 'col-md-6' },
        { name: 'ward', label: 'Ward', colClass: 'col-md-6' },
        { name: 'room', label: 'Room', colClass: 'col-md-6' },
        { name: 'unit', label: 'Unit', colClass: 'col-md-6' },
        { name: 'description', label: 'Description', type: 'textarea', colClass: 'col-12' },
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
      modalTitle="Location"
    />
  );
}

export default LocationsPage;
