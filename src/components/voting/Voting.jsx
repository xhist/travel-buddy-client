import React from 'react';

const Voting = ({ category, options, onVote, currentVote }) => {
  return (
    <div className="flex space-x-4">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onVote(category, option.value)}
          className={`px-4 py-2 rounded transition ${currentVote === option.value ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-400'}`}
        >
          {option.label} ({option.votes})
        </button>
      ))}
    </div>
  );
};

export default Voting;
