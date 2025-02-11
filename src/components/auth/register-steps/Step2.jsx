import React, { useState, useEffect } from 'react';

const Step2 = ({ formData, onChange, onValidityChange }) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = () => {
    let newErrors = {};
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email))
      newErrors.email = 'Invalid email address';
    setErrors(newErrors);
    onValidityChange(Object.keys(newErrors).length === 0);
  };

  useEffect(() => {
    validate();
  }, [formData, onValidityChange]);

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  return (
    <>
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300">Gender</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={onChange}
          onBlur={handleBlur}
          className="mt-1 w-full px-4 py-2 border rounded"
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        {touched.gender && errors.gender && (
          <p className="text-red-600 text-sm mt-1">{errors.gender}</p>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={onChange}
          onBlur={handleBlur}
          className="mt-1 w-full px-4 py-2 border rounded"
        />
        {touched.email && errors.email && (
          <p className="text-red-600 text-sm mt-1">{errors.email}</p>
        )}
      </div>
    </>
  );
};

export default Step2;
