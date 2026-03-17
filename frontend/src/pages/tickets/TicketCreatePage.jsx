import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingCard from '../../components/common/LoadingCard.jsx';
import TicketForm from '../../components/tickets/TicketForm.jsx';
import { useToast } from '../../hooks/useToast';
import { getCategories, getDepartments, getLocations, getSubcategories } from '../../services/masterDataService';
import { createTicketRequest } from '../../services/ticketService';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { validateFile, validateRequired } from '../../utils/validators';

const initialFormState = {
  title: '',
  description: '',
  categoryId: '',
  subcategoryId: '',
  departmentId: '',
  locationId: '',
  assetName: '',
  assetId: '',
  priority: '',
  requesterContact: '',
  attachment: null,
};

const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

function TicketCreatePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [formState, setFormState] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState('');
  const [masterData, setMasterData] = useState({
    categories: [],
    subcategories: [],
    departments: [],
    locations: [],
  });

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [categories, subcategories, departments, locations] = await Promise.all([
          getCategories({ isActive: true }),
          getSubcategories({ isActive: true }),
          getDepartments({ isActive: true }),
          getLocations({ isActive: true }),
        ]);

        setMasterData({
          categories: categories.data,
          subcategories: subcategories.data,
          departments: departments.data,
          locations: locations.data,
        });
      } catch (error) {
        const message = getErrorMessage(error, 'Unable to load ticket master data.');
        setPageError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadMasterData();
  }, [toast]);

  const filteredSubcategories = useMemo(() => {
    if (!formState.categoryId) {
      return [];
    }

    return masterData.subcategories.filter((item) => String(item.categoryId) === String(formState.categoryId));
  }, [formState.categoryId, masterData.subcategories]);

  const handleChange = (name, value) => {
    setFormState((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'categoryId' ? { subcategoryId: '' } : {}),
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const nextErrors = {
      title: validateRequired(formState.title, 'Title'),
      description: validateRequired(formState.description, 'Description'),
      categoryId: validateRequired(formState.categoryId, 'Category'),
      subcategoryId: validateRequired(formState.subcategoryId, 'Subcategory'),
      departmentId: validateRequired(formState.departmentId, 'Department'),
      locationId: validateRequired(formState.locationId, 'Location'),
      priority: validateRequired(formState.priority, 'Priority'),
      requesterContact: validateRequired(formState.requesterContact, 'Requester Contact'),
      attachment: validateFile(formState.attachment, { allowedTypes: ALLOWED_ATTACHMENT_TYPES }),
    };

    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key]) {
        delete nextErrors[key];
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPageError('');

    if (!validateForm()) {
      toast.error('Please correct the highlighted ticket form fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formState,
        title: formState.title.trim(),
        description: formState.description.trim(),
        assetName: formState.assetName.trim(),
        assetId: formState.assetId.trim(),
        requesterContact: formState.requesterContact.trim(),
        categoryId: Number(formState.categoryId),
        subcategoryId: Number(formState.subcategoryId),
        departmentId: Number(formState.departmentId),
        locationId: Number(formState.locationId),
      };

      const response = await createTicketRequest(payload);
      toast.success('Ticket created successfully.');
      navigate(`/tickets/${response.data.id}`);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to create ticket.');
      setPageError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingCard message="Loading ticket form..." />;
  }

  return (
    <>
      <PageHeader title="Create Ticket" subtitle="Raise a new hospital service request with the required operational details." />
      {pageError ? <div className="alert alert-danger">{pageError}</div> : null}
      <TicketForm
        formState={formState}
        errors={errors}
        categories={masterData.categories}
        subcategories={filteredSubcategories}
        departments={masterData.departments}
        locations={masterData.locations}
        onChange={handleChange}
        onFileChange={(file) => {
          setFormState((prev) => ({ ...prev, attachment: file }));
          setErrors((prev) => ({ ...prev, attachment: '' }));
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}

export default TicketCreatePage;
