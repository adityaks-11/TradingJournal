import React from 'react';
import { useForm } from 'react-hook-form';
import { useTradeStore } from '../store/tradeStore';
import { format } from 'date-fns';
import { TradeDirection, TradeOutcome } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TradeFormData {
  date: string;
  pair: string;
  session: string;
  direction: TradeDirection;
  slPips: number;
  tpPips: number;
  riskRewardRatio: number;
  outcome: TradeOutcome;
  result: number;
  imageLink?: string;
  remarks?: string;
}

export const TradeForm: React.FC = () => {
  const { addTrade, isLoading, error } = useTradeStore();
  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<TradeFormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      direction: 'long',
      outcome: 'win',
    }
  });
  
  const direction = watch('direction');
  const slPips = watch('slPips');
  const tpPips = watch('tpPips');
  
  // Calculate risk-reward ratio when SL or TP changes
  React.useEffect(() => {
    if (slPips && tpPips && slPips > 0) {
      const rr = parseFloat((tpPips / slPips).toFixed(2));
      setValue('riskRewardRatio', rr);
    }
  }, [slPips, tpPips, setValue]);
  
  const onSubmit = async (data: TradeFormData) => {
    await addTrade(
      data.date,
      data.pair,
      data.session,
      data.direction,
      data.slPips,
      data.tpPips,
      data.riskRewardRatio,
      data.outcome,
      data.result,
      data.imageLink,
      data.remarks
    );
    
    // Reset form after successful submission
    if (!error) {
      reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        direction: 'long',
        outcome: 'win',
      });
    }
  };
  
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Add New Trade</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-1">
            Date
          </label>
          <input
            id="date"
            type="date"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            {...register('date', { required: 'Date is required' })}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-400">{errors.date.message}</p>
          )}
        </div>
        
        {/* Currency Pair */}
        <div>
          <label htmlFor="pair" className="block text-sm font-medium mb-1">
            Currency Pair
          </label>
          <input
            id="pair"
            type="text"
            placeholder="EUR/USD"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            {...register('pair', { required: 'Currency pair is required' })}
          />
          {errors.pair && (
            <p className="mt-1 text-sm text-red-400">{errors.pair.message}</p>
          )}
        </div>
        
        {/* Session */}
        <div>
          <label htmlFor="session" className="block text-sm font-medium mb-1">
            Session
          </label>
          <select
            id="session"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            {...register('session', { required: 'Session is required' })}
          >
            <option value="London">London</option>
            <option value="New York">New York</option>
            <option value="Tokyo">Tokyo</option>
            <option value="Sydney">Sydney</option>
            <option value="Overlap">Session Overlap</option>
          </select>
          {errors.session && (
            <p className="mt-1 text-sm text-red-400">{errors.session.message}</p>
          )}
        </div>
        
        {/* Direction */}
        <div>
          <label className="block text-sm font-medium mb-1">Direction</label>
          <div className="grid grid-cols-2 gap-2">
            <label 
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                direction === 'long'
                  ? 'bg-green-700/70 border-green-600 border'
                  : 'bg-slate-700 border-slate-600 border'
              }`}
            >
              <input
                type="radio"
                value="long"
                className="sr-only"
                {...register('direction')}
              />
              <TrendingUp size={16} />
              <span>Long</span>
            </label>
            
            <label 
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                direction === 'short'
                  ? 'bg-red-700/70 border-red-600 border'
                  : 'bg-slate-700 border-slate-600 border'
              }`}
            >
              <input
                type="radio"
                value="short"
                className="sr-only"
                {...register('direction')}
              />
              <TrendingDown size={16} />
              <span>Short</span>
            </label>
          </div>
        </div>
        
        {/* SL Pips */}
        <div>
          <label htmlFor="slPips" className="block text-sm font-medium mb-1">
            SL Pips
          </label>
          <input
            id="slPips"
            type="number"
            step="0.1"
            placeholder="20"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            {...register('slPips', { 
              required: 'SL pips is required',
              min: {
                value: 0.1,
                message: 'SL pips must be greater than 0'
              }
            })}
          />
          {errors.slPips && (
            <p className="mt-1 text-sm text-red-400">{errors.slPips.message}</p>
          )}
        </div>
        
        {/* TP Pips */}
        <div>
          <label htmlFor="tpPips" className="block text-sm font-medium mb-1">
            TP Pips
          </label>
          <input
            id="tpPips"
            type="number"
            step="0.1"
            placeholder="40"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            {...register('tpPips', { 
              required: 'TP pips is required',
              min: {
                value: 0.1,
                message: 'TP pips must be greater than 0'
              }
            })}
          />
          {errors.tpPips && (
            <p className="mt-1 text-sm text-red-400">{errors.tpPips.message}</p>
          )}
        </div>
        
        {/* Risk Reward Ratio */}
        <div>
          <label htmlFor="riskRewardRatio" className="block text-sm font-medium mb-1">
            Risk/Reward Ratio
          </label>
          <input
            id="riskRewardRatio"
            type="number"
            step="0.01"
            placeholder="2.00"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            {...register('riskRewardRatio', { 
              required: 'Risk/reward ratio is required'
            })}
            readOnly
          />
        </div>
        
        {/* Outcome */}
        <div>
          <label htmlFor="outcome" className="block text-sm font-medium mb-1">
            Outcome
          </label>
          <select
            id="outcome"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            {...register('outcome', { required: 'Outcome is required' })}
          >
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="BE">Break Even</option>
          </select>
          {errors.outcome && (
            <p className="mt-1 text-sm text-red-400">{errors.outcome.message}</p>
          )}
        </div>
        
        {/* Result */}
        <div>
          <label htmlFor="result" className="block text-sm font-medium mb-1">
            Result ($)
          </label>
          <input
            id="result"
            type="number"
            step="0.01"
            placeholder="125.50"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            {...register('result', { 
              required: 'Result is required'
            })}
          />
          {errors.result && (
            <p className="mt-1 text-sm text-red-400">{errors.result.message}</p>
          )}
        </div>
        
        {/* Trade Image Link */}
        <div className="md:col-span-2">
          <label htmlFor="imageLink" className="block text-sm font-medium mb-1">
            Trade Image Link
          </label>
          <input
            id="imageLink"
            type="url"
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            {...register('imageLink')}
          />
          {errors.imageLink && (
            <p className="mt-1 text-sm text-red-400">{errors.imageLink.message}</p>
          )}
        </div>
        
        {/* Remarks */}
        <div className="md:col-span-2">
          <label htmlFor="remarks" className="block text-sm font-medium mb-1">
            Remarks
          </label>
          <textarea
            id="remarks"
            rows={3}
            placeholder="Strategy notes, market conditions, etc."
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            {...register('remarks')}
          />
        </div>
        
        {error && (
          <div className="md:col-span-2 p-3 bg-red-900/50 border border-red-700 rounded-md">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}
        
        <div className="md:col-span-2 mt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-teal-600 hover:bg-teal-700 rounded-md font-medium transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Add Trade'}
          </button>
        </div>
      </form>
    </div>
  );
};