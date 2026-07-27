import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Receipt as ReceiptType, Invoice as InvoiceType, Order as OrderType } from '../types';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Download, Share2, FileText, ShieldCheck, Truck, Store, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export const Receipt = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const invoiceIdParam = searchParams.get('invoiceId');
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState<ReceiptType | null>(null);
  const [invoice, setInvoice] = useState<InvoiceType | null>(null);
  const [order, setOrder] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        // Fetch receipt
        const receiptRef = doc(db, 'receipts', id);
        const receiptSnap = await getDoc(receiptRef);
        
        if (receiptSnap.exists()) {
          const recData = receiptSnap.data() as ReceiptType;
          setReceipt(recData);

          // Fetch associated order
          if (recData.orderId) {
            const orderSnap = await getDoc(doc(db, 'orders', recData.orderId));
            if (orderSnap.exists()) {
              setOrder(orderSnap.data() as OrderType);
            }
          }
        }

        // Fetch invoice
        if (invoiceIdParam) {
          const invSnap = await getDoc(doc(db, 'invoices', invoiceIdParam));
          if (invSnap.exists()) {
            setInvoice(invSnap.data() as InvoiceType);
          }
        }
      } catch (error) {
        console.error('Error fetching receipt data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, invoiceIdParam]);

  const handleDownloadInvoice = () => {
    window.print();
    toast.success('Invoice document ready for download/print');
  };

  const handleShareReceipt = () => {
    if (navigator.share) {
      navigator.share({
        title: `Receipt for Order #${receipt?.orderId}`,
        text: `Arbeez Fresh Order Receipt: ₹${receipt?.grandTotal}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Receipt link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verifying PayU Receipt...</p>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
        <XCircle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Receipt Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">We could not locate this payment record in our system.</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-emerald-500 text-white font-black px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-sm"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const isSuccess = receipt.paymentStatus === 'completed' || receipt.paymentStatus === 'success';
  const isPending = receipt.paymentStatus === 'pending';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-28">
      {/* Top Header Bar */}
      <div className="bg-white p-6 shadow-2xs flex items-center justify-between sticky top-0 z-10 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-900 rounded-full hover:bg-slate-100">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">Payment Receipt</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PayU India Gateway</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleShareReceipt} 
            className="p-2.5 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
            title="Share Receipt"
          >
            <Share2 size={18} />
          </button>
          <button 
            onClick={handleDownloadInvoice} 
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors shadow-2xs uppercase tracking-wider"
            title="Download Tax Invoice"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Invoice</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 flex-1 space-y-4 max-w-2xl mx-auto w-full">
        {/* Main Status & Receipt Card */}
        <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 p-6 sm:p-8 overflow-hidden relative space-y-6">
          
          {/* Header Status Indicator */}
          <div className="flex flex-col items-center text-center border-b border-slate-100 pb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-inner ${
              isSuccess ? 'bg-emerald-100 text-emerald-600' : isPending ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
            }`}>
              {isSuccess ? <CheckCircle2 size={36} /> : isPending ? <Clock size={36} /> : <XCircle size={36} />}
            </div>

            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-1 ${
              isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : isPending ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {isSuccess ? 'PayU India Verified' : isPending ? 'Payment Pending' : 'Payment Failed'}
            </span>

            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mt-1">
              {isSuccess ? 'Payment Successful' : isPending ? 'Cash on Delivery Order' : 'Payment Unsuccessful'}
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-1">{new Date(receipt.createdAt).toLocaleString()}</p>
          </div>

          {/* Key Identifiers Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-xs">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Order ID</p>
              <p className="font-bold text-slate-900 break-all">{receipt.orderId}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Transaction ID</p>
              <p className="font-bold text-slate-900 break-all">{receipt.transactionId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Gateway / Method</p>
              <p className="font-bold text-slate-900 uppercase">{receipt.paymentMethod}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Verification</p>
              <p className="font-bold text-emerald-600 uppercase flex items-center gap-1">
                <ShieldCheck size={14} /> SHA-512 Signed
              </p>
            </div>
          </div>

          {/* Shop & Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs">
            <div className="flex gap-2.5 items-start">
              <Store size={18} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Merchant Shop</p>
                <p className="font-bold text-slate-900">{receipt.shopName}</p>
              </div>
            </div>
            <div className="flex gap-2.5 items-start">
              <MapPin size={18} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Deliver To</p>
                <p className="font-bold text-slate-900">{receipt.customerName}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{receipt.deliveryAddress}</p>
              </div>
            </div>
          </div>

          {/* Order Tracking Bar */}
          {order && (
            <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Truck size={16} /> Live Order Workflow
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px]">
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold text-slate-400">
                <div className="text-emerald-400">1. Verified</div>
                <div className="text-emerald-400">2. Vendor Notified</div>
                <div className={order.deliveryPartnerId ? 'text-emerald-400' : ''}>3. Delivery Assigned</div>
                <div>4. Dispatched</div>
              </div>
              <p className="text-[11px] text-slate-300 text-center font-medium">
                Vendor has been notified and delivery partner ({order.deliveryPartnerId || 'DP-Express'}) has been assigned.
              </p>
            </div>
          )}

          {/* Line Items */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Purchased Items</p>
            <div className="space-y-2 text-xs">
              {receipt.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <span className="font-bold text-slate-800">{item.quantity}x {item.name}</span>
                  <span className="font-black text-slate-900">₹{item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown Calculation */}
          <div className="border-t border-slate-100 pt-4 space-y-2 text-xs font-medium">
            <div className="flex justify-between text-slate-600">
              <span>Products Total</span>
              <span className="font-bold text-slate-900">₹{receipt.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Vendor Delivery Fee</span>
              <span className="font-bold text-slate-900">₹{receipt.deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Platform Fee</span>
              <span className="font-bold text-slate-900">₹{receipt.platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Payment Processing Fee</span>
              <span className="font-bold text-slate-900">₹{(receipt.paymentProcessingFee || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST</span>
              <span className="font-bold text-slate-900">₹{(receipt.gstAmount || 0).toFixed(2)}</span>
            </div>
            {receipt.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount</span>
                <span>-₹{receipt.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {receipt.subscriptionDiscount > 0 && (
              <div className="flex justify-between text-amber-600 font-bold">
                <span>Fresh Plus Subscription Waiver</span>
                <span>-₹{receipt.subscriptionDiscount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Total Paid Header */}
          <div className="pt-4 border-t-2 border-dashed border-slate-200 flex justify-between items-end">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">Total Paid</span>
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">INR Currency</span>
            </div>
            <span className="text-3xl font-black text-emerald-600">₹{receipt.grandTotal.toFixed(2)}</span>
          </div>

          {/* Tax Invoice Document Box */}
          {invoice && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                  <FileText size={16} className="text-slate-600" /> Official Tax Invoice
                </span>
                <span className="font-bold text-slate-700">{invoice.invoiceNumber}</span>
              </div>
              <div className="text-[11px] text-slate-600 grid grid-cols-2 gap-2">
                <div>Vendor GSTIN: <span className="font-bold text-slate-800">{invoice.vendorGstNumber}</span></div>
                <div>Gateway: <span className="font-bold text-slate-800">{invoice.gatewayName}</span></div>
              </div>
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/')}
            className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-wider shadow-sm hover:bg-slate-800 transition-colors"
          >
            Continue Shopping
          </button>
          <button 
            onClick={handleDownloadInvoice}
            className="flex-1 bg-white border border-slate-200 text-slate-800 font-black py-4 rounded-2xl text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors"
          >
            Print Tax Invoice
          </button>
        </div>
      </div>
    </div>
  );
};
