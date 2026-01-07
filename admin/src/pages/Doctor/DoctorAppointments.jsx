import React, { useState } from 'react'
import { useContext } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { useEffect } from 'react'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const DoctorAppointments = () => {
  const {dToken, appointments,getAppointments, completeAppointment} = useContext(DoctorContext)
  const  {calculateAge, slotDtaeFormat, currency} = useContext(AppContext)
  
  // State for modal
  const [showModal, setShowModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)

  useEffect(()=>{
    if (dToken) {
      getAppointments()
    }
  },[dToken])

  // Function to open modal with patient info
  const openPatientInfo = (appointment) => {
    setSelectedPatient(appointment.userData)
    setShowModal(true)
  }

  // Function to close modal
  const closeModal = () => {
    setShowModal(false)
    setSelectedPatient(null)
  }

  return (
    <div className='w-full max-w-w6xl m-5'>
      <p className='mb-3 text-lg font-medium'>All Appointments</p>
      <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[50vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_2fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Information</p>
          <p>Fees</p>
          <p>Action</p>
        </div>
        {
          appointments.reverse().map((item,index)=>(
            <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_2fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
              <p className='max-sm:hidden'>{index+1}</p>
              <div className='flex items-center gap-3'>
                <img className='w-8 rounded-full' src={item.userData.image} alt="" />
                <p>{item.userData.name}</p>
              </div>
              <div>
                <p className='text-xs inline border border-primary px-2 rounded-full'>{item.payment ? "Online" : "Cash"}</p>
              </div>
              <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
              <p>{slotDtaeFormat(item.slotDate)}, {item.slotTime}</p>
              <div>
                <button 
                  onClick={() => openPatientInfo(item)}
                  className='text-primary text-xs font-medium hover:underline'
                >
                  See Information
                </button>
              </div>
              <p>{currency}{item.amount}</p>
              {
                item.cancelled 
                ?<p className='text-red-400 text-xs font-medium'>Cancelled</p>
                : item.isCompleted 
                  ?<p className='text-green-500 text-xs font-medium'>Completed</p>
                  :<div className='flex'>
                     {/*<img onClick={()=>cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />*/}
                     <img onClick={()=>completeAppointment(item._id)} className='w-10 cursor-pointer' src={assets.tick_icon} alt="" />
                   </div>
              }
            </div>
          ))
        }
      </div>

      {/* Patient Information Modal */}
      {showModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Patient Information
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 text-2xl"
              >
                &times;
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              {/* Patient Photo and Name */}
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={selectedPatient.image} 
                  alt={selectedPatient.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {selectedPatient.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Patient ID: {selectedPatient._id?.substring(0, 8)}...
                  </p>
                </div>
              </div>

              {/* Patient Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Information
                  </label>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm">
                      <span className="font-medium">Phone:</span> {selectedPatient.phone}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Information
                  </label>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Gender</p>
                        <p className="text-sm font-medium">{selectedPatient.gender}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Age</p>
                        <p className="text-sm font-medium">{calculateAge(selectedPatient.dob)} years</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date of Birth</p>
                      <p className="text-sm font-medium">{selectedPatient.dob}</p>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical Information
                  </label>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="mb-2">
                      <p className="text-sm">
                        <span className="font-medium">Has Allergies:</span>{' '}
                        <span className={selectedPatient.hasAllergies ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                          {selectedPatient.hasAllergies ? 'Yes' : 'No'}
                        </span>
                      </p>
                    </div>
                    
                    {selectedPatient.hasAllergies && selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Allergy List:</p>
                        <ul className="space-y-1">
                          {selectedPatient.allergies.map((allergy, index) => (
                            <li key={index} className="text-sm bg-white px-2 py-1 rounded border">
                              {allergy}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appointment History (Optional - you can add more data if available) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appointment Details
                  </label>
                  <div className="bg-gray-50 p-3 rounded space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Appointment Date:</span>{' '}
                      {slotDtaeFormat(appointments.find(a => a.userId === selectedPatient._id)?.slotDate)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Appointment Time:</span>{' '}
                      {appointments.find(a => a.userId === selectedPatient._id)?.slotTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorAppointments