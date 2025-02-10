import React, { useEffect, useState } from 'react';
import API from '../../api/api';

const UserReliability = ({ userId }) => {
  const [rating, setRating] = useState(null);

  useEffect(() => {
    API.get(`/reviews/user/${userId}/average`)
      .then((res) => setRating(res.data.averageRating))
      .catch((err) => console.error(err));
  }, [userId]);

  return (
    <div className="mt-4">
      <p className="text-lg font-bold">User Reliability: {rating ? `${rating} / 5` : 'No ratings yet'}</p>
    </div>
  );
};

export default UserReliability;
