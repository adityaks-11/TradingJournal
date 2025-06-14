import React, { useState, useRef } from 'react';
import { Modal } from './ui/Modal';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Toast, ToastType } from './ui/Toast';
import { useAuthStore } from '../store/authStore';
import { useTradeStore } from '../store/tradeStore';
import { useWithdrawalStore } from '../store/withdrawalStore';

interface EditStartingBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStartingBalance: number;
}

export const EditStartingBalanceModal: React.FC<EditStartingBalanceModalProps> = ({
  isOpen,
  onClose,
  currentStartingBalance
}) => {
  const { updateStartingBalance, isLoading } = useAuthStore();
  const { trades, fetchTrades } = useTradeStore();
  const { withdrawals, fetchWithdrawals } = useWithdrawalStore();
  
  // State for the modal
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [newBalanceValue, setNewBalanceValue] = useState<number>(currentStartingBalance);
  
  // Toast notification state
  const [toast, setToast] = useState<{
    type: ToastType;
    message: string;
    isVisible: boolean;
  }>({
    type: 'success',
    message: '',
    isVisible: false
  });
  
  // Input ref to get the value directly
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Reset the form when the modal opens
  React.useEffect(() => {
    if (isOpen) {
      setNewBalanceValue(currentStartingBalance);
    }
  }, [isOpen, currentStartingBalance]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseFloat(value);
    
    if (!isNaN(numericValue)) {
      setNewBalanceValue(numericValue);
      console.log('New balance value set to:', numericValue);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the value directly from the input field
    const inputValue = inputRef.current?.value;
    console.log('Input value from ref:', inputValue);
    
    if (!inputValue) {
      setToast({
        type: 'error',
        message: 'Please enter a starting balance',
        isVisible: true
      });
      return;
    }
    
    const balanceValue = parseFloat(inputValue);
    
    if (isNaN(balanceValue)) {
      setToast({
        type: 'error',
        message: 'Please enter a valid number',
        isVisible: true
      });
      return;
    }
    
    if (balanceValue < 0) {
      setToast({
        type: 'error',
        message: 'Starting balance cannot be negative',
        isVisible: true
      });
      return;
    }
    
    if (balanceValue > 1000000000) {
      setToast({
        type: 'error',
        message: 'Starting balance amount is too large',
        isVisible: true
      });
      return;
    }
    
    // Store the value for the confirmation dialog
    setNewBalanceValue(balanceValue);
    console.log('Confirmed balance value for dialog:', balanceValue);
    
    // Open confirmation dialog
    setIsConfirmDialogOpen(true);
  };
  
  const handleConfirmEdit = async () => {
    try {
      console.log('Confirming edit with balance value:', newBalanceValue);
      // Round to 2 decimal places
      const roundedValue = Math.round(newBalanceValue * 100) / 100;
      // Update the starting balance
      const newCurrentBalance = await updateStartingBalance(roundedValue, trades, withdrawals);
      
      // Close dialogs
      setIsConfirmDialogOpen(false);
      onClose();
      
      // Show success message
      setToast({
        type: 'success',
        message: `Starting balance updated to $${roundedValue.toFixed(2)}. Current balance recalculated to $${newCurrentBalance.toFixed(2)}.`,
        isVisible: true
      });
      
      // Refresh data
      fetchTrades();
      fetchWithdrawals();
    } catch (error) {
      console.error('Error updating starting balance:', error);
      
      // Close confirmation dialog but keep edit modal open
      setIsConfirmDialogOpen(false);
      
      // Show error message
      setToast({
        type: 'error',
        message: error instanceof Error
          ? error.message
          : 'Failed to update starting balance. Please try again.',
        isVisible: true
      });
    }
  };
  
  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };
  
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Starting Balance"
        size="sm"
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Changing your starting balance will recalculate your current balance based on all your trades and withdrawals.
            </p>
            
            <label htmlFor="startingBalance" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              New Starting Balance ($)
            </label>
            <input
              id="startingBalance"
              type="number"
              step="0.01"
              min="0"
              defaultValue={currentStartingBalance}
              ref={inputRef}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
              placeholder="1000.00"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmEdit}
        title="Confirm Balance Change"
        message={`Are you sure you want to change your starting balance to $${newBalanceValue.toFixed(2)}? This will recalculate your current balance using the formula: Starting Balance + All Profits - All Losses - All Withdrawals.`}
        confirmText="Confirm"
        cancelText="Cancel"
      />
      
      {/* Toast Notification */}
      <Toast
        type={toast.type}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
    </>
  );
};
