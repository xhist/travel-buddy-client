import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useChatContext } from '../contexts/ChatContext';
import API from '../../api/api';
import { 
  Star, 
  MapPin, 
  Users, 
  Calendar, 
  Clock, 
  Edit, 
  Check, 
  UserPlus, 
  Mail,
  CheckCircle,
  Clock as PendingClock,
  Camera,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

const StarRating = ({ rating, onRatingChange, readonly = false }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !readonly && onRatingChange(star)}
          disabled={readonly}
          className={`${
            star <= rating 
              ? 'text-yellow-400' 
              : 'text-gray-300 dark:text-gray-600'
          } ${!readonly && 'hover:scale-110'} transition-transform`}
        >
          <Star className="w-6 h-6 fill-current" />
        </button>
      ))}
    </div>
  );
};

// Function to properly format dates that can be used in the Profile component
const formatReviewDate = (dateString) => {
  if (!dateString) return 'Recently';
  
  try {
    // Handle different date formats
    let date;
    
    if (Array.isArray(dateString)) {
      // Handle Java LocalDateTime format [year, month, day, hour, minute, second, nano]
      const [year, month, day, hour = 0, minute = 0] = dateString;
      date = new Date(year, month - 1, day, hour, minute);
    } else if (typeof dateString === 'string') {
      // Attempt to parse the string date
      date = new Date(dateString);
    } else {
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Recently';
    }
    
    return date.toLocaleDateString();
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Recently';
  }
};

