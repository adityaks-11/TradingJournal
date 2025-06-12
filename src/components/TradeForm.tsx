import React from 'react';
import { useForm } from 'react-hook-form';
import { useTradeStore } from '../store/tradeStore';
import { useAuthStore } from '../store/authStore';
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
  riskPercent: number; // Added risk percent
  lotSize: number; // Added lot size
  outcome: TradeOutcome;
  result: number;
  imageLink?: string;
  remarks?: string;
}

export const TradeForm: React.FC = () => {
  const { addTrade, isLoading, error } = useTradeStore();
  const { user } = useAuthStore();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<TradeFormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      direction: 'long',
      outcome: 'win',
      riskRewardRatio: 2.00,
      riskPercent: 1,
      lotSize: 1,
    }
  });

  const direction = watch('direction');
  const slPips = watch('slPips');
  const riskRewardRatio = watch('riskRewardRatio');
  const outcome = watch('outcome');
  const riskPercent = watch('riskPercent');
  const pair = watch('pair');
  const tpPips = watch('tpPips');
  const lotSize = watch('lotSize');
  const result = watch('result');

  // Pip value lookup
  const pipValueMap: Record<string, number> = {
    'XAUUSD': 1,
    'GBPUSD': 10,
    'BTCUSD': 1,
    'ETHUSD': 1,
    'NAS100': 1,
    'S&P500': 1,
    'US30': 1,
    'GBPJPY': 6.9,
    'AUDUSD': 10,
    'AUDJPY': 6.9,
    'CADJPY': 6.9,
    'EURGBP': 13.51,
    'USDJPY': 6.9,
    'USDCAD': 7.3,
    'EURUSD': 10,
    'EURCHF': 12.20,
    'GER30': 1,
  };

  // Auto-calculate TP Pips when SL or RR changes
  React.useEffect(() => {
    if (slPips && riskRewardRatio && slPips > 0 && riskRewardRatio > 0) {
      const tp = parseFloat((slPips * riskRewardRatio).toFixed(2));
      setValue('tpPips', tp, { shouldValidate: true });
    } else {
      setValue('tpPips', 0, { shouldValidate: true });
    }
  }, [slPips, riskRewardRatio, setValue]);

  // Auto-calculate Lot Size when relevant fields change, but allow manual override
  const [isLotSizeEdited, setIsLotSizeEdited] = React.useState(false);

  React.useEffect(() => {
    if (!user || !pair || !pipValueMap[pair] || !slPips || !riskPercent || slPips <= 0 || riskPercent <= 0) {
      if (!isLotSizeEdited) setValue('lotSize', 0, { shouldValidate: true });
      return;
    }
    if (!isLotSizeEdited) {
      const pipValue = pipValueMap[pair];
      const lots = ((user.currentBalance * (riskPercent / 100)) / (slPips * pipValue));
      setValue('lotSize', parseFloat(lots.toFixed(2)), { shouldValidate: true });
    }
    // Removed pipValueMap from dependency array
  }, [user, pair, slPips, riskPercent, setValue, isLotSizeEdited]);

  // When user edits lot size, mark as manually edited
  const handleLotSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLotSizeEdited(true);
    setValue('lotSize', parseFloat(e.target.value), { shouldValidate: true });
  };

  // If any dependency changes, and user wants to revert to auto, they can clear the field
  const handleLotSizeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '' || isNaN(Number(e.target.value))) {
      setIsLotSizeEdited(false);
    }
  };

  // Auto-calculate Result when relevant fields change
  React.useEffect(() => {
    if (!pair || !pipValueMap[pair] || !lotSize || lotSize <= 0) {
      setValue('result', 0, { shouldValidate: true });
      return;
    }
    const pipValue = pipValueMap[pair];
    let calcResult = 0;
    if (outcome === 'win') {
      calcResult = pipValue * (tpPips || 0) * lotSize;
    } else if (outcome === 'loss') {
      calcResult = -1 * pipValue * (slPips || 0) * lotSize;
    } else {
      calcResult = 0;
    }
    setValue('result', parseFloat(calcResult.toFixed(2)), { shouldValidate: true });
  }, [pair, lotSize, tpPips, slPips, outcome, setValue]);

  // Ensure riskRewardRatio resets to 2.00 on form reset
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
        riskRewardRatio: 2.00,
        riskPercent: 1,
        lotSize: 1,
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 transition-colors">
      <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Add New Trade</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Date
          </label>
          <input
            id="date"
            type="date"
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
            {...register('date', { required: 'Date is required' })}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-400">{errors.date.message}</p>
          )}
        </div>

        {/* Currency Pair */}
        <div>
          <label htmlFor="pair" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Currency Pair
          </label>
          <select
            id="pair"
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
            {...register('pair', { required: 'Currency pair is required' })}
          >
            <option value="">Select a currency pair</option>
            <option value="XAUUSD">XAUUSD</option>
            <option value="GBPUSD">GBPUSD</option>
            <option value="BTCUSD">BTCUSD</option>
            <option value="ETHUSD">ETHUSD</option>
            <option value="NAS100">NAS100</option>
            <option value="S&P500">S&P500</option>
            <option value="US30">US30</option>
            <option value="GBPJPY">GBPJPY</option>
            <option value="AUDUSD">AUDUSD</option>
            <option value="AUDJPY">AUDJPY</option>
            <option value="CADJPY">CADJPY</option>
            <option value="EURGBP">EURGBP</option>
            <option value="USDJPY">USDJPY</option>
            <option value="USDCAD">USDCAD</option>
            <option value="EURUSD">EURUSD</option>
            <option value="EURCHF">EURCHF</option>
            <option value="GER30">GER30</option>
          </select>
          {errors.pair && (
            <p className="mt-1 text-sm text-red-400">{errors.pair.message}</p>
          )}
        </div>

        {/* Session */}
        <div>
          <label htmlFor="session" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Session
          </label>
          <select
            id="session"
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
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
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Direction</label>
          <div className="grid grid-cols-2 gap-2">
            <label
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                direction === 'long'
                  ? 'bg-green-600/20 dark:bg-green-700/70 border-green-500 dark:border-green-600 border text-green-700 dark:text-green-300'
                  : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 border text-slate-700 dark:text-slate-300'
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
                  ? 'bg-red-600/20 dark:bg-red-700/70 border-red-500 dark:border-red-600 border text-red-700 dark:text-red-300'
                  : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 border text-slate-700 dark:text-slate-300'
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
          <label htmlFor="slPips" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            SL Pips
          </label>
          <input
            id="slPips"
            type="number"
            step="0.1"
            placeholder="20"
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
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
          <label htmlFor="tpPips" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            TP Pips
          </label>
          <input
            id="tpPips"
            type="number"
            step="0.1"
            placeholder="40"
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
            {...register('tpPips', {
              required: 'TP pips is required',
              min: {
                value: 0.1,
                message: 'TP pips must be greater than 0'
              }
            })}
            readOnly
          />
          {errors.tpPips && (
            <p className="mt-1 text-sm text-red-400">{errors.tpPips.message}</p>
          )}
        </div>

        {/* Risk Reward Ratio */}
        <div>
          <label htmlFor="riskRewardRatio" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Risk/Reward Ratio
          </label>
          <input
            id="riskRewardRatio"
            type="number"
            step="0.01"
            placeholder="2.00"
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
            {...register('riskRewardRatio', {
              required: 'Risk/reward ratio is required'
            })}
          />
        </div>

        {/* Risk Percent */}
        <div>
          <label htmlFor="riskPercent" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Risk %
          </label>
          <input
            id="riskPercent"
            type="number"
            step="0.01"
            placeholder="1.00"
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
            {...register('riskPercent', {
              required: 'Risk percent is required',
              min: { value: 0.01, message: 'Risk percent must be at least 0.01' },
              max: { value: 100, message: 'Risk percent must be at most 100' }
            })}
          />
          {errors.riskPercent && (
            <p className="mt-1 text-sm text-red-400">{errors.riskPercent.message}</p>
          )}
        </div>

        {/* Lot Size */}
        <div>
          <label htmlFor="lotSize" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Lot Size
          </label>
          <input
            id="lotSize"
            type="number"
            step="0.01"
            placeholder="1.00"
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
            {...register('lotSize', {
              required: 'Lot size is required',
              min: { value: 0.01, message: 'Lot size must be at least 0.01' }
            })}
            onChange={handleLotSizeChange}
            onBlur={handleLotSizeBlur}
          />
          {errors.lotSize && (
            <p className="mt-1 text-sm text-red-400">{errors.lotSize.message}</p>
          )}
        </div>

        {/* Outcome */}
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Outcome
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-colors font-medium
                ${outcome === 'win'
                  ? 'bg-green-600/80 dark:bg-green-700/80 border-green-600 dark:border-green-500 text-white dark:text-green-100'
                  : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-green-700 dark:text-green-300'}
              `}
              onClick={() => setValue('outcome', 'win', { shouldValidate: true })}
            >
              Win
            </button>
            <button
              type="button"
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-colors font-medium
                ${outcome === 'BE'
                  ? 'bg-gray-400/80 dark:bg-gray-600/80 border-gray-500 dark:border-gray-400 text-white dark:text-gray-100'
                  : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-300'}
              `}
              onClick={() => setValue('outcome', 'BE', { shouldValidate: true })}
            >
              Breakeven
            </button>
            <button
              type="button"
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-colors font-medium
                ${outcome === 'loss'
                  ? 'bg-red-600/80 dark:bg-red-700/80 border-red-600 dark:border-red-500 text-white dark:text-red-100'
                  : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-red-700 dark:text-red-300'}
              `}
              onClick={() => setValue('outcome', 'loss', { shouldValidate: true })}
            >
              Loss
            </button>
          </div>
          <input type="hidden" {...register('outcome', { required: 'Outcome is required' })} />
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
            readOnly
          />
          {errors.result && (
            <p className="mt-1 text-sm text-red-400">{errors.result.message}</p>
          )}
        </div>

        {/* Trade Image Link */}
        <div className="md:col-span-2">
          <label htmlFor="imageLink" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Trade Image Link
          </label>
          <input
            id="imageLink"
            type="url"
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
            {...register('imageLink')}
          />
          {errors.imageLink && (
            <p className="mt-1 text-sm text-red-400">{errors.imageLink.message}</p>
          )}
        </div>

        {/* Remarks */}
        <div className="md:col-span-2">
          <label htmlFor="remarks" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Remarks
          </label>
          <textarea
            id="remarks"
            rows={3}
            placeholder="Strategy notes, market conditions, etc."
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
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
            className="w-full py-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-md font-medium transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Add Trade'}
          </button>
        </div>
      </form>
    </div>
  );
};