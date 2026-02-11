"use client"

import { useState, useEffect, useCallback } from 'react';

export interface GuildMember {
  user_id: string;
  username: string;
  display_name: string;
  is_bot: boolean;
  avatar_url?: string;
}

interface UseGuildMembersResult {
  members: GuildMember[];
  isLoading: boolean;
  error: string | null;
  searchMembers: (query: string) => Promise<GuildMember[]>;
  refreshMembers: () => Promise<void>;
}

export function useGuildMembers(guildId: string): UseGuildMembersResult {
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!guildId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/guild/${guildId}/members?limit=100`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch guild members');
      }
      
      const data = await response.json();
      const filteredMembers = data.filter((member: GuildMember) => !member.is_bot);
      
      setMembers(filteredMembers);
    } catch (err) {
      console.error('Error loading guild members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setIsLoading(false);
    }
  }, [guildId]);

  const searchMembers = useCallback(async (query: string): Promise<GuildMember[]> => {
    if (!guildId || !query.trim()) return members;
    
    try {
      const response = await fetch(`/api/guild/${guildId}/members?search=${encodeURIComponent(query)}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to search guild members');
      }
      
      const data = await response.json();
      return data.filter((member: GuildMember) => !member.is_bot);
    } catch (err) {
      console.error('Error searching guild members:', err);
      return [];
    }
  }, [guildId, members]);

  const refreshMembers = useCallback(async () => {
    await loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  return {
    members,
    isLoading,
    error,
    searchMembers,
    refreshMembers
  };
}