// This function should be added to the Profile.jsx file and used where review dates are displayed,
// replacing the direct use of new Date(review.dateReviewed).toLocaleDateString() with:
// formatReviewDate(review.dateReviewed)

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const { handleStartChat } = useChatContext();
  const [profile, setProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [friendStatus, setFriendStatus] = useState(null); // 'friends', 'pending', null
  const fileInputRef = useRef(null);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    fetchProfileData();
  }, [username, currentUser]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [profileRes, tripsRes, reviewsRes, friendStatusRes] = await Promise.all([
        API.get(`/users/${username}`),
        API.get(`/users/${username}/trips`),
        API.get(`/reviews/${username}`),
        !isOwnProfile ? API.get(`/friends/status/${username}`) : Promise.resolve({ data: null })
      ]);

      setProfile(profileRes.data);
      setEditedProfile(profileRes.data);
      setTrips(tripsRes.data);
      setReviews(reviewsRes.data);
      setFriendStatus(friendStatusRes.data);

      // Find current user's review if it exists
      if (!isOwnProfile) {
        const userReview = reviewsRes.data.find(
          review => review.reviewer === currentUser?.username
        );
        setUserReview(userReview);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!newReview.comment.trim()) {
      toast.error('Please enter a review comment');
      return;
    }

    try {
      const response = await API.post('/reviews', {
        reviewee: username,
        reviewer: currentUser.username,
        ...newReview
      });

      setReviews(response.data);
      setUserReview(response.data.find(r => r.reviewer === currentUser.username));
      setNewReview({ rating: 5, comment: '' });
      toast.success('Review submitted successfully');
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error('Failed to submit review');
    }
  };

  const updateProfile = async () => {
    try {
      const response = await API.put('/users/updateProfile', { 
        ...editedProfile, 
        id: currentUser.id
      });
      setProfile(response.data);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile');
    }
  };

  const sendFriendRequest = async () => {
    try {
      await API.post(`/friends/${currentUser.id}/request/${profile.id}`);
      setFriendStatus({ hasPendingRequest: true });
      toast.success('Friend request sent');
    } catch (err) {
      console.error('Error sending friend request:', err);
      toast.error('Failed to send friend request');
    }
  };

  const startChat = () => {
    if (handleStartChat && profile) {
      handleStartChat(profile);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Only proceed if it's an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', file);

      // Upload the image
      const response = await API.post('/users/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update the profile picture URL in the edited profile
      setEditedProfile({
        ...editedProfile,
        profilePicture: response.data.url
      });

      toast.success('Profile picture uploaded');
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      toast.error('Failed to upload profile picture');
    }
  };

  const triggerFileInput = () => {
    if (editing) {
      fileInputRef.current.click();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 'No ratings';

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="h-32 sm:h-64 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <div className="px-6 py-4 relative">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group -mt-16"> {/* Fixed positioning by adding negative margin */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleProfilePictureUpload} 
                className="hidden" 
                accept="image/*"
              />
              <div 
                className={`relative rounded-full overflow-hidden cursor-${editing ? 'pointer' : 'default'}`}
                onClick={triggerFileInput}
              >
                <img
                  src={editing ? editedProfile.profilePicture || '/default-avatar.png' : profile.profilePicture || '/default-avatar.png'}
                  alt={profile.username}
                  className="w-32 h-32 object-cover border-4 border-white dark:border-gray-800"
                />
                {editing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>
            </div>
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                    {profile.username}
                  </h1>
                  {editing && (
                    <div className="mt-2">
                      <label className="block text-sm text-gray-600 dark:text-gray-400">Email</label>
                      <input
                        type="email"
                        value={editedProfile.email || ''}
                        onChange={(e) => setEditedProfile({
                          ...editedProfile,
                          email: e.target.value
                        })}
                        className="mt-1 px-3 py-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 border rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
                <div>
                  {isOwnProfile ? (
                    <div>
                      {editing ? (
                        <button
                          onClick={updateProfile}
                          className="ml-4 p-2 text-green-500 hover:text-green-600 transition-colors"
                        >
                          <Check className="w-6 h-6" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditing(true)}
                          className="ml-4 p-2 text-blue-500 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {friendStatus?.status ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
                          <UserCheck className="w-5 h-5" />
                          <span>Friends</span>
                        </div>
                      ) : friendStatus?.hasPendingRequest ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg">
                          <PendingClock className="w-5 h-5" />
                          <span>Request Pending</span>
                        </div>
                      ) : (
                        <button
                          onClick={sendFriendRequest}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <UserPlus className="w-5 h-5" />
                          Add Friend
                        </button>
                      )}
                      <button 
                        onClick={startChat}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="hidden sm:inline">Message</span>
                      </button>
                      <button
                        onClick={() => window.location.href = `mailto:${profile.email}`}
                        className="p-2 text-gray-500 hover:text-gray-600 transition-colors"
                      >
                        <Mail className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {!editing && profile.email && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {profile.email}
                </p>
              )}
              {editing ? (
                <textarea
                  value={editedProfile.bio || ''}
                  onChange={(e) => setEditedProfile({ 
                    ...editedProfile, 
                    bio: e.target.value 
                  })}
                  placeholder="Tell us about yourself..."
                  className="w-full mt-2 px-3 py-2 text-gray-600 dark:text-gray-400 bg-transparent border rounded focus:outline-none focus:border-blue-500"
                  rows="3"
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-400 mt-2">{profile.bio}</p>
              )}
              <div className="mt-4 flex items-center justify-center sm:justify-start gap-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {averageRating} / 5.0
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {trips.length} Trips
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Trips Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
            Trips
          </h2>
          {trips.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">No trips yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => (
                <Link
                  key={trip.id}
                  to={`/trips/${trip.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                      {trip.title}
                    </h3>
                    <div className="mt-4 space-y-2 text-sm">
                      <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {trip.destination}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
            Reviews
          </h2>
          
          {/* Review Form - Only show if not own profile and haven't reviewed yet */}
          {!isOwnProfile && !userReview && (
            <form onSubmit={submitReview} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Leave a Review
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    Rating
                  </label>
                  <StarRating
                    rating={newReview.rating}
                    onRatingChange={(rating) => setNewReview({ ...newReview, rating })}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    Comment
                  </label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows="4"
                    placeholder="Share your experience working with this user..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit Review
                </button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${
                    review.reviewer === currentUser?.username 
                      ? 'border-2 border-blue-500'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <img
                          src={review.reviewer.profilePicture || '/default-avatar.png'}
                          alt={review.reviewer}
                          className="w-10 h-10 rounded-full object-cover cursor-pointer"
                          onClick={() => window.location.href = `/profile/${review.reviewer}`}
                        />
                        <div className="absolute opacity-0 group-hover:opacity-100 bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full transition-opacity bg-gray-900 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap">
                          {review.reviewer}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {review.reviewer}
                          {review.reviewer === currentUser?.username && (
                            <span className="ml-2 text-sm text-blue-500">(Your Review)</span>
                          )}
                        </p>
                        <StarRating rating={review.rating} readonly={true} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {formatReviewDate(review.dateReviewed)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;