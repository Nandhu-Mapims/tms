import { useEffect, useMemo, useState } from 'react';
import EntityManagementPage from '../../components/admin/EntityManagementPage.jsx';
import {
  createSubcategory,
  deleteSubcategory,
  getCategories,
  getSubcategories,
  updateSubcategory,
} from '../../services/masterDataService';
import { useAuth } from '../../hooks/useAuth';

function SubcategoriesPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN';
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const [subcategoryResponse, categoryResponse] = await Promise.all([
        getSubcategories({ search: appliedSearch }),
        getCategories({ isActive: true }),
      ]);
      setItems(subcategoryResponse.data);
      setCategories(categoryResponse.data);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to load subcategories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [appliedSearch]);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: String(category.id), label: category.name })),
    [categories]
  );

  const submitCreate = async (payload) => {
    await createSubcategory({ ...payload, categoryId: Number(payload.categoryId) });
    await loadItems();
  };

  const submitUpdate = async (item, payload) => {
    await updateSubcategory(item.id, { ...payload, categoryId: Number(payload.categoryId) });
    await loadItems();
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete subcategory "${item.name}"?`)) return;
    await deleteSubcategory(item.id);
    await loadItems();
  };

  const handleToggle = async (item) => {
    await updateSubcategory(item.id, {
      ...item,
      categoryId: item.categoryId,
      isActive: !item.isActive,
    });
    await loadItems();
  };

  return (
    <EntityManagementPage
      title="Subcategories"
      subtitle="Manage category-specific hospital issue classifications."
      items={items}
      columns={[
        {
          key: 'category',
          label: 'Category',
          render: (item) => item.category?.name || 'Not available',
        },
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'description', label: 'Description' },
      ]}
      fields={[
        { name: 'categoryId', label: 'Category', type: 'select', required: true, options: categoryOptions, colClass: 'col-md-6' },
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
      modalTitle="Subcategory"
    />
  );
}

export default SubcategoriesPage;
