import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import TicketForm from '../../components/tickets/TicketForm.jsx';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { createTicketRequest } from '../../services/ticketService';
import { getDepartments } from '../../services/masterDataService';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { validateFiles, validateRequired } from '../../utils/validators';

const initialFormState = {
  prompt: '',
  departmentId: '',
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

function TicketCreatePage() {
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formState, setFormState] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(true);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    let isCancelled = false;
    const loadDepartments = async () => {
      setIsDepartmentsLoading(true);
      try {
        const response = await getDepartments({ isActive: true });
        if (isCancelled) return;
        setDepartmentOptions(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        if (isCancelled) return;
        const message = getErrorMessage(error, 'Unable to load departments.');
        setPageError(message);
        toast.error(message);
      } finally {
        if (!isCancelled) setIsDepartmentsLoading(false);
      }
    };
    loadDepartments();
    return () => {
      isCancelled = true;
    };
  }, [toast]);

  const handleChange = (name, value) => {
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const nextErrors = {
      prompt: validateRequired(formState.prompt, 'Issue details'),
      departmentId: validateRequired(formState.departmentId, 'Send to department'),
      attachment: validateFiles(formState.attachments, { allowedTypes: ALLOWED_ATTACHMENT_TYPES }),
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
        prompt: formState.prompt.trim(),
        description: formState.prompt.trim(),
        departmentId: formState.departmentId,
        attachments: formState.attachments,
      };

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
        isSubmitting={isSubmitting || isDepartmentsLoading}
      />
    </>
  );
}

export default TicketCreatePage;
