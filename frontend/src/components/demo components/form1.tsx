// src/components/demo components/form1.tsx
import React, { useState, FormEvent } from 'react';

const Form1: React.FC = () => {
  // State for form inputs
  const [firstName, setFirstName] = useState('Mark');
  const [lastName, setLastName] = useState('Otto');
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState(''); // Store the selected state value
  const [zip, setZip] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // State to track if validation has been attempted
  const [validated, setValidated] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    // Prevent default browser submission
    event.preventDefault();
    event.stopPropagation();

    // Check validity using HTML5 constraint validation API
    if (form.checkValidity() === false) {
      // If form is invalid, set validated to true to show feedback
      setValidated(true);
    } else {
      // If form is valid, proceed with submission logic
      console.log('Form submitted successfully!');
      console.log({ firstName, lastName, username, city, state, zip, agreeTerms });
      // Reset validated state if needed, or redirect, etc.
      setValidated(true); // Keep showing valid feedback if desired after success
      // Or setValidated(false); to reset
    }
  };

  return (
    // Add 'was-validated' className conditionally based on the 'validated' state
    <form
      className={`row g-3 needs-validation ${validated ? 'was-validated' : ''}`}
      noValidate // Prevent default browser validation UI, let Bootstrap handle it
      onSubmit={handleSubmit}
    >
      {/* First Name */}
      <div className="col-md-4">
        <label htmlFor="validationCustom01" className="form-label">
          First name
        </label>
        <input
          type="text"
          className="form-control"
          id="validationCustom01"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required // HTML5 required attribute for validation check
        />
        {/* Bootstrap validation feedback elements */}
        <div className="valid-feedback">Looks good!</div>
        <div className="invalid-feedback">Please provide a first name.</div>
      </div>

      {/* Last Name */}
      <div className="col-md-4">
        <label htmlFor="validationCustom02" className="form-label">
          Last name
        </label>
        <input
          type="text"
          className="form-control"
          id="validationCustom02"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <div className="valid-feedback">Looks good!</div>
        <div className="invalid-feedback">Please provide a last name.</div>
      </div>

      {/* Username */}
      <div className="col-md-4">
        <label htmlFor="validationCustomUsername" className="form-label">
          Username
        </label>
        <div className="input-group has-validation"> {/* 'has-validation' is key for Bootstrap */}
          <span className="input-group-text" id="inputGroupPrepend">@</span>
          <input
            type="text"
            className="form-control"
            id="validationCustomUsername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-describedby="inputGroupPrepend"
            required
          />
          <div className="invalid-feedback">Please choose a username.</div>
        </div>
      </div>

      {/* City */}
      <div className="col-md-6">
        <label htmlFor="validationCustom03" className="form-label">
          City
        </label>
        <input
          type="text"
          className="form-control"
          id="validationCustom03"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />
        <div className="invalid-feedback">Please provide a valid city.</div>
      </div>

      {/* State */}
      <div className="col-md-3">
        <label htmlFor="validationCustom04" className="form-label">
          State
        </label>
        <select
          className="form-select"
          id="validationCustom04"
          value={state} // Controlled component: value is linked to state
          onChange={(e) => setState(e.target.value)}
          required // Ensures a selection other than the default is made
        >
          {/* Default disabled option */}
          <option disabled value="">Choose...</option>
          {/* Add your actual state options here */}
          <option value="state1">State 1</option>
          <option value="state2">State 2</option>
          <option value="...">...</option>
        </select>
        <div className="invalid-feedback">Please select a valid state.</div>
      </div>

      {/* Zip */}
      <div className="col-md-3">
        <label htmlFor="validationCustom05" className="form-label">
          Zip
        </label>
        <input
          type="text"
          className="form-control"
          id="validationCustom05"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          required
          // Add pattern attribute for more specific zip validation if needed
          // pattern="[0-9]{5}"
        />
        <div className="invalid-feedback">Please provide a valid zip.</div>
      </div>

      {/* Terms Agreement */}
      <div className="col-12">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="invalidCheck"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            required // Makes the checkbox mandatory
          />
          <label className="form-check-label mb-0" htmlFor="invalidCheck">
            Agree to terms and conditions
          </label>
          <div className="invalid-feedback mt-0">You must agree before submitting.</div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="col-12">
        <button className="btn btn-primary" type="submit">
          Submit form
        </button>
      </div>
    </form>
  );
};

export default Form1;