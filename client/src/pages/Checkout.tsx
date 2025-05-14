import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, User, Calendar, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import { useAuth } from '../contexts/AuthContext';

const Checkout: React.FC = () => {
  const { bookingDetails, proceedToPayment, loading } = useBooking();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showPassengers, setShowPassengers] = useState(true);
  const [error, setError] = useState<string>('');

  if (!bookingDetails || bookingDetails.passengers.length === 0) {
    navigate('/confirmation');
    return null;
  }

  const formatTime = (time24: string = "00:00") => {
    if (!time24) return "00:00";
    const [hour, minute] = time24.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setError('');
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setError('Failed to load payment gateway. Please try again.');
      return;
    }

    try {
      // Create order
      const response = await fetch('https://red-bus-fm3g.onrender.com/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount: bookingDetails.totalAmount,
          bookingDetails,
        }),
      });

      const { orderId, keyId } = await response.json();
      if (!orderId) {
        setError('Failed to create order. Please try again.');
        return;
      }

      // Initialize Razorpay
      const options = {
        key: keyId,
        amount: bookingDetails.totalAmount * 100,
        currency: 'INR',
        name: 'Bus Booking',
        description: 'Bus Ticket Payment',
        order_id: orderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('https://red-bus-fm3g.onrender.com/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();
            if (verifyData.status === 'success') {
              await proceedToPayment();
              navigate('/confirmation');
            } else {
              setError('Payment verification failed. Please try again.');
            }
          } catch (err) {
            setError('Payment verification failed. Please try again.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#2563eb',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      setError('An error occurred during payment. Please try again.');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Information</h2>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{bookingDetails.busName}</h3>
                  <p className="text-sm text-gray-500 mb-2">{bookingDetails.busType}</p>
                  <div className="flex items-center space-x-6 mt-2">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm">{formatDate(bookingDetails.journeyDate)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 flex flex-col items-end">
                  <div className="flex items-center space-x-6">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium">{formatTime(bookingDetails.departureTime)}</span>
                      <span className="text-xs text-gray-500">{bookingDetails.source}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{formatTime(bookingDetails.arrivalTime)}</span>
                      <span className="text-xs text-gray-500">{bookingDetails.destination}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div
                className="flex items-center justify-between mb-4 cursor-pointer"
                onClick={() => setShowPassengers(!showPassengers)}
              >
                <h2 className="text-lg font-semibold text-gray-900">Passenger Details</h2>
                {showPassengers ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
              {showPassengers && (
                <div className="space-y-4">
                  {bookingDetails.passengers.map((passenger, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-md">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-500 mr-2" />
                            <h3 className="font-medium text-gray-900">{passenger.name}</h3>
                          </div>
                          <div className="mt-1 ml-6 text-sm text-gray-500">
                            {passenger.age} years • {passenger.gender.charAt(0).toUpperCase() + passenger.gender.slice(1)}
                          </div>
                        </div>
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          Seat {passenger.seatNumber}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-sm text-gray-600 mb-4">
                Your booking details will be sent to this contact information.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    className="input"
                    placeholder="John Doe"
                    defaultValue={user?.name || ''}
                  />
                </div>
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    className="input"
                    placeholder="john@example.com"
                    defaultValue={user?.email || ''}
                  />
                </div>
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    className="input"
                    placeholder="+91 9876543210"
                    defaultValue={user?.phone || ''}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Booking Summary</h2>
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Journey Date</span>
                    <span className="font-medium">{formatDate(bookingDetails.journeyDate)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-500">From - To</span>
                    <span className="font-medium">{bookingDetails.source} - {bookingDetails.destination}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-500">Bus</span>
                    <span className="font-medium">{bookingDetails.busName}</span>
                  </div>
                </div>
                <div className="pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Selected Seats</span>
                    <span className="font-medium">{bookingDetails.selectedSeats.length}</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm text-gray-500 mb-1">Seat Numbers</div>
                    <div className="flex flex-wrap gap-1">
                      {bookingDetails.selectedSeats.map((seatId, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          {seatId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-500">Base Fare (₹{bookingDetails.fare} × {bookingDetails.selectedSeats.length})</span>
                    <span>₹{bookingDetails.fare * bookingDetails.selectedSeats.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-500">Tax</span>
                    <span>₹0</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-500">Booking Fee</span>
                    <span>₹0</span>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-xl font-bold text-[var(--primary)]">
                      ₹{bookingDetails.totalAmount}
                    </span>
                  </div>
                  {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="btn btn-primary w-full mt-6"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Pay Now
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-6 text-xs text-gray-500">
                  <p>By proceeding, you agree to our <a href="#" className="text-[var(--primary)]">Terms of Service</a> and <a href="#" className="text-[var(--primary)]">Privacy Policy</a>.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
