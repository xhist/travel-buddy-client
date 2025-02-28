import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import API from '../../../api/api';

// Define reaction types and their emoji symbols
const REACTIONS = {
  LIKE: '👍',
  LOVE: '❤️',
  LAUGH: '😂',
  SURPRISED: '😮',
  SAD: '😢',
  ANGRY: '😠'
};

const MessageReactions = ({ message, onReact, isOwnMessage, showReactions, onReactionSelect }) => {
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const menuRef = useRef(null);

  // Load user details for users who reacted with the selected reaction type
  useEffect(() => {
    const loadUserDetails = async () => {
      if (!selectedReaction || !message.reactions) return;
      setIsLoadingUsers(true);
      const userIds = new Set();
      // Collect all unique usernames for the selected reaction type
      message.reactions.forEach(reaction => {
        if (reaction && reaction.reactionType === selectedReaction) {
          if (reaction.username) {
            userIds.add(reaction.username);
          }
        }
      });
      // Fetch user details for each username
      const detailsMap = {};
      try {
        for (const username of userIds) {
          try {
            const response = await API.get(`/users/${username}`);
            detailsMap[username] = response.data;
          } catch {
            console.error(`Failed to load user details for ${username}`);
            // Fallback to basic info if API call fails
            detailsMap[username] = { username, profilePicture: null };
          }
        }
        setUserDetails(detailsMap);
      } catch (err) {
        console.error('Error loading user details:', err);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    if (selectedReaction && message.reactions?.length > 0) {
      loadUserDetails();
    }
  }, [selectedReaction, message.reactions]);

  // Compute reaction counts and list of users for each reaction type
  const getReactionCounts = () => {
    const counts = {};
    if (Array.isArray(message.reactions)) {
      message.reactions.forEach(reaction => {
        if (reaction?.reactionType) {
          const type = reaction.reactionType;
          if (!counts[type]) {
            counts[type] = { count: 0, users: [] };
          }
          counts[type].count += 1;
          // Store username for listing (if available)
          if (reaction.username) {
            counts[type].users.push(reaction.username);
          }
        }
      });
    }
    return counts;
  };

  const reactionCounts = getReactionCounts();

  // Handle clicking on an emoji in the picker
  const handleReactionClick = (reactionType) => {
    onReact(message.id, reactionType);
    if (onReactionSelect) onReactionSelect();  // hide picker after selection
  };

  // Reaction users list dialog component (shows who reacted with a given type)
  const ReactionUsersList = ({ reactionType, reactionData }) => {
    if (!reactionData || reactionData.count === 0) return null;
    return (
      <Dialog.Root 
        open={selectedReaction === reactionType} 
        onOpenChange={(open) => setSelectedReaction(open ? reactionType : null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                       w-[90vw] max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 
                       shadow-lg z-50"
          >
            <Dialog.Title className="text-lg font-semibold mb-4 flex items-center gap-2">
              {REACTIONS[reactionType]} Reactions ({reactionData.count})
            </Dialog.Title>
            <div className="max-h-[60vh] overflow-y-auto">
              {isLoadingUsers ? (
                // Loading spinner
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                // List of users who reacted
                <div className="space-y-2">
                  {reactionData.users.map((username, idx) => {
                    const userData = userDetails[username] || { username, profilePicture: null };
                    return (
                      <div
                        key={`${reactionType}-${username}-${idx}`}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 
                                   rounded-lg transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/profile/${userData.username}`}
                      >
                        <img
                          src={userData.profilePicture || '/default-avatar.png'}
                          alt={userData.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {userData.username}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <Dialog.Close 
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 
                         dark:hover:bg-gray-700/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  };

  return (
    <div className="relative">
      {/* Reaction Picker: shown on hover from parent component's state */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} bottom-0 mb-[-40px]
                        bg-white dark:bg-gray-800 rounded-full shadow-lg p-1 flex 
                        items-center gap-1 z-20 border dark:border-gray-700`}
          >
            {Object.entries(REACTIONS).map(([type, emoji]) => (
              <motion.button
                key={type}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleReactionClick(type)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reaction Counts Bar: shows each reaction type with its count (below message) */}
      {Object.keys(reactionCounts).length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} bottom-0 mb-[-25px]
                      bg-white dark:bg-gray-800 rounded-full shadow-md px-2 py-1 flex 
                      items-center gap-1 z-10 text-sm border dark:border-gray-700`}
        >
          {Object.keys(reactionCounts).map(type => (
            <button
              key={type}
              onClick={() => setSelectedReaction(type)}
              className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 
                         rounded-full px-1 transition-colors"
            >
              <span>{REACTIONS[type]}</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {reactionCounts[type].count}
              </span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Reaction Details Dialogs for each reaction type (who reacted) */}
      {Object.keys(reactionCounts).map(type => (
        <ReactionUsersList key={type} reactionType={type} reactionData={reactionCounts[type]} />
      ))}
    </div>
  );
};

export default MessageReactions;