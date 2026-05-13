import { CreditCard, CheckCircle, Package, X, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

const BillingModal = ({ title, children, onConfirm, confirmText, confirmVariant = "primary", onClose, isProcessing }: any) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
  >
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-left"
    >
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X className="h-5 w-5 text-slate-400" />
        </button>
      </div>
      <div className="p-6">
        {children}
      </div>
      <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
        <button 
          disabled={isProcessing}
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button 
          disabled={isProcessing}
          onClick={onConfirm}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-sm ${
            confirmVariant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'
          } disabled:opacity-50`}
        >
          {isProcessing ? "Processing..." : confirmText}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

export default function Billing() {
  const [activeModal, setActiveModal] = useState<"upgrade" | "payment" | "cancel" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardData, setCardData] = useState({ number: "", expiry: "", cvc: "" });

  const handleAction = async (msg: string, isChange: boolean = false) => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    setActiveModal(null);
    setCardData({ number: "", expiry: "", cvc: "" }); // Reset on success
    
    if (isChange) {
      toast.success(msg, {
        description: "Brokerage administration has been notified of your plan update."
      });
      // Add to simulated system activity/notifications
      const savedLogs = localStorage.getItem('system_notifications') || '[]';
      const logs = JSON.parse(savedLogs);
      logs.unshift({
        id: Date.now(),
        type: 'BILLING_CHANGE',
        message: msg.includes('cancel') || msg.includes('downgraded') ? 'Agent plan downgrade initiated' : 'Agent plan upgrade initiated',
        actor: 'Sarah Jenkins',
        time: 'Just now'
      });
      localStorage.setItem('system_notifications', JSON.stringify(logs));
    } else {
      toast.success(msg);
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Plans</h1>
          <p className="text-slate-500 mt-1">Manage your subscription and usage.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-left">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Active Agent Plan</h2>
                <p className="text-slate-500 text-sm mt-1">Billed $149/month. Next charge on June 1, 2026.</p>
              </div>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Active</span>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle className="h-4 w-4 text-blue-600" /> Up to 5 active listings
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle className="h-4 w-4 text-blue-600" /> Unlimited AI conversations
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle className="h-4 w-4 text-blue-600" /> Full Brokerage Branding
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setActiveModal("upgrade")}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Upgrade Plan
              </button>
              <button 
                onClick={() => setActiveModal("cancel")}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-left">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Payment Method</h2>
            <div className="flex items-center justify-between border rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-100 rounded-md">
                  <CreditCard className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Visa ending in 4242</div>
                  <div className="text-sm text-slate-500">Expires 12/28</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setCardData({ number: "", expiry: "", cvc: "" });
                  setActiveModal("payment");
                }}
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                Update
              </button>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-1 border border-slate-200 rounded-xl bg-slate-50 p-6 text-left">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-slate-500" /> Usage Summary
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 font-medium">Active Listings</span>
                <span className="font-bold">2 / 5</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 font-medium">Talk Time (mins)</span>
                <span className="font-bold">142</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Unlimited on current plan</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeModal === "upgrade" && (
          <BillingModal 
            title="Upgrade Your Plan" 
            confirmText="Purchase New Tier" 
            onClose={() => setActiveModal(null)}
            isProcessing={isProcessing}
            onConfirm={() => handleAction("Success! Your plan has been upgraded to Team Pro.", true)}
          >
            <div className="space-y-4 text-left">
              <p className="text-sm text-slate-600 font-medium">Select a new performance tier for your brokerage expansion.</p>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-4 border-2 border-blue-600 bg-blue-50/30 rounded-xl cursor-pointer shadow-sm">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="plan" checked readOnly className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-bold text-slate-900">Team Pro</div>
                      <div className="text-xs text-slate-500">Up to 25 listings</div>
                    </div>
                  </div>
                  <div className="font-bold text-blue-600">$399/mo</div>
                </label>
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors opacity-60">
                   <div className="flex items-center gap-3">
                    <input type="radio" name="plan" disabled className="h-4 w-4" />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Enterprise</div>
                      <div className="text-xs text-slate-500">Unlimited listings</div>
                    </div>
                  </div>
                  <div className="font-bold text-slate-400">$999/mo</div>
                </label>
              </div>
            </div>
          </BillingModal>
        )}

        {activeModal === "payment" && (
          <BillingModal 
            title="Update Payment Method" 
            confirmText="Save Card" 
            onClose={() => setActiveModal(null)}
            isProcessing={isProcessing}
            onConfirm={() => {
              if (cardData.number.length !== 12) {
                toast.error("Credit card must be exactly 12 digits");
                return;
              }
              
              const expiryParts = cardData.expiry.split(' / ');
              if (expiryParts.length !== 2) {
                toast.error("Expiry must be in MM / YY format");
                return;
              }
              const month = parseInt(expiryParts[0]);
              const year = parseInt("20" + expiryParts[1]);
              const now = new Date();
              const currentYear = now.getFullYear();
              const currentMonth = now.getMonth() + 1;

              if (month < 1 || month > 12) {
                toast.error("Invalid month in expiry");
                return;
              }

              if (year < currentYear || (year === currentYear && month < currentMonth)) {
                toast.error("Card has expired or invalid year");
                return;
              }

              if (cardData.cvc.length !== 3) {
                toast.error("CVC must be exactly 3 digits");
                return;
              }
              handleAction("Payment method updated successfully.");
            }}>
            <div className="space-y-4 text-left">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 mb-4">
                <div className="h-4 w-4 bg-blue-600 rounded-full animate-pulse" />
                <p className="text-xs font-medium text-slate-600 italic">Interim Payment Provider (Simulation Only)</p>
              </div>
              <div className="space-y-3 font-sans">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Card Number (Exactly 12 Digits)</label>
                  <input 
                    type="text" 
                    placeholder="XXXX XXXX XXXX" 
                    maxLength={14}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none" 
                    value={cardData.number.replace(/(\d{4})(?=\d)/g, '$1 ')}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                      setCardData(prev => ({ ...prev, number: val }));
                    }}
                  />
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Requirement: 12 numeric digits.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Expiry (MM / YY)</label>
                    <input 
                      type="text" 
                      placeholder="MM / YY" 
                      maxLength={7}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:outline-none" 
                      value={cardData.expiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^\d]/g, '');
                        if (val.length >= 2) {
                          const month = parseInt(val.slice(0, 2));
                          if (month > 12) val = '12' + val.slice(2);
                          if (month === 0 && val.length === 2) val = '01';
                          val = val.slice(0, 2) + ' / ' + val.slice(2, 4);
                        }
                        setCardData(prev => ({ ...prev, expiry: val }));
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">CVC (3 Digits)</label>
                    <input 
                      type="text" 
                      placeholder="123" 
                      maxLength={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:outline-none" 
                      value={cardData.cvc}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                        setCardData(prev => ({ ...prev, cvc: val }));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </BillingModal>
        )}

        {activeModal === "cancel" && (
          <BillingModal 
            title="Cancel Subscription" 
            confirmText="Confirm Cancellation" 
            confirmVariant="danger" 
            onClose={() => setActiveModal(null)}
            isProcessing={isProcessing}
            onConfirm={() => handleAction("Your subscription has been cancelled. You have access until June 1.", true)}
          >
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 flex items-center justify-center rounded-full text-red-600 mb-2">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <p className="text-sm text-slate-600">
                Are you sure? You will lose access to premium features including **Vertex AI Voice** and **Custom Branding** at the end of this billing cycle.
              </p>
              <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-[11px] text-red-800 font-medium">
                Data preservation: Your existing listings will remain as drafts, but you won't be able to activate new ones.
              </div>
            </div>
          </BillingModal>
        )}
      </AnimatePresence>
    </div>
  );
}
