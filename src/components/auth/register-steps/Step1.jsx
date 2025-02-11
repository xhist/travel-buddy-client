import React, { useState, useEffect } from 'react';

const Step1 = ({ formData, onChange, onValidityChange }) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = () => {
    let newErrors = {};

    // Username validations
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (/\s/.test(formData.username)) {
      newErrors.username = 'Username should not contain spaces';
    }

    // Password validations
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one digit';
    } else if (!/(?=.*[!@#$%^&*])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    }

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
        <label className="block text-gray-700 dark:text-gray-300">Username</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={onChange}
          onBlur={handleBlur}
          className="mt-1 w-full px-4 py-2 border rounded"
        />
        {touched.username && errors.username && (
          <p className="text-red-600 text-sm mt-1">{errors.username}</p>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300">
          Password (min 8 characters, include a digit and special character)
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={onChange}
          onBlur={handleBlur}
          className="mt-1 w-full px-4 py-2 border rounded"
        />
        {touched.password && errors.password && (
          <p className="text-red-600 text-sm mt-1">{errors.password}</p>
        )}
      </div>
    </>
  );
};

export default Step1;
