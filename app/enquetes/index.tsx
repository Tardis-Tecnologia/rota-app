import FeedPollMuralContent from '@/components/feed/FeedPollMuralContent';
import { useFeedPollMural } from '@/hooks/useFeedPollMural';
import React from 'react';

export default function EnquetesMuralScreen() {
  const mural = useFeedPollMural();
  return <FeedPollMuralContent mural={mural} />;
}
