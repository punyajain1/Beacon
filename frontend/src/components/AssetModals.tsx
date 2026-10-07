'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { X } from 'lucide-react';

export function AssetModals({ isOpen, onClose, type, asset, onSuccess }: { isOpen: boolean, onClose: () => void, type: 'add' | 'sync' | 'update' | null, asset?: any, onSuccess: () => void }) {
  const [symbol, setSymbol] = useState('');
  const [assetType, setAssetType] = useState('CRYPTO');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchedHoldings, setFetchedHoldings] = useState<any[] | null>(null);
  const [selectedHoldingIndices, setSelectedHoldingIndices] = useState<number[]>([]);
  const [confirmationConflicts, setConfirmationConflicts] = useState<string[] | null>(null);

  useEffect(() => {
    if (type === 'update' && asset) {
      setSymbol(asset.symbol || '');
      setAssetType(asset.assetType || 'CRYPTO');
      setAmount(asset.amount?.toString() || '');
      setPrice(asset.averageBuyPrice?.toString() || asset.currentPrice?.toString() || '');
    } else {
      setSymbol('');
      setAssetType('CRYPTO');
      setAmount('');
      setPrice('');
      setAddress('');
      setFetchedHoldings(null);
      setSelectedHoldingIndices([]);
      setConfirmationConflicts(null);
    }
  }, [type, asset, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === 'add') {
        await api.addAsset({ 
          assetName: symbol.toUpperCase(),
          assetType: assetType,
          symbol: symbol.toUpperCase(), 
          amount: Number(amount), 
          buyingPrice: Number(price) 
        });
        onSuccess();
        onClose();
      } else if (type === 'update') {
        await api.updateAsset(asset.id, { amount: Number(amount), buyingPrice: Number(price) });
        onSuccess();
        onClose();
      } else if (type === 'sync') {
        if (!fetchedHoldings) {
          if (!address) {
            alert('Please enter a wallet address');
            setLoading(false);
            return;
          }
          
          try {
            const response = await fetch(`https://api.ethplorer.io/getAddressInfo/${address}?apiKey=freekey`);
            const data = await response.json();
            
            if (data.error) {
              throw new Error(data.error.message);
            }

            const holdings: any[] = [];
            
            if (data.ETH && data.ETH.balance > 0) {
              holdings.push({
                symbol: 'ETH',
                amount: data.ETH.balance,
                assetType: 'CRYPTO',
                assetName: 'Ethereum',
                price: data.ETH.price?.rate || 0
              });
            }

            if (data.tokens) {
              data.tokens.forEach((t: any) => {
                const decimals = parseInt(t.tokenInfo.decimals) || 18;
                const rawBal = parseFloat(t.rawBalance);
                const amount = rawBal / Math.pow(10, decimals);
                // Only show tokens with a symbol and positive balance
                if (amount > 0 && t.tokenInfo.symbol) {
                  holdings.push({
                    symbol: t.tokenInfo.symbol,
                    amount: amount,
                    assetType: 'CRYPTO',
                    assetName: t.tokenInfo.name || t.tokenInfo.symbol,
                    price: t.tokenInfo.price?.rate || 0
                  });
                }
              });
            }

            // Sort by value (amount * price) descending
            holdings.sort((a, b) => (b.amount * b.price) - (a.amount * a.price));

            if (holdings.length === 0) {
              alert('No tokens found in this address');
              setLoading(false);
              return;
            }

            setFetchedHoldings(holdings);
            // Pre-select all
            setSelectedHoldingIndices(holdings.map((_, i) => i));
          } catch (err: any) {
            console.error('Fetch error:', err);
            alert(`Failed to fetch wallet: ${err.message}`);
          }
          setLoading(false);
          return;
        } else {
          if (confirmationConflicts !== null) {
            return; // Handled by separate buttons
          }
          const toSync = fetchedHoldings.filter((_, i) => selectedHoldingIndices.includes(i));
          
          const res = await api.syncWallet(toSync);
          if (res.requiresConfirmation) {
            setConfirmationConflicts(res.conflicts || []);
            setLoading(false);
            return;
          } else {
            onSuccess();
            onClose();
          }
        }
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleResolution = async (resolution: 'add' | 'replace') => {
    setLoading(true);
    try {
      const toSync = fetchedHoldings!.filter((_, i) => selectedHoldingIndices.includes(i));
      await api.syncWallet(toSync, resolution);
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-lg relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-6 top-6 text-muted-foreground hover:text-foreground transition-colors">
          <X size={20} />
        </button>

        <h3 className="text-xl font-medium text-foreground mb-6">
          {type === 'add' ? 'Add Asset Position' : type === 'update' ? 'Update Asset' : 'Sync Wallet Holdings'}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {type === 'add' || type === 'update' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Asset Type</label>
                  <select disabled={type === 'update'} value={assetType} onChange={e => setAssetType(e.target.value)} className="w-full rounded-xl bg-secondary py-2 px-3 text-foreground outline-none border border-border disabled:opacity-50">
                    <option value="CRYPTO">Crypto</option>
                    <option value="METAL">Metal</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Asset Symbol</label>
                  <input required disabled={type === 'update'} type="text" value={symbol} onChange={e => setSymbol(e.target.value)} className="w-full rounded-xl bg-secondary py-2 px-3 text-foreground outline-none border border-border disabled:opacity-50" placeholder="e.g. BTC" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Holdings</label>
                  <input required type="number" step="any" value={amount} onChange={e => setAmount(e.target.value)} className="w-full rounded-xl bg-secondary py-2 px-3 text-foreground outline-none border border-border" placeholder="0.05" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Buying Price ($)</label>
                  <input required type="number" step="any" value={price} onChange={e => setPrice(e.target.value)} className="w-full rounded-xl bg-secondary py-2 px-3 text-foreground outline-none border border-border" placeholder="58200" />
                </div>
              </div>
            </>
          ) : type === 'sync' && confirmationConflicts !== null ? (
            <div className="flex flex-col gap-3">
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-xl text-sm mb-2">
                <strong className="block mb-1">Portfolio Conflict Detected</strong>
                The following assets are already in your portfolio: <strong>{confirmationConflicts.join(', ')}</strong>.
                <br /><br />
                How would you like to resolve this conflict?
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <button type="button" disabled={loading} onClick={() => handleResolution('add')} className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-secondary text-foreground border border-border hover:bg-secondary/80 transition-colors disabled:opacity-50 text-left">
                  <strong className="block">Add to Current Holdings</strong>
                  <span className="text-xs text-muted-foreground font-normal">Adds the fetched amount to your existing balance.</span>
                </button>
                <button type="button" disabled={loading} onClick={() => handleResolution('replace')} className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-secondary text-foreground border border-border hover:bg-secondary/80 transition-colors disabled:opacity-50 text-left">
                  <strong className="block">Replace Older Holdings</strong>
                  <span className="text-xs text-muted-foreground font-normal">Deletes the old holding and replaces it with the new one.</span>
                </button>
              </div>
            </div>
          ) : type === 'sync' && fetchedHoldings ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground mb-2">Select assets to sync to your portfolio:</p>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {fetchedHoldings.map((h, i) => (
                  <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedHoldingIndices.includes(i) ? 'border-primary/50 bg-primary/5' : 'border-border bg-secondary/50 hover:bg-secondary'}`}>
                    <input 
                      type="checkbox" 
                      checked={selectedHoldingIndices.includes(i)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedHoldingIndices([...selectedHoldingIndices, i]);
                        } else {
                          setSelectedHoldingIndices(selectedHoldingIndices.filter(idx => idx !== i));
                        }
                      }}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary"
                    />
                    <div className="flex-1 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-foreground">{h.assetName} <span className="text-xs text-muted-foreground ml-1">({h.symbol})</span></p>
                        <p className="text-xs text-muted-foreground mt-0.5">{h.amount} {h.symbol}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {selectedHoldingIndices.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Please select at least one asset to sync.</p>
              )}
            </div>
          ) : (
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Wallet Address (EVM)</label>
              <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full rounded-xl bg-secondary py-2 px-3 text-foreground outline-none border border-border" placeholder="0x..." />
              <p className="text-xs text-muted-foreground mt-2">Enter an Ethereum / EVM wallet address to auto-fetch your token balances.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => {
              if (confirmationConflicts !== null) {
                setConfirmationConflicts(null); // Back to checklist
              } else {
                onClose();
              }
            }} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {confirmationConflicts !== null ? 'Back' : 'Cancel'}
            </button>
            {confirmationConflicts === null && (
              <button type="submit" disabled={loading || (type === 'sync' && fetchedHoldings !== null && selectedHoldingIndices.length === 0)} className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                {loading ? 'Processing...' : (type === 'add' ? 'Add Position' : type === 'update' ? 'Update Position' : (type === 'sync' && !fetchedHoldings ? 'Fetch Holdings' : 'Sync Selected'))}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

