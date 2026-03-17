import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../common/EmptyState.jsx';
import LoadingCard from '../common/LoadingCard.jsx';
import PageHeader from '../common/PageHeader.jsx';
import EntityFormModal from './EntityFormModal.jsx';
import { useToast } from '../../hooks/useToast';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { getErrorMessage } from '../../utils/getErrorMessage';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

function EntityManagementPage({
  title,
  subtitle,
  items,
  columns,
  fields,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onReset,
  isLoading,
  errorMessage,
  canManage,
  onCreate,
  onUpdate,
  onDelete,
  onToggleStatus,
  modalTitle,
  showDeleteAction = true,
}) {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [modalState, setModalState] = useState({ open: false, mode: 'create', item: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [items, statusFilter]);

  const filteredItems = useMemo(() => {
    if (statusFilter === 'ALL') {
      return items;
    }

    const isActive = statusFilter === 'ACTIVE';
    return items.filter((item) => Boolean(item.isActive) === isActive);
  }, [items, statusFilter]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  const actions = useMemo(() => {
    if (!canManage) {
      return null;
    }

    return [
      <button
        key="create"
        type="button"
        className="btn btn-primary"
        onClick={() => setModalState({ open: true, mode: 'create', item: null })}
      >
        Add New
      </button>,
    ];
  }, [canManage]);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      if (modalState.mode === 'edit') {
        await onUpdate(modalState.item, payload);
        toast.success(`${modalTitle || title} updated successfully.`);
      } else {
        await onCreate(payload);
        toast.success(`${modalTitle || title} created successfully.`);
      }
      setModalState({ open: false, mode: 'create', item: null });
    } catch (error) {
      toast.error(getErrorMessage(error, `Unable to save ${title.toLowerCase()}.`));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const approved = await confirm({
      title: `Delete ${modalTitle || title}`,
      message: `Delete "${item.name || item.code || item.id}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (!approved) {
      return;
    }

    try {
      await onDelete(item);
      toast.success(`${modalTitle || title} deleted successfully.`);
    } catch (error) {
      toast.error(getErrorMessage(error, `Unable to delete ${title.toLowerCase()}.`));
    }
  };

  const handleToggleStatus = async (item) => {
    const nextAction = item.isActive ? 'disable' : 'enable';
    const approved = await confirm({
      title: `${nextAction === 'disable' ? 'Disable' : 'Enable'} ${modalTitle || title}`,
      message: `Do you want to ${nextAction} "${item.name || item.code || item.id}"?`,
      confirmText: nextAction === 'disable' ? 'Disable' : 'Enable',
      variant: nextAction === 'disable' ? 'warning' : 'primary',
    });

    if (!approved) {
      return;
    }

    try {
      await onToggleStatus(item);
      toast.success(`${modalTitle || title} ${nextAction}d successfully.`);
    } catch (error) {
      toast.error(getErrorMessage(error, `Unable to update ${title.toLowerCase()} status.`));
    }
  };

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      {errorMessage ? <div className="alert alert-danger">{errorMessage}</div> : null}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-lg-5">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={`Search ${title.toLowerCase()}`}
              />
            </div>
            <div className="col-6 col-lg-3">
              <label className="form-label">Status</label>
              <select className="form-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <label className="form-label">Rows</label>
              <select
                className="form-select"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-2 d-flex gap-2">
              <button type="button" className="btn btn-primary flex-fill" onClick={onSearchSubmit}>
                Search
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary flex-fill"
                onClick={() => {
                  setStatusFilter('ALL');
                  setPage(1);
                  onReset();
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingCard message={`Loading ${title.toLowerCase()}...`} />
      ) : paginatedItems.length ? (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table align-middle mb-0 admin-table">
              <thead className="table-light">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  <th>Status</th>
                  {canManage ? <th className="text-end">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={item.id}>
                    {columns.map((column) => (
                      <td key={column.key}>
                        {column.render ? column.render(item) : item[column.key] ?? 'Not available'}
                      </td>
                    ))}
                    <td>
                      <span className={`badge ${item.isActive ? 'text-bg-success' : 'text-bg-secondary'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canManage ? (
                      <td className="text-end">
                        <div className="d-inline-flex flex-wrap justify-content-end gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setModalState({ open: true, mode: 'edit', item })}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleToggleStatus(item)}
                          >
                            {item.isActive ? 'Disable' : 'Enable'}
                          </button>
                          {showDeleteAction ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(item)}
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card-footer bg-white d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="small text-secondary">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredItems.length)} of {filteredItems.length} records
            </div>
            <div className="btn-group">
              <button type="button" className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
                Previous
              </button>
              <button type="button" className="btn btn-outline-secondary disabled">
                Page {page} of {totalPages}
              </button>
              <button type="button" className="btn btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title={`No ${title.toLowerCase()} found`}
          description={`There are no records available for ${title.toLowerCase()}.`}
        />
      )}

      <EntityFormModal
        show={modalState.open}
        title={`${modalState.mode === 'edit' ? 'Edit' : 'Create'} ${modalTitle || title}`}
        fields={fields}
        initialValues={modalState.item}
        onClose={() => setModalState({ open: false, mode: 'create', item: null })}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}

export default EntityManagementPage;
