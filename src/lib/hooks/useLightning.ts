import { useState, useEffect } from 'react';
import { LightningPayment } from '../types';
import { toast } from 'sonner';

export function useLightning() {
  const [payments, setPayments] = useState<LightningPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate lightning address
  const validateLightningAddress = (address: string): boolean => {
    // Basic validation for lightning address format
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(address);
  };

  // Generate QR code data for lightning address
  const generateLightningQR = (address: string, amount?: number): string => {
    if (!validateLightningAddress(address)) {
      throw new Error('Invalid lightning address');
    }

    const prefix = amount ? `lightning:${address}?amount=${amount}` : `lightning:${address}`;
    return prefix;
  };

  // Simulate receiving a payment (in a real app, this would be handled by a backend)
  const simulatePayment = (amount: number, sender: string, message: string) => {
    const newPayment: LightningPayment = {
      id: Date.now().toString(),
      amount,
      timestamp: new Date().toISOString(),
      status: 'pending',
      sender,
      message
    };

    setPayments(prev => [newPayment, ...prev]);
    toast.success(`Received ${amount} sats from ${sender}`);

    // Simulate payment completion after 2 seconds
    setTimeout(() => {
      setPayments(prev =>
        prev.map(payment =>
          payment.id === newPayment.id
            ? { ...payment, status: 'completed' }
            : payment
        )
      );
    }, 2000);
  };

  // Get payment history
  const getPaymentHistory = () => {
    return payments;
  };

  // Get total received amount
  const getTotalReceived = () => {
    return payments
      .filter(payment => payment.status === 'completed')
      .reduce((total, payment) => total + payment.amount, 0);
  };

  // Get pending payments
  const getPendingPayments = () => {
    return payments.filter(payment => payment.status === 'pending');
  };

  // Export payment history
  const exportPaymentHistory = () => {
    const data = JSON.stringify(payments, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lightning-payments-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    payments,
    loading,
    error,
    validateLightningAddress,
    generateLightningQR,
    simulatePayment,
    getPaymentHistory,
    getTotalReceived,
    getPendingPayments,
    exportPaymentHistory
  };
} 