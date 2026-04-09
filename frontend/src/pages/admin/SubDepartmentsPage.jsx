import { useEffect, useMemo, useState } from 'react';
import EntityManagementPage from '../../components/admin/EntityManagementPage.jsx';
import {
  createSubDepartment,
  deleteSubDepartment,
  getDepartments,
  getSubDepartments,
  updateSubDepartment,
} from '../../services/masterDataService';
import { useAuth } from '../../hooks/useAuth';

function SubDepartmentsPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN';
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const [subDeptResponse, deptResponse] = await Promise.all([
        getSubDepartments({ search: appliedSearch }),
        getDepartments({ isActive: true }),
      ]);
      setItems(subDeptResponse.data);
      setDepartments(deptResponse.data);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to load sub-departments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [appliedSearch]);

  const departmentOptions = useMemo(
    () => departments.map((dept) => ({ value: String(dept.id), label: `${dept.name} (${dept.code})` })),
    [departments]
  );

  const submitCreate = async (payload) => {
    await createSubDepartment(payload);
    await loadItems();
  };

  const submitUpdate = async (item, payload) => {
    await updateSubDepartment(item.id, payload);
    await loadItems();
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete sub-department "${item.name}"?`)) return;
    await deleteSubDepartment(item.id);
    await loadItems();
  };

  const handleToggle = async (item) => {
    await updateSubDepartment(item.id, {
      ...item,
      departmentId: item.departmentId,
      isActive: !item.isActive,
    });
    await loadItems();
  };

  return (
    <EntityManagementPage
      title="Sub-Departments"
      subtitle="Manage sub-departments under each hospital department."
      items={items}
      columns={[
        {
          key: 'department',
          label: 'Department',
          render: (item) => item.department?.name || 'Not available',
        },
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'description', label: 'Description' },
      ]}
      fields={[
        { name: 'departmentId', label: 'Department', type: 'select', required: true, options: departmentOptions, colClass: 'col-md-6' },
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
      modalTitle="Sub-Department"
    />
  );
}

export default SubDepartmentsPage;
