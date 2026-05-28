import Toast, { type ToastType } from '@/components/Toast';
import React, { useEffect, useState } from 'react';

type ToastState = {
  visible: boolean;
  message: string;
  type: ToastType;
  key: number;
};

type Listener = (payload: ToastState) => void;

let listener: Listener | null = null;

export function showSavedEventToast(message: string, type: ToastType = 'success') {
  listener?.({
    message,
    type,
    key: Date.now(),
    visible: true,
  });
}

export default function SavedEventToastHost() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
    key: 0,
  });

  useEffect(() => {
    listener = (payload) => {
      setToast((prev) => ({ ...prev, visible: false }));
      setTimeout(() => setToast(payload), 40);
    };
    return () => {
      listener = null;
    };
  }, []);

  return (
    <Toast
      key={toast.key}
      message={toast.message}
      visible={toast.visible}
      type={toast.type}
      duration={2400}
      onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
    />
  );
}
