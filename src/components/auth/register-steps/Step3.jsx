import React, { useState, useEffect } from 'react';

const Step3 = ({ formData, onChange, onValidityChange }) => {
  // Optional fields; we assume they are always valid
  useEffect(() => {
    onValidityChange(true);
  }, [formData, onValidityChange]);

  return (
    <>
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300">Profile Picture URL</label>
        <input
          type="url"
          name="profilePicture"
          value={formData.profilePicture}
          onChange={onChange}
          className="mt-1 w-full px-4 py-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300">Bio (max 512 characters)</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={onChange}
          className="mt-1 w-full px-4 py-2 border rounded"
          maxLength="512"
        ></textarea>
      </div>
    </>
  );
};

export default Step3;
