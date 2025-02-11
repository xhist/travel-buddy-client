import React, { useState } from 'react';
import API from '../../api/api';

const CreateTrip = () => {
  const [tripData, setTripData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  const onChange = (e) => {
    setTripData({ ...tripData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  // Validate a specific field on blur
  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'title':
        if (!value.trim()) {
          error = 'Trip title is required';
        } else if (value.trim().length < 3) {
          error = 'Trip title must be at least 3 characters';
        }
        break;
      case 'destination':
        if (!value.trim()) {
          error = 'Destination is required';
        }
        break;
      case 'startDate':
        if (!value) {
          error = 'Start date is required';
        }
        break;
      case 'endDate':
        if (!value) {
          error = 'End date is required';
        } else if (tripData.startDate && value < tripData.startDate) {
          error = 'End date must be after the start date';
        }
        break;
      case 'description':
        if (!value.trim()) {
          error = 'Description is required';
        } else if (value.trim().length < 10) {
          error = 'Description should be at least 10 characters long';
        }
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validate = () => {
    let newErrors = {};
    if (!tripData.title.trim()) {
      newErrors.title = 'Trip title is required';
    } else if (tripData.title.trim().length < 3) {
      newErrors.title = 'Trip title must be at least 3 characters';
    }
    if (!tripData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }
    if (!tripData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!tripData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (tripData.startDate && tripData.endDate < tripData.startDate) {
      newErrors.endDate = 'End date must be after the start date';
    }
    if (!tripData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (tripData.description.trim().length < 10) {
      newErrors.description = 'Description should be at least 10 characters long';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const response = await API.post('/trips', tripData);
      API.navigate(`/trip/${response.data.id}`);
    } catch (error) {
      console.error('Error creating trip:', error);
      setErrors({ form: 'An error occurred while creating the trip. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl p-8 w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center text-blue-600 dark:text-blue-400 mb-6">
          Create a New Trip
        </h2>
        {errors.form && <p className="mb-4 text-center text-red-600">{errors.form}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">Trip Title</label>
            <input
              type="text"
              name="title"
              value={tripData.title}
              onChange={onChange}
              onBlur={(e) => validateField(e.target.name, e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">Destination</label>
            <input
              type="text"
              name="destination"
              value={tripData.destination}
              onChange={onChange}
              onBlur={(e) => validateField(e.target.name, e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
            {errors.destination && <p className="text-red-600 text-sm mt-1">{errors.destination}</p>}
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={tripData.startDate}
                onChange={onChange}
                onBlur={(e) => validateField(e.target.name, e.target.value)}
                className="mt-1 w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              />
              {errors.startDate && <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300">End Date</label>
              <input
                type="date"
                name="endDate"
                value={tripData.endDate}
                onChange={onChange}
                onBlur={(e) => validateField(e.target.name, e.target.value)}
                className="mt-1 w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              />
              {errors.endDate && <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              name="description"
              value={tripData.description}
              onChange={onChange}
              onBlur={(e) => validateField(e.target.name, e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              rows="4"
            ></textarea>
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
          </div>
          <button type="submit" className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2 rounded hover:bg-blue-700 transition">
            Create Trip
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTrip;
