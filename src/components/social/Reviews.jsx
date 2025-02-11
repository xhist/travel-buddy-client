import React, { useState, useEffect } from 'react';
import API from '../../api/api';

const Reviews = ({ reviewerId, revieweeId }) => {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    API.get(`/reviews/${revieweeId}`).then((res) => setReviews(res.data));
  }, [revieweeId]);

  const submitReview = async () => {
    const res = await API.post('/reviews', { reviewer: reviewerId, reviewee: revieweeId, ...newReview });
    setReviews([...reviews, res.data]);
    setNewReview({ rating: 5, comment: '' });
  };

  const averageRating = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 'No ratings';

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">User Reviews (Average Rating: {averageRating})</h3>
      <div className="mb-4">
        <select value={newReview.rating} onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })} className="px-4 py-2 border rounded mr-2">
          {[1,2,3,4,5].map(n => (
            <option key={n} value={n}>{n} Star{n > 1 && 's'}</option>
          ))}
        </select>
        <input type="text" placeholder="Write a review..." value={newReview.comment} onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })} className="px-4 py-2 border rounded mr-2 w-2/3" />
        <button onClick={submitReview} className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
      </div>
      <ul>
        {reviews.map((rev) => (
          <li key={rev.id} className="border-b py-2">
            <p><strong>{rev.rating} Stars</strong> - {rev.comment}</p>
            <p className="text-gray-500 text-sm">By {rev.reviewer.username} on {new Date(rev.createdAt).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Reviews;
