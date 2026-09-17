import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import Papa from 'papaparse';
import {
    getAllIdCardPersons,
    addIdCardPerson,
    updateIdCardPerson,
    batchAddIdCardPersons,
    deleteIdCardPerson,
    IdCardPerson,
    fixImageUrl,
    uploadIdCardPhoto
} from '../../services/apiService';
import { Card, Row, Col, Form, Button, Table, Spinner, Badge, Toast, ToastContainer, InputGroup, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ManageIdCardPersonsPage: React.FC = () => {
    const [persons, setPersons] = useState<IdCardPerson[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPersons, setSelectedPersons] = useState<IdCardPerson[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCsvModal, setShowCsvModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingPersonId, setEditingPersonId] = useState<number | null>(null);

    // Toast Notification State
    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [toastBg, setToastBg] = useState('success');

    const navigate = useNavigate();

    // Form State for Single Add
    const [newPerson, setNewPerson] = useState<Partial<IdCardPerson>>({
        fname: '', lname: '', position: '', department: '', nationality: 'Ethiopian',
        fname_am: '', lname_am: '', position_am: '',
        email: '', phone: '', sex: 'M'
    });

    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getAllIdCardPersons();
            setPersons(data);
        } catch (err: any) {
            console.error(err);
            notify(err.message, 'danger');
        } finally {
            setLoading(false);
        }
    };

    const notify = (msg: string, bg: string = 'success') => {
        setToastMsg(msg);
        setToastBg(bg);
        setShowToast(true);
    };

    const handleAddPerson = async (e: React.FormEvent) => {
        e.preventDefault();

        // Mandatory Field Validation
        const requiredFields = [
            { value: newPerson.fname, label: 'First Name (English)' },
            { value: newPerson.lname, label: 'Last Name (English)' },
            { value: newPerson.fname_am, label: 'First Name (Amharic)' },
            { value: newPerson.lname_am, label: 'Last Name (Amharic)' },
            { value: newPerson.position, label: 'Position/Title (English)' },
            { value: newPerson.position_am, label: 'Position/Title (Amharic)' },
            { value: newPerson.nationality, label: 'Nationality' },
            { value: newPerson.sex, label: 'Sex' },
            { value: newPerson.email, label: 'Email' },
            { value: newPerson.phone, label: 'Phone Number' }
        ];

        for (const field of requiredFields) {
            if (!field.value || (typeof field.value === 'string' && (field.value.trim() === '' || field.value === '@'))) {
                notify(`${field.label} is strictly required.`, "danger");
                return;
            }
        }

        const phoneRegex = /^(\+251|0)[79]\d{8}$/;
        if (!phoneRegex.test(newPerson.phone!)) {
            notify("Invalid phone number. Use +251 9... or 09...", "danger");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newPerson.email!)) {
            notify("Invalid email address format", "danger");
            return;
        }

        setSubmitting(true);
        try {
            // Sanitize Input
            const cleanPerson = { ...newPerson };
            Object.keys(cleanPerson).forEach(key => {
                if (typeof cleanPerson[key as keyof typeof newPerson] === 'string') {
                    if (key !== 'photo_url') {
                        (cleanPerson as any)[key] = DOMPurify.sanitize(cleanPerson[key as keyof typeof newPerson] as string);
                    }
                }
            });

            if (isEditMode && editingPersonId) {
                await updateIdCardPerson(editingPersonId, cleanPerson);
                notify('Person updated successfully');
            } else {
                const response = await addIdCardPerson({
                    ...cleanPerson,
                    date_of_issue: new Date().toISOString().split('T')[0]
                } as IdCardPerson);
                notify(`Person added successfully with ID: ${response.id_number || 'Auto-generated'}`);
            }

            setShowAddModal(false);
            loadData();
            resetForm();
        } catch (err: any) {
            notify(err.message, 'danger');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setNewPerson({
            fname: '', lname: '', position: '', department: '', nationality: 'Ethiopian',
            fname_am: '', lname_am: '', position_am: '',
            email: '', phone: '', sex: 'M', photo_url: ''
        });
        setPhotoPreview(null);
        setIsEditMode(false);
        setEditingPersonId(null);
    };

    const handleEditClick = (person: IdCardPerson) => {
        setNewPerson({
            fname: person.fname,
            lname: person.lname,
            fname_am: person.fname_am,
            lname_am: person.lname_am,
            position: person.position,
            position_am: person.position_am,
            department: person.department,
            nationality: person.nationality,
            email: person.email,
            phone: person.phone,
            sex: person.sex,
            photo_url: person.photo_url
        });

        // Fix: Use fixImageUrl to load image for preview during edit
        if (person.photo_url) {
            const fullUrl = fixImageUrl(person.photo_url);
            setPhotoPreview(fullUrl);
        } else {
            setPhotoPreview(null);
        }

        setEditingPersonId(person.id!);
        setIsEditMode(true);
        setShowAddModal(true);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            notify('Please upload an image file', 'danger');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            notify('Image size must be less than 5MB', 'danger');
            return;
        }

        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('photo', file);

            const data: any = await uploadIdCardPhoto(formData);

            if (data.success) {
                setNewPerson({ ...newPerson, photo_url: data.photo_url });
                setPhotoPreview(URL.createObjectURL(file));
                notify('Photo uploaded successfully');
            } else {
                notify(data.message || 'Upload failed', 'danger');
            }
        } catch (err: any) {
            notify('Failed to upload photo: ' + err.message, 'danger');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Use FileReader explicitly to force UTF-8 reading
        const reader = new FileReader();
        reader.onload = (event) => {
            const csvText = event.target?.result as string;

            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    setSubmitting(true);
                    try {
                        console.log('Parsed CSV Data:', results.data); // Debug logging

                        const mappedPersons: IdCardPerson[] = results.data.map((row: any) => ({
                            fname: DOMPurify.sanitize(row.fname || ''),
                            lname: DOMPurify.sanitize(row.lname || ''),
                            fname_am: DOMPurify.sanitize(row.fname_am || ''),
                            lname_am: DOMPurify.sanitize(row.lname_am || ''),
                            position: DOMPurify.sanitize(row.position || ''),
                            position_am: DOMPurify.sanitize(row.position_am || ''),
                            department: DOMPurify.sanitize(row.department || ''),
                            nationality: DOMPurify.sanitize(row.nationality || 'Ethiopian'),
                            email: DOMPurify.sanitize(row.email || ''),
                            phone: DOMPurify.sanitize(row.phone || ''),
                            sex: (row.sex || 'M').toUpperCase() as 'M' | 'F',
                            date_of_issue: row.date_of_issue || new Date().toISOString().split('T')[0],
                            custom_field_1_label: DOMPurify.sanitize(row.custom_field_1_label || ''),
                            custom_field_1_value: DOMPurify.sanitize(row.custom_field_1_value || ''),
                            custom_field_2_label: DOMPurify.sanitize(row.custom_field_2_label || ''),
                            custom_field_2_value: DOMPurify.sanitize(row.custom_field_2_value || '')
                        }));

                        // Filter out empty rows if any
                        const validPersons = mappedPersons.filter(p => p.fname || p.fname_am);

                        if (validPersons.length === 0) {
                            throw new Error("No valid data found in CSV");
                        }

                        await batchAddIdCardPersons(validPersons);
                        notify(`Successfully imported ${validPersons.length} ID card persons`);
                        setShowCsvModal(false);
                        loadData();
                    } catch (err: any) {
                        console.error("CSV Import Error:", err);
                        notify(err.message, 'danger');
                    } finally {
                        setSubmitting(false);
                        e.target.value = ''; // Reset input
                    }
                }
            });
        };

        reader.onerror = () => {
            notify('Failed to read file', 'danger');
            setSubmitting(false);
        };

        reader.readAsText(file, 'UTF-8');
    };

    const downloadSampleCsv = () => {
        const data = [
            {
                fname: 'John', lname: 'Doe', fname_am: 'ዮሐንስ', lname_am: 'ከበደ',
                position: 'Software Engineer', position_am: 'ሶፍትዌር ምህንድስና',
                department: 'IT', nationality: 'Ethiopian', email: 'john.doe@example.com',
                phone: '0911223344', sex: 'M', date_of_issue: '2024-01-15',
                custom_field_1_label: 'Blood Type', custom_field_1_value: 'O+',
                custom_field_2_label: 'Emergency Contact', custom_field_2_value: '0922334455'
            },
            {
                fname: 'Jane', lname: 'Smith', fname_am: 'ማርታ', lname_am: 'አለሙ',
                position: 'Project Manager', position_am: 'ፕሮጀክት አስተዳዳሪ',
                department: 'Operations', nationality: 'Ethiopian', email: 'jane.smith@example.com',
                phone: '0922334455', sex: 'F', date_of_issue: '2024-01-15',
                custom_field_1_label: 'Blood Type', custom_field_1_value: 'A+',
                custom_field_2_label: 'Emergency Contact', custom_field_2_value: '0933445566'
            }
        ];
        const csv = Papa.unparse(data);
        // Add Byte Order Mark (BOM) for Excel to recognize UTF-8
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'id_card_persons_sample.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleSelection = (person: IdCardPerson) => {
        const exists = selectedPersons.find(p => p.id === person.id);
        if (exists) {
            setSelectedPersons(selectedPersons.filter(p => p.id !== person.id));
        } else {
            setSelectedPersons([...selectedPersons, person]);
        }
    };

    const handleGenerateIds = () => {
        navigate('/tools/id-generator', { state: { selectedIdCardPersons: selectedPersons } });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this person?')) return;
        try {
            await deleteIdCardPerson(id);
            notify('Person deleted successfully');
            loadData();
        } catch (err: any) {
            notify(err.message, 'danger');
        }
    };

    const filtered = persons.filter(p =>
        `${p.fname} ${p.lname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.id_number && p.id_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="container-fluid py-4 min-vh-100 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 font-weight-bold text-slate-900 dark:text-white mb-1">ID Card Registry</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage all persons for ID card generation (independent from employee records)</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={() => setShowCsvModal(true)}>
                        <i className="fas fa-file-import me-2"></i> CSV Import
                    </Button>
                    <Button variant="primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
                        <i className="fas fa-user-plus me-2"></i> Add Person
                    </Button>
                </div>
            </div>

            <Row>
                <Col lg={12}>
                    <Card className="shadow-sm border-0 bg-white dark:bg-slate-800 transition-colors duration-300">
                        <Card.Header className="bg-white dark:bg-slate-800 border-bottom dark:border-slate-700 py-3 d-flex justify-content-between align-items-center">
                            <h6 className="m-0 font-weight-bold text-primary">Registered Persons ({persons.length})</h6>
                            <div className="d-flex gap-3">
                                <InputGroup size="sm" style={{ width: '300px' }}>
                                    <InputGroup.Text className="bg-slate-50 dark:bg-slate-700 border-dark-soft dark:border-slate-600 dark:text-slate-300">
                                        <i className="fas fa-search"></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        placeholder="Search by name, ID, or email..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="bg-white dark:bg-slate-700 border-dark-soft dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
                                    />
                                </InputGroup>
                                {selectedPersons.length > 0 && (
                                    <Button variant="success" size="sm" onClick={handleGenerateIds} className="animate-pulse">
                                        <i className="fas fa-id-card me-2"></i> Generate IDs ({selectedPersons.length})
                                    </Button>
                                )}
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="align-middle mb-0 dark:text-slate-300">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 small text-uppercase">
                                        <tr>
                                            <th className="px-4" style={{ width: '80px' }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <Form.Check
                                                        checked={selectedPersons.length === filtered.length && filtered.length > 0}
                                                        onChange={() => selectedPersons.length === filtered.length ? setSelectedPersons([]) : setSelectedPersons(filtered)}
                                                        className="dark:border-slate-600"
                                                    />
                                                    <span className="extra-small text-slate-400 dark:text-slate-500" style={{ fontSize: '10px' }}>SELECT</span>
                                                </div>
                                            </th>
                                            <th>ID Number</th>
                                            <th>Full Name</th>
                                            <th>Position</th>
                                            <th>Department</th>
                                            <th>Contact</th>
                                            <th>Status</th>
                                            <th className="text-end px-4" style={{ width: '120px' }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan={8} className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
                                        ) : filtered.length === 0 ? (
                                            <tr><td colSpan={8} className="text-center py-5 text-muted">No persons found.</td></tr>
                                        ) : filtered.map(person => (
                                            <tr key={person.id}>
                                                <td className="px-4">
                                                    <Form.Check
                                                        checked={selectedPersons.some(sp => sp.id === person.id)}
                                                        onChange={() => toggleSelection(person)}
                                                        className="dark:border-slate-600"
                                                    />
                                                </td>
                                                <td><Badge bg="dark" className="font-monospace">{person.id_number || 'N/A'}</Badge></td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-3">
                                                        {/* Fix: Show actual person image in the list */}
                                                        <div className="avatar-circle bg-blue-50 dark:bg-blue-900/30 text-primary font-weight-bold overflow-hidden border dark:border-blue-800/50">
                                                            {person.photo_url ? (
                                                                <img
                                                                    src={fixImageUrl(person.photo_url) || ''}
                                                                    alt="Avatar"
                                                                    className="w-100 h-100 object-fit-cover"
                                                                />
                                                            ) : (
                                                                `${person.fname[0]}${person.lname[0]}`
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-weight-bold text-slate-900 dark:text-white">{person.fname} {person.lname}</div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-400">{person.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><Badge bg="light" className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border dark:border-slate-600">{person.position || 'N/A'}</Badge></td>
                                                <td><Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-0">{person.department || 'N/A'}</Badge></td>
                                                <td className="small text-slate-600 dark:text-slate-400">{person.phone || 'N/A'}</td>
                                                <td><Badge bg={person.status === 'active' ? 'success' : 'secondary'} className="opacity-90">{person.status || 'active'}</Badge></td>
                                                <td className="text-end px-4">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <OverlayTrigger placement="top" overlay={<Tooltip id={`edit-${person.id}`}>Edit Details</Tooltip>}>
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                className="rounded-circle d-flex align-items-center justify-content-center"
                                                                style={{ width: '32px', height: '32px' }}
                                                                onClick={() => handleEditClick(person)}
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                            </Button>
                                                        </OverlayTrigger>

                                                        <OverlayTrigger placement="top" overlay={<Tooltip id={`del-${person.id}`}>Delete Person</Tooltip>}>
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                className="rounded-circle d-flex align-items-center justify-content-center"
                                                                style={{ width: '32px', height: '32px' }}
                                                                onClick={() => handleDelete(person.id!)}
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </Button>
                                                        </OverlayTrigger>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Add Person Modal */}
            <Modal show={showAddModal} onHide={() => !submitting && setShowAddModal(false)} size="lg" centered contentClassName="dark:bg-slate-800 dark:text-white border-0 shadow-lg">
                <Modal.Header closeButton className="border-bottom dark:border-slate-700">
                    <Modal.Title className="h5 font-weight-bold dark:text-white">
                        {isEditMode ? 'Edit Person Details' : 'Add New Person for ID Card'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddPerson}>
                    <Modal.Body className="py-2">
                        <Row className="g-3">
                            {/* Photo Upload Section */}
                            <Col md={12}>
                                <Form.Label className="small font-weight-bold text-slate-700 dark:text-slate-300">Person Photo</Form.Label>
                                <div className="d-flex align-items-center gap-3">
                                    {photoPreview && (
                                        <div className="photo-preview-box border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700">
                                            <img src={photoPreview} alt="Preview" />
                                        </div>
                                    )}
                                    <div className="flex-grow-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            id="photo-upload"
                                            className="d-none"
                                            disabled={uploadingPhoto}
                                        />
                                        <label htmlFor="photo-upload" className="btn btn-outline-primary btn-sm w-100 mb-0 dark:border-blue-500 dark:text-blue-400">
                                            {uploadingPhoto ? (
                                                <><Spinner size="sm" className="me-2" /> Uploading...</>
                                            ) : (
                                                <><i className="fas fa-camera me-2"></i> {photoPreview ? 'Change Photo' : 'Upload Photo'}</>
                                            )}
                                        </label>
                                        <small className="text-slate-500 dark:text-slate-400 d-block mt-1">Max 5MB, JPG/PNG</small>
                                        <div className="mt-2 text-slate-500 dark:text-slate-400 d-block mt-1">
                                            <Form.Control
                                                size="sm"
                                                placeholder="Or paste image URL"
                                                value={newPerson.photo_url || ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setNewPerson({ ...newPerson, photo_url: val });
                                                    setPhotoPreview(fixImageUrl(val));
                                                }}
                                                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Col>

                            <Col md={12}><hr className="my-2 dark:border-slate-700" /></Col>

                            <Col md={6}>
                                <Form.Label className="small font-weight-bold text-slate-700 dark:text-slate-300">First Name (English) *</Form.Label>
                                <Form.Control required value={newPerson.fname} onChange={e => setNewPerson({ ...newPerson, fname: e.target.value })} placeholder="e.g John" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small font-weight-bold text-slate-700 dark:text-slate-300">Last Name (English) *</Form.Label>
                                <Form.Control required value={newPerson.lname} onChange={e => setNewPerson({ ...newPerson, lname: e.target.value })} placeholder="e.g Doe" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small font-weight-bold text-slate-700 dark:text-slate-300">ስም (በአማርኛ) *</Form.Label>
                                <Form.Control required value={newPerson.fname_am || ''} onChange={e => setNewPerson({ ...newPerson, fname_am: e.target.value })} placeholder="ምሳሌ፡ ዮሐንስ" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small font-weight-bold text-slate-700 dark:text-slate-300">የአባት ስም (በአማርኛ) *</Form.Label>
                                <Form.Control required value={newPerson.lname_am || ''} onChange={e => setNewPerson({ ...newPerson, lname_am: e.target.value })} placeholder="ምሳሌ፡ ከበደ" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small font-weight-bold text-slate-700 dark:text-slate-300">Position/Title (English) *</Form.Label>
                                <Form.Control required value={newPerson.position} onChange={e => setNewPerson({ ...newPerson, position: e.target.value })} placeholder="e.g Software Engineer" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small font-weight-bold text-slate-700 dark:text-slate-300">የስራ መደብ (በአማርኛ) *</Form.Label>
                                <Form.Control required value={newPerson.position_am || ''} onChange={e => setNewPerson({ ...newPerson, position_am: e.target.value })} placeholder="ምሳሌ፡ ሶፍትዌር ኢንጂነር" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small font-weight-bold text-slate-700 dark:text-slate-300">Department</Form.Label>
                                <Form.Control value={newPerson.department} onChange={e => setNewPerson({ ...newPerson, department: e.target.value })} placeholder="e.g IT Department" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small font-weight-bold text-slate-700 dark:text-slate-300">Nationality *</Form.Label>
                                <Form.Control required value={newPerson.nationality} onChange={e => setNewPerson({ ...newPerson, nationality: e.target.value })} placeholder="Ethiopian" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small font-weight-bold text-slate-700 dark:text-slate-300">Email *</Form.Label>
                                <Form.Control required type="email" value={newPerson.email} onChange={e => setNewPerson({ ...newPerson, email: e.target.value })} placeholder="john.doe@example.com" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small font-weight-bold text-slate-700 dark:text-slate-300">Phone Number *</Form.Label>
                                <Form.Control required value={newPerson.phone} onChange={e => setNewPerson({ ...newPerson, phone: e.target.value })} placeholder="09..." className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small font-weight-bold text-slate-700 dark:text-slate-300">Sex</Form.Label>
                                <Form.Select value={newPerson.sex} onChange={e => setNewPerson({ ...newPerson, sex: e.target.value as 'M' | 'F' })} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                </Form.Select>
                            </Col>
                        </Row>
                        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded border dark:border-slate-600 small text-slate-600 dark:text-slate-400">
                            <i className="fas fa-info-circle me-2 text-primary"></i>
                            ID numbers are auto-generated starting from 1010001. This data is stored independently and used only for ID card generation.
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="border-top dark:border-slate-700">
                        <Button variant="light" onClick={() => setShowAddModal(false)} disabled={submitting}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={submitting}>
                            {submitting ? <Spinner size="sm" className="me-2" /> : null}
                            {isEditMode ? 'Update Details' : 'Add Person'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* CSV Import Modal */}
            <Modal show={showCsvModal} onHide={() => !submitting && setShowCsvModal(false)} centered contentClassName="dark:bg-slate-800 dark:text-white border-0 shadow-lg">
                <Modal.Header closeButton className="border-bottom dark:border-slate-700">
                    <Modal.Title className="h5 font-weight-bold dark:text-white">Bulk CSV Import</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center py-4">
                    <div className="mb-4">
                        <div className="mb-3">
                            <i className="fas fa-file-csv fa-4x text-muted opacity-25"></i>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">Import multiple persons in seconds. ID numbers will be auto-generated. Please ensure your CSV file is saved with <strong>UTF-8 encoding</strong> to support Amharic characters.</p>
                        <Button variant="link" size="sm" onClick={downloadSampleCsv} className="text-blue-500 dark:text-blue-400 font-weight-bold">
                            <i className="fas fa-download me-1"></i> Download Sample CSV
                        </Button>
                    </div>

                    <div className="custom-file-upload-block p-5 border-2 border-dashed rounded-3 bg-slate-50 dark:bg-slate-700/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-600 transition-all">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleCsvUpload}
                            id="csv-file-input"
                            className="d-none"
                            disabled={submitting}
                        />
                        <label htmlFor="csv-file-input" style={{ width: '100%', cursor: 'pointer' }}>
                            {submitting ? <Spinner animation="border" variant="primary" /> : (
                                <>
                                    <h6 className="mb-1 font-weight-bold text-slate-700 dark:text-slate-200">Click to upload or drag & drop</h6>
                                    <p className="small text-slate-500 dark:text-slate-400 mb-0">CSV files only</p>
                                </>
                            )}
                        </label>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Notification Toast */}
            <ToastContainer position="top-end" className="p-3">
                <Toast show={showToast} onClose={() => setShowToast(false)} delay={4000} autohide bg={toastBg} className="text-white">
                    <Toast.Header closeButton={false} className={`bg-${toastBg} text-white border-0`}>
                        <strong className="me-auto">System Notification</strong>
                    </Toast.Header>
                    <Toast.Body>{toastMsg}</Toast.Body>
                </Toast>
            </ToastContainer>

            <style dangerouslySetInnerHTML={{
                __html: `
                .avatar-circle { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; text-transform: uppercase; }
                .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
                .hover-bg-light-2:hover { background-color: #f0f2f5 !important; border-color: #0d6efd !important; }
                .photo-preview-box { width: 100px; height: 120px; border: 2px solid #dee2e6; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f8f9fa; }
                .photo-preview-box img { width: 100%; height: 100%; object-fit: cover; }
                .animate-pulse { animation: pulse 2s infinite; }
                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.4); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(25, 135, 84, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(25, 135, 84, 0); }
                }
            `}} />
        </div>
    );
};

export default ManageIdCardPersonsPage;
