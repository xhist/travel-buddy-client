import React, { useEffect, useState } from 'react';
import API from '../../api/api';
import { Transition } from '@headlessui/react';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [tempProfile, setTempProfile] = useState({});

  useEffect(() => {
    API.get('/users/me')
      .then(res => {
        setProfile(res.data);
        setTempProfile(res.data);
      })
      .catch(err => console.error(err));
  }, []);

  const onChange = (e) => setTempProfile({ ...tempProfile, [e.target.name]: e.target.value });
  const handleSave = async () => {
    try {
      await API.put('/users/updateProfile', tempProfile);
      setProfile(tempProfile);
      setEditMode(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  if (!profile) return <div className="pt-20 text-center">Loading...</div>;

  return (
    <div className="pt-20 pb-8 px-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-700 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">My Profile</h2>
          <button onClick={() => setEditMode(prev => !prev)} className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 transition">
            {editMode ? 'Cancel' : 'Edit'}
          </button>
        </div>
        <div className="mt-6 flex items-center space-x-6">
          <img src={profile.profilePicture || '/default-avatar.png'} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-md" />
          <div className="flex-1">
            {editMode ? (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300">Username</label>
                  <input type="text" name="username" value={tempProfile.username} onChange={onChange}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 transition" />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300">Email</label>
                  <input type="email" name="email" value={tempProfile.email} onChange={onChange}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 transition" />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300">Bio</label>
                  <textarea name="bio" value={tempProfile.bio} onChange={onChange}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 transition" maxLength="512"></textarea>
                </div>
                <button onClick={handleSave} className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded hover:bg-green-700 transition">
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{profile.username}</h3>
                <p className="text-gray-600 dark:text-gray-300">{profile.email}</p>
                <p className="mt-2 text-gray-700 dark:text-gray-300">{profile.bio}</p>
              </>
            )}
          </div>
        </div>
        <Transition
          show={editMode}
          enter="transition-opacity duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="transition-opacity duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          {editMode && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-gray-600 rounded">
              <p className="text-blue-600 dark:text-blue-200">Editing mode is active. Remember to save your changes.</p>
            </div>
          )}
        </Transition>
      </div>
    </div>
  );
};

export default Profile;
