import { useEffect, useMemo, useState } from 'react';
import EntityManagementPage from '../../components/admin/EntityManagementPage.jsx';
import { useToast } from '../../hooks/useToast';
import { getDepartments } from '../../services/masterDataService';
import { getUsersRequest, registerUserRequest, updateUserRequest, updateUserStatusRequest } from '../../services/authService';
import { getErrorMessage } from '../../utils/getErrorMessage';

function UserManagementPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const departmentOptions = useMemo(
    () =>
      departments.map((department) => ({
        value: department.id,
        label: `${department.name} (${department.code})`,
      })),
    [departments]
  );

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const [usersResponse, departmentsResponse] = await Promise.all([
        getUsersRequest({ search: appliedSearch }),
        getDepartments({ isActive: true }),
      ]);

      setItems(usersResponse.data);
      setDepartments(departmentsResponse.data);
      setErrorMessage('');
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to load users.');
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [appliedSearch]);

  const submitCreate = async (payload) => {
    await registerUserRequest({
      ...payload,
      fullName: payload.fullName.trim(),
      empId: payload.empId.trim(),
      email: payload.email ? payload.email.trim() : '',
      phone: payload.phone ? payload.phone.trim() : '',
      departmentId: payload.departmentId ? Number(payload.departmentId) : null,
    });
    await loadItems();
  };

  const submitUpdate = async (item, payload) => {
    const updatePayload = {
      fullName: payload.fullName.trim(),
      empId: payload.empId.trim(),
      email: payload.email ? payload.email.trim() : '',
      phone: payload.phone ? payload.phone.trim() : '',
      role: payload.role,
      departmentId: payload.departmentId ? Number(payload.departmentId) : null,
    };

    if (payload.password) {
      updatePayload.password = payload.password;
    }

    await updateUserRequest(item.id, updatePayload);
    await loadItems();
  };

  const handleToggle = async (item) => {
    await updateUserStatusRequest(item.id, { isActive: !item.isActive });
    await loadItems();
  };

  return (
    <EntityManagementPage
      title="Users"
      subtitle="Manage hospital user accounts, roles, departments, and account status."
      items={items}
      columns={[
        { key: 'fullName', label: 'Full Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        {
          key: 'department',
          label: 'Department',
          render: (item) => item.department?.name || 'Not assigned',
        },
        { key: 'phone', label: 'Phone' },
      ]}
      fields={[
        { name: 'fullName', label: 'Full Name', required: true, colClass: 'col-md-6' },
        { name: 'empId', label: 'Employee ID', required: true, colClass: 'col-md-3' },
        { name: 'email', label: 'Email', type: 'email', colClass: 'col-md-3' },
        { name: 'phone', label: 'Phone', colClass: 'col-md-6' },
        {
          name: 'role',
          label: 'Role',
          type: 'select',
          required: true,
          options: ['ADMIN', 'HELPDESK', 'TECHNICIAN', 'HOD', 'REQUESTER'].map((value) => ({ value, label: value })),
          colClass: 'col-md-6',
        },
        {
          name: 'departmentId',
          label: 'Department',
          type: 'select',
          options: departmentOptions,
          colClass: 'col-md-6',
          placeholder: 'Select department',
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          minLength: 8,
          colClass: 'col-md-6',
          helpText: 'Required while creating a user. Leave blank while editing to keep the current password.',
        },
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
      canManage={true}
      onCreate={submitCreate}
      onUpdate={submitUpdate}
      onDelete={null}
      onToggleStatus={handleToggle}
      modalTitle="User"
      showDeleteAction={false}
    />
  );
}

export default UserManagementPage;
