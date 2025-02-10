import React, { useState } from 'react';
import API from '../../api/api';
import { useNavigate } from 'react-router-dom';
import { Transition } from '@headlessui/react';
import Step1 from './register-steps/Step1';
import Step2 from './register-steps/Step2';
import Step3 from './register-steps/Step3';

const steps = [
  { id: 0, title: 'Account Info', component: Step1 },
  { id: 1, title: 'Personal Details', component: Step2 },
  { id: 2, title: 'Profile & Settings', component: Step3 }
];

const Register = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    loginName: '',
    password: '',
    gender: '',
    email: '',
    profilePicture: '',
    bio: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleNext = () => setCurrentStep((prev) => prev + 1);
  const handleBack = () => setCurrentStep((prev) => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  const StepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl p-8 max-w-lg w-full">
        <h2 className="text-3xl font-bold text-center text-blue-600 dark:text-blue-400 mb-6">Register</h2>
        <div className="mb-6 flex justify-between">
          {steps.map((step, idx) => (
            <div key={step.id} className={`flex-1 text-center ${idx === currentStep ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500'}`}>
              {step.title}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          <Transition
            show={true}
            enter="transition duration-500 transform"
            enterFrom="opacity-0 -translate-x-10"
            enterTo="opacity-100 translate-x-0"
          >
            <StepComponent formData={formData} onChange={onChange} />
          </Transition>
          <div className="flex justify-between mt-6">
            {currentStep > 0 && (
              <button type="button" onClick={handleBack} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition">
                Back
              </button>
            )}
            {currentStep < steps.length - 1 && (
              <button type="button" onClick={handleNext} className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                Next
              </button>
            )}
            {currentStep === steps.length - 1 && (
              <button type="submit" className="ml-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                Register
              </button>
            )}
          </div>
          <Transition
            show={!!error}
            enter="transition-opacity duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="transition-opacity duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            {error && <p className="mt-4 text-center text-red-600">{error}</p>}
          </Transition>
        </form>
      </div>
    </div>
  );
};

export default Register;
