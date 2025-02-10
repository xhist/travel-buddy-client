import { useAuth } from './useAuth';

export const useTripAccess = (trip) => {
  const { user } = useAuth();
  if (!trip || !user) return false;
  return trip.members?.some((member) => member.id === user.id);
};