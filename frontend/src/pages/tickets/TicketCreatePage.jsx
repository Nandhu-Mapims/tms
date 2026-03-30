import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import TicketForm from '../../components/tickets/TicketForm.jsx';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { createTicketRequest } from '../../services/ticketService';
import { getCategories, getDepartments, getLocations, getSubcategories } from '../../services/masterDataService';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { validateFiles, validateRequired } from '../../utils/validators';

const initialFormState = {
  prompt: '',
  departmentId: '',
  title: '',
  categoryId: '',
  subcategoryId: '',
  priority: '',
  locationId: '',
  issueType: '',
  attachments: [],
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

const normalizeList = (response) => (Array.isArray(response?.data) ? response.data : []);

const collectValidationErrors = (formState, useAiClassification) => {
  const nextErrors = {
    prompt: validateRequired(formState.prompt, 'Issue details'),
    departmentId: validateRequired(formState.departmentId, 'Send to department'),
    attachment: validateFiles(formState.attachments, { allowedTypes: ALLOWED_ATTACHMENT_TYPES }),
  };

  if (!useAiClassification) {
    nextErrors.categoryId = validateRequired(formState.categoryId, 'Category');
    nextErrors.subcategoryId = validateRequired(formState.subcategoryId, 'Subcategory');
    nextErrors.priority = validateRequired(formState.priority, 'Priority');
    if (formState.issueType === 'HARDWARE') {
      nextErrors.locationId = validateRequired(formState.locationId, 'Location');
    }
  }

  Object.keys(nextErrors).forEach((key) => {
    if (!nextErrors[key]) {
      delete nextErrors[key];
    }
  });

  return nextErrors;
};

function TicketCreatePage() {
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formState, setFormState] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [useAiClassification, setUseAiClassification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReferenceDataLoading, setIsReferenceDataLoading] = useState(true);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subcategoryOptionsAll, setSubcategoryOptionsAll] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    let isCancelled = false;
    const loadReferenceData = async () => {
      setIsReferenceDataLoading(true);
      try {
        const [deptRes, catRes, subRes, locRes] = await Promise.all([
          getDepartments({ isActive: true }),
          getCategories({ isActive: true }),
          getSubcategories({ isActive: true }),
          getLocations({ isActive: true }),
        ]);
        if (isCancelled) return;
        setDepartmentOptions(normalizeList(deptRes));
        setCategoryOptions(normalizeList(catRes));
        setSubcategoryOptionsAll(normalizeList(subRes));
        setLocationOptions(normalizeList(locRes));
      } catch (error) {
        if (isCancelled) return;
        const message = getErrorMessage(error, 'Unable to load form data.');
        setPageError(message);
        toast.error(message);
      } finally {
        if (!isCancelled) setIsReferenceDataLoading(false);
      }
    };
    loadReferenceData();
    return () => {
      isCancelled = true;
    };
  }, [toast]);

  const subcategoryOptionsFiltered = useMemo(
    () =>
      subcategoryOptionsAll.filter((item) => String(item?.categoryId ?? '') === String(formState.categoryId ?? '')),
    [subcategoryOptionsAll, formState.categoryId],
  );

  const handleChange = useCallback((name, value) => {
    setFormState((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'categoryId') {
        next.subcategoryId = '';
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const handleUseAiClassificationChange = useCallback((checked) => {
    setUseAiClassification(checked);
    if (checked) {
      setFormState((prev) => ({
        ...prev,
        title: '',
        categoryId: '',
        subcategoryId: '',
        priority: '',
        locationId: '',
        issueType: '',
      }));
    }
    setErrors({});
  }, []);

  const validateForm = useCallback(() => {
    const nextErrors = collectValidationErrors(formState, useAiClassification);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [formState, useAiClassification]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPageError('');

    if (!validateForm()) {
      toast.error('Please correct the highlighted ticket form fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const trimmedPrompt = formState.prompt.trim();
      const payload = {
        prompt: trimmedPrompt,
        description: trimmedPrompt,
        departmentId: formState.departmentId,
        attachments: formState.attachments,
      };

      const trimmedTitle = String(formState.title ?? '').trim();
      if (trimmedTitle) {
        payload.title = trimmedTitle;
      }

      if (!useAiClassification) {
        payload.categoryId = formState.categoryId;
        payload.subcategoryId = formState.subcategoryId;
        payload.priority = formState.priority;
        if (formState.issueType) {
          payload.issueType = formState.issueType;
        }
        if (formState.locationId) {
          payload.locationId = formState.locationId;
        }
      }

      const response = await createTicketRequest(payload);
      toast.success('Ticket created successfully.');
      const ticketNumber =
        response?.data?.ticketNumber ??
        response?.data?.data?.ticketNumber ??
        response?.ticketNumber ??
        '';

      if (!ticketNumber) {
        setPageError('Ticket was created but ticket navigation failed.');
        toast.error('Ticket was created, but we could not open it automatically.');
        return;
      }

      navigate(`/tickets/${ticketNumber}`);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to create ticket.');
      setPageError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formDisabled = isSubmitting || isReferenceDataLoading;

  return (
    <>
      <PageHeader
        title="Create Ticket"
        subtitle={
          user?.role === 'HOD'
            ? 'Raise a ticket as a department head (e.g. HOD-to-HOD or HOD-to-operations). You are recorded as the requester.'
            : 'Raise a new hospital service request with the required operational details.'
        }
      />
      {pageError ? <div className="alert alert-danger">{pageError}</div> : null}
      <TicketForm
        formState={formState}
        errors={errors}
        departmentOptions={departmentOptions}
        categoryOptions={categoryOptions}
        subcategoryOptions={subcategoryOptionsFiltered}
        locationOptions={locationOptions}
        useAiClassification={useAiClassification}
        onUseAiClassificationChange={handleUseAiClassificationChange}
        onChange={handleChange}
        onFileChange={(files) => {
          setFormState((prev) => ({ ...prev, attachments: [...(prev.attachments ?? []), ...(files ?? [])] }));
          setErrors((prev) => ({ ...prev, attachment: '' }));
        }}
        onRemoveFile={(indexToRemove) => {
          setFormState((prev) => ({
            ...prev,
            attachments: prev.attachments.filter((_, index) => index !== indexToRemove),
          }));
          setErrors((prev) => ({ ...prev, attachment: '' }));
        }}
        onSubmit={handleSubmit}
        isSubmitting={formDisabled}
      />
    </>
  );
}

export default TicketCreatePage;
