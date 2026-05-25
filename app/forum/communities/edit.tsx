import CommunityChannelForm from '@/components/forum/CommunityChannelForm';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function EditCommunityScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const communityId = String(params.id ?? '').trim();

  return <CommunityChannelForm mode="edit" communityId={communityId} />;
}
