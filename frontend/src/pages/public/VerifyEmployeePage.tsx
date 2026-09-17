import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicEmployeeData, IdCardPerson, fixImageUrl } from '../../services/apiService';
import './VerifyEmployeePage.css';
import { FaCheckCircle, FaUser, FaInfoCircle, FaCalendarAlt, FaIdCard, FaBuilding } from 'react-icons/fa';

const VerifyEmployeePage: React.FC = () => {
    const { idNumber } = useParams<{ idNumber: string }>();
    const [employee, setEmployee] = useState<IdCardPerson | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEmployee = async () => {
            if (!idNumber) return;
            try {
                setLoading(true);
                const data = await getPublicEmployeeData(idNumber);
                setEmployee(data);
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Verification failed. Employee not found.');
            } finally {
                setLoading(false);
            }
        };

        fetchEmployee();
    }, [idNumber]);

    if (loading) {
        return (
            <div className="verify-container">
                <div className="verify-loader">
                    <div className="spinner"></div>
                    <p>Verifying Identity...</p>
                </div>
            </div>
        );
    }

    if (error || !employee) {
        return (
            <div className="verify-container">
                <div className="verify-card error-card">
                    <div className="error-icon">×</div>
                    <h2>Verification Failed</h2>
                    <p>{error || 'This ID does not exist in our records.'}</p>
                    <div className="error-details">
                        The scanned ID card could not be verified by the official system. Please contact the administration if you believe this is an error.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="verify-container">
            <div className="verify-header animate-fade-in">
                <div className="verify-badge">
                    <FaCheckCircle className="check-icon" />
                    <span>OFFICIAL VERIFICATION</span>
                </div>
                <h1>Identity Verified Successfuly</h1>
                <p className="subtitle">The following individual is a registered member of Ethiopian IT Park.</p>
            </div>

            <div className="verify-card animate-slide-up">
                <div className="verification-status-banner">
                    <FaCheckCircle /> VERIFIED AUTHENTIC
                </div>

                <div className="employee-main-info">
                    <div className="employee-photo-large">
                        {employee.photo_url ? (
                            <img src={fixImageUrl(employee.photo_url) || ''} alt={employee.fname} />
                        ) : (
                            <div className="photo-placeholder-verify">
                                <FaUser />
                            </div>
                        )}
                    </div>
                    <div className="employee-names">
                        <div className="name-stack">
                            <span className="amharic-primary">{employee.fname_am} {employee.lname_am}</span>
                            <span className="english-primary">{employee.fname} {employee.lname}</span>
                        </div>
                        <div className="position-stack">
                            <span className="amharic-secondary">{employee.position_am}</span>
                            <span className="english-secondary">{employee.position}</span>
                        </div>
                    </div>
                </div>

                <div className="details-grid">
                    <div className="detail-panel">
                        <div className="panel-label">
                            <FaIdCard /> <span>Identification</span>
                        </div>
                        <div className="panel-value">
                            <span className="label">ID Number:</span>
                            <span className="val highlight">{employee.id_number}</span>
                        </div>
                    </div>

                    <div className="detail-panel">
                        <div className="panel-label">
                            <FaBuilding /> <span>Department</span>
                        </div>
                        <div className="panel-value">
                            <span className="label">Unit:</span>
                            <span className="val">{employee.department}</span>
                        </div>
                    </div>

                    <div className="detail-panel">
                        <div className="panel-label">
                            <FaInfoCircle /> <span>Status</span>
                        </div>
                        <div className="panel-value">
                            <span className="label">Account State:</span>
                            <span className="val status-active">Active</span>
                        </div>
                    </div>

                    <div className="detail-panel">
                        <div className="panel-label">
                            <FaCalendarAlt /> <span>Valid Until</span>
                        </div>
                        <div className="panel-value">
                            <span className="label">Expiry Date:</span>
                            <span className="val">{employee.expiry_date || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="verify-footer">
                    <p>© {new Date().getFullYear()} Ethiopian IT Park. All rights reserved.</p>
                    <p className="disclaimer">This information is provided for identity verification purposes only.</p>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmployeePage;
