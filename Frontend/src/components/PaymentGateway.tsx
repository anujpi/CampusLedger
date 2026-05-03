import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, Check } from "lucide-react";

interface PaymentGatewayProps {
  amount: number;
  title: string;
  userName: string;
  userEmail: string;
  onSuccess: () => Promise<void>;
  onClose: () => void;
  recipientName?: string;
}

export function PaymentGateway({ amount, title, userName, userEmail, onSuccess, onClose, recipientName }: PaymentGatewayProps) {
  const [paymentStep, setPaymentStep] = useState<"card" | "processing" | "success">("card");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "netbanking">("card");

  const processPayment = async () => {
    setPaymentStep("processing");
    await new Promise(r => setTimeout(r, 2000));
    setPaymentStep("success");
    await new Promise(r => setTimeout(r, 1500));
    
    try {
      await onSuccess();
    } catch (e) {
      setPaymentStep("card");
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-[#f6f9fc] overflow-y-auto flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row border border-slate-200 min-h-[500px]">
        {/* Left side summary */}
        <div className="bg-slate-50 w-full md:w-1/3 p-8 border-r border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-12">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">C</div>
              <span className="font-bold text-slate-800 tracking-tight">CampusPay</span>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-2">Subscribe to</p>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{title}</h3>
            {recipientName && (
              <p className="text-indigo-600 text-xs font-extrabold uppercase tracking-widest mb-6">
                Paying to: {recipientName}
              </p>
            )}
            {!recipientName && <div className="mb-6" />}
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900">₹{amount}</span>
              <span className="text-slate-500 font-medium">INR</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-12 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Secure 256-bit encryption
          </p>
        </div>
        
        {/* Right side form */}
        <div className="p-8 w-full md:w-2/3 flex flex-col justify-center relative">
          <button disabled={paymentStep !== "card"} onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>

          <AnimatePresence mode="wait">
            {paymentStep === "card" && (
              <motion.div key="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md mx-auto w-full">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Payment Details</h2>
                
                {/* Method Selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                  {(["card", "upi", "netbanking"] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex-1 text-xs font-bold py-2 px-3 rounded-lg capitalize transition-all ${paymentMethod === method ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      {method === "netbanking" ? "Net Banking" : method}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {paymentMethod === "card" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
                        <input type="email" value={userEmail} readOnly className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Card Information</label>
                        <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                          <input type="text" placeholder="4242 4242 4242 4242" className="w-full px-4 py-3 bg-white border-b border-slate-300 text-sm font-medium text-slate-800 focus:outline-none" />
                          <div className="flex">
                            <input type="text" placeholder="MM/YY" className="w-1/2 px-4 py-3 bg-white border-r border-slate-300 text-sm font-medium text-slate-800 focus:outline-none" />
                            <input type="text" placeholder="CVC" className="w-1/2 px-4 py-3 bg-white text-sm font-medium text-slate-800 focus:outline-none" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Name on card</label>
                        <input type="text" value={userName} readOnly className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                      </div>
                    </motion.div>
                  )}

                  {paymentMethod === "upi" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center mb-4">
                        <div className="w-32 h-32 bg-white border-2 border-dashed border-slate-300 mx-auto rounded-lg flex items-center justify-center mb-3">
                          <span className="text-xs font-bold text-slate-400">Mock QR Code</span>
                        </div>
                        <p className="text-xs font-medium text-slate-500">Scan with any UPI App</p>
                      </div>
                      <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                        <span className="relative bg-white px-2 text-xs font-bold text-slate-400 uppercase">Or enter UPI ID</span>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Virtual Payment Address (VPA)</label>
                        <input type="text" placeholder="e.g. username@okhdfcbank" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                      </div>
                    </motion.div>
                  )}

                  {paymentMethod === "netbanking" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Select your Bank</label>
                        <select className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none cursor-pointer">
                          <option>HDFC Bank</option>
                          <option>ICICI Bank</option>
                          <option>State Bank of India (SBI)</option>
                          <option>Axis Bank</option>
                          <option>Kotak Mahindra Bank</option>
                        </select>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm font-medium text-indigo-800 flex items-start gap-2">
                        <Shield className="w-5 h-5 shrink-0 mt-0.5 text-indigo-600" />
                        You will be redirected to your bank's secure portal to complete the payment.
                      </div>
                    </motion.div>
                  )}
                </div>
                
                <button onClick={processPayment} className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]">
                  Pay ₹{amount}
                </button>
              </motion.div>
            )}

            {paymentStep === "processing" && (
              <motion.div key="processing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Processing Payment</h3>
                <p className="text-sm font-medium text-slate-500">Contacting your bank securely...</p>
              </motion.div>
            )}

            {paymentStep === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                  <Check className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful</h3>
                <p className="text-sm font-medium text-slate-500">Redirecting you back...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
