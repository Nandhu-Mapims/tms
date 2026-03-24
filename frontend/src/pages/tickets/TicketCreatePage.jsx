import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import TicketForm from '../../components/tickets/TicketForm.jsx';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { createTicketRequest } from '../../services/ticketService';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { validateFile, validateRequired } from '../../utils/validators';

const initialFormState = {
  prompt: '',
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formState, setFormState] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState('');

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
        prompt: formState.prompt.trim(),
        description: formState.prompt.trim(),
        attachment: formState.attachment,
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
