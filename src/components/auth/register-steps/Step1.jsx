import React from 'react';

const Step1 = ({ formData, onChange }) => (
  <>
    <div className="mb-4">
      <label className="block text-gray-700 dark:text-gray-300">Username</label>
      <input type="text" name="username" value={formData.username} onChange={onChange}
        className="mt-1 w-full px-4 py-2 border rounded" required />
    </div>
    <div className="mb-4">
      <label className="block text-gray-700 dark:text-gray-300">Login Name (max 15 characters)</label>
      <input type="text" name="loginName" value={formData.loginName} onChange={onChange}
        className="mt-1 w-full px-4 py-2 border rounded" maxLength="15" required />
    </div>
    <div className="mb-4">
      <label className="block text-gray-700 dark:text-gray-300">Password (min 8 characters)</label>
      <input type="password" name="password" value={formData.password} onChange={onChange}
        className="mt-1 w-full px-4 py-2 border rounded" minLength="8" required />
    </div>
  </>
);

export default Step1;
