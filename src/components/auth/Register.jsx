import React, { useState } from 'react';
import API from '../../api/api';
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
  const [isStepValid, setIsStepValid] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    loginName: '',
    password: '',
    gender: '',
    email: '',
    profilePicture: '',
    bio: ''
  });
  const [errors, setErrors] = useState({});

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleValidityChange = (isValid) => {
    setIsStepValid(isValid);
  };

  const handleNext = () => {
    if (!isStepValid) return;
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStepValid) return;
    try {
      await API.post('/auth/register', formData);
      API.navigate('/login');
    } catch (err) {
      setErrors({ form: 'Registration failed. Please try again.' });
    }
  };

  const StepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl p-8 max-w-lg w-full">
        <h2 className="text-3xl font-bold text-center text-blue-600 dark:text-blue-400 mb-6">Register</h2>
        {errors.form && <p className="mb-4 text-center text-red-600">{errors.form}</p>}
        <div className="mb-6 flex justify-between">
          {steps.map((step, idx) => (
            <div key={step.id} className={`flex-1 text-center ${idx === currentStep ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500'}`}>
              {step.title}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          <StepComponent 
            formData={formData} 
            onChange={onChange} 
            onValidityChange={handleValidityChange} 
          />
          <div className="flex justify-between mt-6">
            {currentStep > 0 && (
              <button type="button" onClick={handleBack} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition">
                Back
              </button>
            )}
            {currentStep < steps.length - 1 && (
              <button 
                type="button" 
                onClick={handleNext} 
                disabled={!isStepValid} 
                className={`ml-auto px-4 py-2 rounded transition ${isStepValid ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-400 text-gray-200'}`}
              >
                Next
              </button>
            )}
            {currentStep === steps.length - 1 && (
              <button 
                type="submit" 
                disabled={!isStepValid} 
                className={`ml-auto px-4 py-2 rounded transition ${isStepValid ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-400 text-gray-200'}`}
              >
                Register
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
