import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const PatientsList = () => {
  const { patients, aToken, getAllPatients, confirmDeletePatient } = useContext(AdminContext)
  const { calculateAge } = useContext(AppContext)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState({}) // Track loading state for each delete button

  useEffect(() => {
    if (aToken) {
      setLoading(true)
      getAllPatients()
      setLoading(false)
    }
  }, [aToken])

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  )

  // Open patient details modal
  const openPatientDetails = (patient) => {
    setSelectedPatient(patient)
    setShowModal(true)
  }

  // Close modal
  const closeModal = () => {
    setShowModal(false)
    setSelectedPatient(null)
  }

  // Handle delete patient
  const handleDeletePatient = async (patientId, patientName) => {
    setDeleteLoading(prev => ({...prev, [patientId]: true}))
    const result = await confirmDeletePatient(patientId, patientName)
    setDeleteLoading(prev => ({...prev, [patientId]: false}))
  }

  if (loading) {
    return <div className="m-5">Loading patients...</div>
  }

  return (
    <div className='m-5'>
      <div className='flex justify-between items-center mb-5'>
        <h1 className='text-2xl font-bold text-gray-800'>Patients List</h1>
        <div className='flex gap-3'>
          <div className='relative'>
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
            <svg 
              className="absolute left-3 top-3 h-5 w-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded">
            Total: {patients.length} patients
          </div>
        </div>
      </div>

      <div className='bg-white rounded-lg shadow overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Patient
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Contact
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Age/Gender
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Medical Info
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr key={patient._id} className='hover:bg-gray-50 transition-colors'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div className='flex-shrink-0 h-10 w-10'>
                          <img 
                            className='h-10 w-10 rounded-full object-cover border border-gray-200' 
                            src={patient.image} 
                            alt={patient.name}
                          />
                        </div>
                        <div className='ml-4'>
                          <div className='text-sm font-medium text-gray-900'>
                            {patient.name}
                          </div>
                          <div className='text-xs text-gray-500'>
                            ID: {patient._id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-sm text-gray-900 truncate max-w-xs'>{patient.email}</div>
                      <div className='text-sm text-gray-500'>{patient.phone}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {patient.dob !== "Not Selected" ? `${calculateAge(patient.dob)} years` : 'N/A'}
                      </div>
                      <div className='text-sm text-gray-500'>{patient.gender}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex flex-col gap-1'>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${patient.hasAllergies ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {patient.hasAllergies ? 'Has Allergies' : 'No Allergies'}
                        </span>
                        {patient.hasAllergies && patient.allergies && patient.allergies.length > 0 && (
                          <span className='text-xs text-gray-500'>
                            {patient.allergies.length} allergy{patient.allergies.length > 1 ? 'ies' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <div className='flex items-center gap-3'>
                        <button
                          onClick={() => openPatientDetails(patient)}
                          className='text-blue-600 hover:text-blue-900 px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors'
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeletePatient(patient._id, patient.name)}
                          disabled={deleteLoading[patient._id]}
                          className='text-red-600 hover:text-red-900 px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          {deleteLoading[patient._id] ? (
                            <span className='flex items-center gap-1'>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Deleting...
                            </span>
                          ) : (
                            'Delete'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? `No patients found matching "${searchTerm}"` : 'No patients found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Details Modal */}
      {showModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Patient Details
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDeletePatient(selectedPatient._id, selectedPatient.name)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors"
                >
                  Delete Patient
                </button>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500 text-2xl"
                >
                  &times;
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Patient Header */}
              <div className="flex items-center gap-6 mb-8">
                <img 
                  src={selectedPatient.image} 
                  alt={selectedPatient.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                />
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">
                    {selectedPatient.name}
                  </h4>
                  <p className="text-gray-500">
                    Patient ID: {selectedPatient._id}
                  </p>
                </div>
              </div>

              {/* Patient Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-blue-800 mb-3">Contact Information</h5>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Email:</span>
                      <p className="font-medium break-words">{selectedPatient.email}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Phone:</span>
                      <p className="font-medium">{selectedPatient.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-green-800 mb-3">Personal Information</h5>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Gender:</span>
                      <p className="font-medium">{selectedPatient.gender}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Date of Birth:</span>
                      <p className="font-medium">{selectedPatient.dob}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Age:</span>
                      <p className="font-medium">
                        {selectedPatient.dob !== "Not Selected" ? `${calculateAge(selectedPatient.dob)} years` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="bg-red-50 p-4 rounded-lg md:col-span-2">
                  <h5 className="font-semibold text-red-800 mb-3">Medical Information</h5>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Has Allergies:</span>
                      <p className={`font-medium ${selectedPatient.hasAllergies ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedPatient.hasAllergies ? 'Yes' : 'No'}
                      </p>
                    </div>
                    
                    {selectedPatient.hasAllergies && selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Allergy List:</span>
                        <div className="mt-2 space-y-1">
                          {selectedPatient.allergies.map((allergy, index) => (
                            <div key={index} className="bg-white px-3 py-2 rounded border border-red-100 flex justify-between items-center">
                              <p className="text-sm">{allergy}</p>
                              <span className="text-xs text-red-500">Allergy</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-purple-50 p-4 rounded-lg md:col-span-2">
                  <h5 className="font-semibold text-purple-800 mb-3">Address</h5>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Address Line 1:</span>
                      <p className="font-medium">{selectedPatient.address?.line1 || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Address Line 2:</span>
                      <p className="font-medium">{selectedPatient.address?.line2 || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Date */}
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Account created: {new Date(selectedPatient.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between p-6 border-t">
              <button
                onClick={() => handleDeletePatient(selectedPatient._id, selectedPatient.name)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Patient
              </button>
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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

export default PatientsList