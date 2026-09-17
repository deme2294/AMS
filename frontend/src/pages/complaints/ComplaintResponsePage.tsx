import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getComplaintForResponse, submitComplaintResponse, submitResponseComplaint } from '../../services/apiService';
import { Alert, Spinner } from 'react-bootstrap';

export const ComplaintResponsePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [complaint, setComplaint] = useState<any>(null);
  const [responseText, setResponseText] = useState('');
  const [status, setStatus] = useState('In Progress');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid response token');
      setLoading(false);
      return;
    }
    fetchComplaint();
  }, [token]);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      const res = await getComplaintForResponse(token!);
      if (res && res.success) {
        setComplaint(res.data);
      } else {
        setError('Complaint details could not be loaded or token is invalid.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error loading complaint details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim()) {
      setError('Please enter a response.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const res = await submitComplaintResponse(token!, responseText, status);
      if (res && res.success) {
        setSuccess('Response submitted successfully.');
      } else {
        setError(res?.message || 'Failed to submit response.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error submitting response.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4">
              <h3 className="fw-bold mb-3 text-primary">Complaint Response</h3>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              {complaint && (
                <div className="bg-light p-3 rounded mb-4">
                  <h5 className="fw-bold mb-1">{complaint.title || 'Complaint Information'}</h5>
                  <p className="text-muted small mb-2">Reference: {complaint.reference_number || 'N/A'}</p>
                  <p className="mb-0">{complaint.description}</p>
                </div>
              )}

              {!success && (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Status Update</label>
                    <select
                      className="form-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Your Response</label>
                    <textarea
                      className="form-control"
                      rows={5}
                      placeholder="Write your response message here..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 rounded-3"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Response'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ResponseComplaintPage: React.FC = () => {
  const [complaintId, setComplaintId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [responderName, setResponderName] = useState('');
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await submitResponseComplaint({
        complaint_id: Number(complaintId),
        reference_number: referenceNumber,
        responder_name: responderName,
        responder_email: '',
        response_content: responseText,
      });
      if (res && res.success) {
        setSuccess('Response submitted successfully.');
      } else {
        setError(res?.message || 'Failed to submit response.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error submitting response.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4">
              <h3 className="fw-bold mb-3 text-primary">Submit Complaint Response</h3>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              {!success && (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Complaint ID</label>
                    <input
                      type="number"
                      className="form-control"
                      value={complaintId}
                      onChange={(e) => setComplaintId(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Reference Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Your Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={responderName}
                      onChange={(e) => setResponderName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Response Message</label>
                    <textarea
                      className="form-control"
                      rows={5}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 rounded-3"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Response'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintResponsePage;
