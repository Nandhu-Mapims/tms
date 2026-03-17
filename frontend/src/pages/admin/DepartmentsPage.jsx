import { useEffect, useState } from 'react';
import EntityManagementPage from '../../components/admin/EntityManagementPage.jsx';
import { createDepartment, deleteDepartment, getDepartments, updateDepartment } from '../../services/masterDataService';
import { useAuth } from '../../hooks/useAuth';

function DepartmentsPage() {
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
      const response = await getDepartments({ search: appliedSearch });
      setItems(response.data);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to load departments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [appliedSearch]);

  const submitCreate = async (payload) => {
    await createDepartment(payload);
    await loadItems();
  };

  const submitUpdate = async (item, payload) => {
    await updateDepartment(item.id, payload);
    await loadItems();
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete department "${item.name}"?`)) return;
    await deleteDepartment(item.id);
    await loadItems();
  };

  const handleToggle = async (item) => {
    await updateDepartment(item.id, { ...item, isActive: !item.isActive });
    await loadItems();
  };

  return (
    <EntityManagementPage
      title="Departments"
      subtitle="Manage hospital departments used for routing and reporting."
      items={items}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'description', label: 'Description' },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true, colClass: 'col-md-6' },
        { name: 'code', label: 'Code', required: true, colClass: 'col-md-6' },
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
      modalTitle="Department"
    />
  );
}

export default DepartmentsPage;
