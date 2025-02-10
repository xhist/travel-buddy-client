import React from 'react';

const Step2 = ({ formData, onChange }) => (
  <>
    <div className="mb-4">
      <label className="block text-gray-700 dark:text-gray-300">Gender</label>
      <select name="gender" value={formData.gender} onChange={onChange}
        className="mt-1 w-full px-4 py-2 border rounded" required>
        <option value="">Select gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
    </div>
    <div className="mb-4">
      <label className="block text-gray-700 dark:text-gray-300">Email</label>
      <input type="email" name="email" value={formData.email} onChange={onChange}
        className="mt-1 w-full px-4 py-2 border rounded" required />
    </div>
  </>
);

export default Step2;
