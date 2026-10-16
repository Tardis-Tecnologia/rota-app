import TabBarCenterButton from '@/components/TabBarCenterButton';
import { BottomTabBarButtonProps } from 'expo-router/js-tabs';
import React from 'react';

type ComercianteScanTabButtonProps = BottomTabBarButtonProps;

export default function ComercianteScanTabButton(props: ComercianteScanTabButtonProps) {
  return (
    <TabBarCenterButton
      {...props}
      icon="qr-code"
      accessibilityLabel="Conferir cupom com QR Code"
      elevate={-40}
    />
  );
}
