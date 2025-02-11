import React from 'react';

const Voting = ({ category, options, onVote, currentVote, currentUser, organizerId, voteCreatorId }) => {
  // Determine if the current user is allowed to update/finalize the vote:
  // Only the organizer may update, and not if they are the vote initiator.
  const canUpdate = user => (user.id === organizerId && user.id !== voteCreatorId);

  return (
    <div className="flex flex-col space-y-4">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onVote(category, option.value)}
          disabled={!canUpdate(currentUser)}
          className={`px-4 py-2 rounded transition ${
            currentVote === option.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-blue-400'
          }`}
        >
          {option.label} ({option.votes})
        </button>
      ))}
      {!canUpdate(currentUser) && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Only the organizer can finalize or update the vote.
        </p>
      )}
    </div>
  );
};

export default Voting;
