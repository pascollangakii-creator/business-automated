
import React, { useState, useMemo } from 'react';
import { Sale, TransactionItem, GeminiResponse } from './types';
import { processUserInput } from './services/geminiService';
import SummaryCard from './components/SummaryCard';
import SalesLog from './components/SalesLog';
import ChatInput from './components/ChatInput';
import { LogoIcon, PlusIcon, TrashIcon } from './components/Icon';

const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby6q4-m8CfTCbMKXbwut9JsZbPnJLoPUmb1Q6PRalft2CE5lhdNe6aLvVZZEZGzLe0_/exec';

const App: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [currentTransactionItems, setCurrentTransactionItems] = useState<TransactionItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [cashTendered, setCashTendered] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7);

  const todaysSales = useMemo(() => {
    return sales.filter(sale => sale.date === todayStr).sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
  }, [sales, todayStr]);

  const dailyTotal = useMemo(() => todaysSales.reduce((sum, sale) => sum + sale.total, 0), [todaysSales]);
  const monthlyTotal = useMemo(() => sales.filter(sale => sale.date.startsWith(currentMonthStr)).reduce((sum, sale) => sum + sale.total, 0), [sales, currentMonthStr]);
  
  const saleTotal = useMemo(() => {
    return currentTransactionItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [currentTransactionItems]);

  const cashTenderedValue = useMemo(() => parseFloat(cashTendered) || 0, [cashTendered]);

  const changeGiven = useMemo(() => {
    return cashTenderedValue > saleTotal ? cashTenderedValue - saleTotal : 0;
  }, [cashTenderedValue, saleTotal]);
  
  const creditDue = useMemo(() => {
    return saleTotal > cashTenderedValue ? saleTotal - cashTenderedValue : 0;
  }, [cashTenderedValue, saleTotal]);


  // Fix: Handle different Gemini response types to avoid type errors.
  const handleAddItemFromAI = async (text: string) => {
    setIsLoading(true);
    try {
      const response: GeminiResponse = await processUserInput(text);
      if (response.type === 'sale_entry') {
        const { itemName, quantity, unitPrice } = response.data;
        setCurrentTransactionItems(prev => [
          ...prev,
          { tempId: Date.now().toString(), itemName, quantity, unitPrice }
        ]);
      } else if (response.type === 'summary_request') {
        if (response.data.period === 'daily') {
          alert(`Today's total sales: KES ${dailyTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        } else {
          alert(`This month's total sales: KES ${monthlyTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        }
      } else {
        alert(response.data.text);
      }
    } catch (error) {
      console.error('Failed to process AI input:', error);
      alert('An error occurred while processing your request.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddItemManually = () => {
    setCurrentTransactionItems(prev => [
        ...prev,
        { tempId: Date.now().toString(), itemName: '', quantity: 1, unitPrice: 0 }
    ]);
  };

  const handleUpdateItem = (tempId: string, field: keyof Omit<TransactionItem, 'tempId'>, value: string) => {
    setCurrentTransactionItems(prev => prev.map(item => {
        if (item.tempId !== tempId) {
          return item;
        }

        if (field === 'itemName') {
            return { ...item, itemName: value };
        } else {
            // field is 'quantity' or 'unitPrice'
            const numericValue = parseFloat(value) || 0;
            return { ...item, [field]: numericValue };
        }
    }));
  };

  const handleRemoveItem = (tempId: string) => {
    setCurrentTransactionItems(prev => prev.filter(item => item.tempId !== tempId));
  };
  
  const handleRecordSale = async () => {
    if (currentTransactionItems.length === 0 || isRecording) return;
    setIsRecording(true);

    const newSales: Sale[] = currentTransactionItems.map(item => ({
        id: `${Date.now()}-${item.tempId}`,
        date: todayStr,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
    }));
    
    const sheetData = {
        customerName: customerName,
        customerEmail: customerEmail,
        items: newSales.map(sale => ({
            id: sale.id,
            itemName: sale.itemName,
            quantity: sale.quantity,
            unitPrice: sale.unitPrice,
            total: sale.total,
        })),
    };

    try {
        await fetch(GOOGLE_SHEET_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(sheetData)
        });
        alert('Sale recorded and saved to Google Sheet!');
    } catch (error) {
        console.error('Failed to send data to Google Sheet:', error);
        alert('Sale recorded locally, but failed to save to Google Sheet. Please check your connection.');
    } finally {
        // Always update local state and reset form
        setSales(prev => [...prev, ...newSales]);
        setCurrentTransactionItems([]);
        setCustomerName('');
        setCustomerEmail('');
        setCashTendered('');
        setIsRecording(false);
    }
  };


  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-200">
      <div className="container mx-auto p-4 lg:p-6">
        <header className="flex items-center gap-4 mb-6">
          <LogoIcon className="h-10 w-10 text-blue-600" />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">AI Sales Assistant</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Your smart business companion</p>
          </div>
        </header>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <SummaryCard title="Today's Sales" value={dailyTotal} currency="KES" />
            <SummaryCard title="This Month's Sales" value={monthlyTotal} currency="KES" />
        </div>

        <main className="grid grid-cols-1 lg:grid-cols-5 lg:gap-8">
          {/* Left Column: Transaction Form */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Transaction Details (POS)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Customer Name (Optional)</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Customer Email (Optional)</label>
                <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
              </div>
            </div>

            <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2 items-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase px-2">
                    <div className="col-span-5">Product Name</div>
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-3 text-right">Unit Price</div>
                    <div className="col-span-2 text-right">Total</div>
                </div>
                {currentTransactionItems.map(item => (
                    <div key={item.tempId} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5"><input type="text" value={item.itemName} onChange={e => handleUpdateItem(item.tempId, 'itemName', e.target.value)} className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"/></div>
                        <div className="col-span-2"><input type="number" value={item.quantity} onChange={e => handleUpdateItem(item.tempId, 'quantity', e.target.value)} className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-center focus:outline-none focus:ring-1 focus:ring-blue-500"/></div>
                        <div className="col-span-3"><input type="number" value={item.unitPrice} onChange={e => handleUpdateItem(item.tempId, 'unitPrice', e.target.value)} className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-right focus:outline-none focus:ring-1 focus:ring-blue-500"/></div>
                        <div className="col-span-2 flex items-center justify-end gap-1">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{(item.quantity * item.unitPrice).toLocaleString()}</span>
                          <button onClick={() => handleRemoveItem(item.tempId)} className="text-slate-400 hover:text-red-500 p-1 rounded-full"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    </div>
                ))}
                 <button onClick={handleAddItemManually} className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-2 py-1">
                    <PlusIcon className="w-4 h-4"/> Add Item
                </button>
            </div>
            
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Or use AI to add items quickly:</p>
              <ChatInput onSend={handleAddItemFromAI} isLoading={isLoading} />
            </div>
          </div>

          {/* Right Column: Payment Summary */}
          <div className="lg:col-span-2 mt-8 lg:mt-0">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 space-y-5 sticky top-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Payment & Summary (Cash)</h2>
                
                <div className="text-center bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sale Total:</p>
                    <p className="mt-1 text-4xl font-bold text-blue-600 dark:text-blue-400">
                        <span className="text-2xl align-middle">KSh</span> {saleTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                </div>

                <div>
                    <label className="text-xs font-medium text-slate-500">Cash Tendered (KSh)</label>
                    <input type="number" value={cashTendered} onChange={e => setCashTendered(e.target.value)} placeholder="0.00" className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-lg"/>
                </div>
                
                <div className="space-y-2 text-sm font-medium pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                        <span>Change Given:</span>
                        <span>KSh {changeGiven.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                     <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                        <span>Credit Due:</span>
                        <span>KSh {creditDue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                </div>

                <button 
                  onClick={handleRecordSale}
                  disabled={currentTransactionItems.length === 0 || creditDue > 0 || isRecording}
                  className="w-full bg-blue-600 text-white rounded-lg py-3 text-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all"
                >
                  {isRecording ? 'Recording...' : 'Record Sale'}
                </button>
            </div>
          </div>
        </main>
        
        <div className="mt-8">
            <SalesLog sales={todaysSales} />
        </div>

      </div>
    </div>
  );
};

export default App;
