import React, { useState, useEffect, useContext } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';

const DoctorAppointments = () => {
  const { 
    dToken, 
    appointments, 
    getAppointments, 
    completeAppointment, 
    cancelAppointment,
    uploadPrescription,
    getPatientPrescriptions,
    patientPrescriptions,
    deletePrescription,
    doctorId // Get logged-in doctor's ID
  } = useContext(DoctorContext);
  
  const { calculateAge, slotDtaeFormat, currency } = useContext(AppContext);
  
  // State for modals
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (dToken) {
      getAppointments();
    }
  }, [dToken]);

  // Open patient info modal
  const openPatientInfo = async (appointment) => {
    setSelectedPatient(appointment.userData);
    setSelectedAppointment(appointment);
    setShowPatientModal(true);
    setActiveTab('info');
    
    // Load ALL prescriptions for this patient (from all doctors)
    await getPatientPrescriptions(appointment.userId);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 bytes';
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle prescription upload
  const handleUploadPrescription = async () => {
    if (!prescriptionFile) {
      toast.error('Please select a PDF file');
      return;
    }

    setUploading(true);
    await uploadPrescription(selectedAppointment._id, prescriptionFile, prescriptionNotes);
    
    setUploading(false);
    setShowPrescriptionModal(false);
    setPrescriptionFile(null);
    setPrescriptionNotes('');
  };

  return (
    <div className='w-full max-w-w6xl m-5'>
      <p className='mb-3 text-lg font-medium'>All Appointments</p>
      
      {/* Appointments Table */}
      <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[50vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_2fr_1fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Information</p>
          <p>Prescription</p>
          <p>Fees</p>
          <p>Action</p>
        </div>
        
        {appointments.reverse().map((item, index) => (
          <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_2fr_1fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
            <p className='max-sm:hidden'>{index+1}</p>
            
            {/* Patient Info */}
            <div className='flex items-center gap-3'>
              <img className='w-8 h-8 object-cover rounded-full' src={item.userData.image} alt="" />
              <p className='truncate max-w-[150px]'>{item.userData.name}</p>
            </div>
            
            {/* Payment Status */}
            <div>
              <p className={`text-xs inline px-2 py-1 rounded-full ${item.payment ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {item.payment ? "Online" : "Cash"}
              </p>
            </div>
            
            {/* Age */}
            <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
            
            {/* Date & Time */}
            <p>{slotDtaeFormat(item.slotDate)}, {item.slotTime}</p>
            
            {/* Information Button */}
            <div>
              <button 
                onClick={() => openPatientInfo(item)}
                className='text-blue-600 text-xs font-medium hover:underline'
              >
                See Information
              </button>
            </div>
            
            {/* Prescription Column */}
            <div>
              {item.isCompleted && !item.cancelled ? (
                <button 
                  onClick={() => {
                    setSelectedAppointment(item);
                    setShowPrescriptionModal(true);
                  }}
                  className='text-green-600 text-xs font-medium hover:underline'
                >
                  Upload Prescription
                </button>
              ) : item.cancelled ? (
                <span className='text-gray-400 text-xs'>Cancelled</span>
              ) : (
                <span className='text-gray-400 text-xs'>Complete first</span>
              )}
            </div>
            
            {/* Fees */}
            <p>{currency}{item.amount}</p>
            
            {/* Action */}
            {
              item.cancelled 
              ? <p className='text-red-500 text-xs font-medium'>Cancelled</p>
              : item.isCompleted 
                ? <p className='text-green-500 text-xs font-medium'>Completed</p>
                : <div className='flex gap-2'>
                    <button 
                      onClick={() => completeAppointment(item._id)}
                      className='px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200'
                    >
                      Complete
                    </button>
                    <button 
                      onClick={() => cancelAppointment(item._id)}
                      className='px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200'
                    >
                      Cancel
                    </button>
                  </div>
            }
          </div>
        ))}
      </div>

      {/* Patient Information Modal (with ALL prescriptions) */}
      {showPatientModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header with Tabs */}
            <div className="border-b">
              <div className="flex justify-between items-center p-6">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`px-4 py-2 font-medium rounded-lg ${activeTab === 'info' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Patient Information
                  </button>
                  <button
                    onClick={() => setActiveTab('prescriptions')}
                    className={`px-4 py-2 font-medium rounded-lg ${activeTab === 'prescriptions' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    All Prescriptions
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowPatientModal(false);
                    setSelectedPatient(null);
                    setSelectedAppointment(null);
                    setActiveTab('info');
                  }}
                  className="text-gray-400 hover:text-gray-500 text-2xl"
                >
                  &times;
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex-grow overflow-y-auto p-6">
              {activeTab === 'info' ? (
                // Patient Info Tab
                <div>
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

                    {/* Appointment History */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Appointment Details
                      </label>
                      <div className="bg-gray-50 p-3 rounded space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Appointment Date:</span>{' '}
                          {slotDtaeFormat(selectedAppointment?.slotDate)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Appointment Time:</span>{' '}
                          {selectedAppointment?.slotTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ALL Prescriptions Tab */
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        All Prescriptions for {selectedPatient.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Showing prescriptions from all doctors
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowPatientModal(false);
                          setShowPrescriptionModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        + Upload New
                      </button>
                      <button
                        onClick={() => setActiveTab('info')}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Back to Info
                      </button>
                    </div>
                  </div>
                  
                  {patientPrescriptions[selectedPatient._id]?.length > 0 ? (
                    <div className="space-y-6">
                      {patientPrescriptions[selectedPatient._id].map((doctorGroup, index) => (
                        <div key={index} className="border rounded-lg overflow-hidden">
                          {/* Doctor Header */}
                          <div className="bg-gray-50 p-4 border-b">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <img 
                                  src={doctorGroup.doctor.image} 
                                  alt={doctorGroup.doctor.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    Dr. {doctorGroup.doctor.name}
                                  </h4>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span>{doctorGroup.doctor.speciality}</span>
                                    <span>•</span>
                                    <span>{doctorGroup.doctor.degree}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                {doctorGroup.prescriptions.length} prescription(s)
                              </div>
                            </div>
                          </div>
                          
                          {/* Prescriptions List */}
                          <div className="p-4">
                            {doctorGroup.prescriptions.map((prescription) => (
                              <div key={prescription._id} className="mb-4 last:mb-0 p-4 border rounded-lg hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                  <div className="flex-grow">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h5 className="font-medium text-gray-900">{prescription.fileName}</h5>
                                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                        PDF
                                      </span>
                                      {doctorGroup.doctor._id === doctorId && (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                          Your Prescription
                                        </span>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm text-gray-600">
                                        <span className="font-medium">Uploaded:</span> {formatDate(prescription.uploadedAt)}
                                      </p>
                                      {prescription.notes && (
                                        <p className="text-sm text-gray-700">
                                          <span className="font-medium">Notes:</span> {prescription.notes}
                                        </p>
                                      )}
                                      <p className="text-sm text-gray-500">
                                        <span className="font-medium">Size:</span> {formatFileSize(prescription.fileSize)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 ml-4">
                                    <a
                                      href={prescription.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                                    >
                                      View PDF
                                    </a>
                                    {/* Only show delete button for prescriptions from this doctor */}
                                    {doctorGroup.doctor._id === doctorId && (
                                      <button
                                        onClick={() => {
                                          if (window.confirm('Are you sure you want to delete this prescription?')) {
                                            deletePrescription(prescription._id, selectedPatient._id);
                                          }
                                        }}
                                        className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-4 text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescriptions Found</h3>
                      <p className="text-gray-600 mb-6">
                        No prescriptions have been uploaded for this patient yet.
                      </p>
                      <button
                        onClick={() => {
                          setShowPatientModal(false);
                          setShowPrescriptionModal(true);
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Upload First Prescription
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Patient ID: {selectedPatient._id?.substring(0, 10)}...
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab(activeTab === 'info' ? 'prescriptions' : 'info')}
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                  >
                    {activeTab === 'info' ? 'View Prescriptions' : 'View Info'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPatientModal(false);
                      setSelectedPatient(null);
                      setSelectedAppointment(null);
                      setActiveTab('info');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Upload Modal */}
      {showPrescriptionModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Upload Prescription
              </h3>
              <button
                onClick={() => {
                  setShowPrescriptionModal(false);
                  setPrescriptionFile(null);
                  setPrescriptionNotes('');
                }}
                className="text-gray-400 hover:text-gray-500 text-2xl"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select PDF File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPrescriptionFile(e.target.files[0])}
                    className="hidden"
                    id="prescription-file"
                  />
                  <label htmlFor="prescription-file" className="cursor-pointer">
                    {prescriptionFile ? (
                      <div className="text-green-600">
                        <p className="font-medium">{prescriptionFile.name}</p>
                        <p className="text-sm">{(prescriptionFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <>
                        <div className="mx-auto w-12 h-12 mb-3">
                          <img src={assets.upload_icon} alt="Upload" className="w-full h-full" />
                        </div>
                        <p className="text-gray-600">Click to select PDF file</p>
                        <p className="text-xs text-gray-500 mt-1">Maximum size: 5MB</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  className="w-full p-3 border rounded-md"
                  rows="3"
                  placeholder="Add any notes about this prescription..."
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPrescriptionModal(false);
                    setPrescriptionFile(null);
                    setPrescriptionNotes('');
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadPrescription}
                  disabled={!prescriptionFile || uploading}
                  className={`px-4 py-2 rounded-md ${!prescriptionFile || uploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                >
                  {uploading ? 'Uploading...' : 'Upload Prescription'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;