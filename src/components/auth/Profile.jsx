import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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
  Clock as PendingClock
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

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
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
          review => review.reviewer.username === currentUser?.username
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
        ...newReview
      });

      setReviews(response.data);
      setUserReview(response.data.find(r => r.reviewer.username === currentUser.username));
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
      setFriendStatus('pending');
      toast.success('Friend request sent');
    } catch (err) {
      console.error('Error sending friend request:', err);
      toast.error('Failed to send friend request');
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
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <div className="px-6 py-4 relative">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {editing ? (
              <div className="relative group">
                <img
                  src={editedProfile.profilePicture || '/default-avatar.png'}
                  alt={editedProfile.username}
                  className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-white dark:border-gray-800 -mt-16"
                />
                <input
                  type="text"
                  value={editedProfile.profilePicture || ''}
                  onChange={(e) => setEditedProfile({ 
                    ...editedProfile, 
                    profilePicture: e.target.value 
                  })}
                  placeholder="Profile picture URL"
                  className="absolute bottom-0 left-0 w-full px-2 py-1 text-sm bg-black/50 text-white"
                />
              </div>
            ) : (
              <img
                src={profile.profilePicture || '/default-avatar.png'}
                alt={profile.username}
                className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-white dark:border-gray-800 -mt-16"
              />
            )}
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                    {profile.username}
                  </h1>
                </div>
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
                    {friendStatus === 'friends' ? (
                      <span className="flex items-center gap-2 text-green-500">
                        <CheckCircle className="w-5 h-5" />
                        Friends
                      </span>
                    ) : friendStatus === 'pending' ? (
                      <span className="flex items-center gap-2 text-yellow-500">
                        <PendingClock className="w-5 h-5" />
                        Request Pending
                      </span>
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
                      onClick={() => window.location.href = `mailto:${profile.email}`}
                      className="p-2 text-gray-500 hover:text-gray-600 transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
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
                    review.reviewer.username === currentUser?.username 
                      ? 'border-2 border-blue-500'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={review.reviewer.profilePicture || '/default-avatar.png'}
                        alt={review.reviewer.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {review.reviewer.username}
                          {review.reviewer.username === currentUser?.username && (
                            <span className="ml-2 text-sm text-blue-500">(Your Review)</span>
                          )}
                        </p>
                        <StarRating rating={review.rating} readonly={true} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(review.dateReviewed).toLocaleDateString()}
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