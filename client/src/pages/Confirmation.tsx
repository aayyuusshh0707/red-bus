// import  { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useBooking } from '../contexts/BookingContext';

// const Confirmation = () => {
//   const { bookingDetails } = useBooking();
//   const navigate = useNavigate();

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       navigate('/');
//     }, 5000); // 5 seconds

//     return () => clearTimeout(timer); // Cleanup on unmount
//   }, [navigate]);

//   return (
//     <div className="container  h-[70vh] flex flex-col items-center justify-center bg-green-300">
//       <h1 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h1>
//       <p className="mt-4">
//         Thank you for your booking from {bookingDetails?.source} to {bookingDetails?.destination}.
//       </p>
//     </div>
//   );
// };

// export default Confirmation;


// Confirmation.tsx
import React from 'react';
import { useBooking } from '../contexts/BookingContext';
import { useNavigate } from 'react-router-dom';

const Confirmation: React.FC = () => {
  const { bookingDetails, resetBooking } = useBooking();
  const navigate = useNavigate();

  if (!bookingDetails) {
    return <div className="text-center py-10">No booking details found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Booking Confirmed!</h1>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Booking Details</h2>
        <p><strong>Bus:</strong> {bookingDetails.busName}</p>
        <p><strong>From:</strong> {bookingDetails.source}</p>
        <p><strong>To:</strong> {bookingDetails.destination}</p>
        <p><strong>Journey Date:</strong> {new Date(bookingDetails.journeyDate).toLocaleDateString()}</p>
        <p><strong>Seats:</strong> {bookingDetails.selectedSeats.join(', ')}</p>
        <p><strong>Total Amount:</strong> ₹{bookingDetails.totalAmount}</p>
        <div className="mt-4">
          <h3 className="font-medium">Passengers:</h3>
          <ul className="list-disc pl-5">
            {bookingDetails.passengers.map((p, index) => (
              <li key={index}>
                {p.name} ({p.age} years, {p.gender}, Seat: {p.seatNumber})
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => {
            resetBooking();
            navigate('/');
          }}
          className="btn btn-primary mt-6"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default Confirmation;