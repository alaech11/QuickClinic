import React, { useState, useEffect, useContext } from 'react'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyProfile = () => {
  const {
    userData, setUserData, token, backendUrl, loadUserProfileData,
    getUserPrescriptions, userPrescriptions, loadingPrescriptions
  } = useContext(AppContext)
  
  const [isEdit, setIsEdit] = useState(false)
  const [image, setImage] = useState(false)
  const [newAllergy, setNewAllergy] = useState('')
  const [allergyError, setAllergyError] = useState('')
  const [showPrescriptions, setShowPrescriptions] = useState(false)

  // Load prescriptions when component mounts
  useEffect(() => {
    if (token && !isEdit) {
      getUserPrescriptions()
    }
  }, [token, isEdit])

  const updateUserProfileData = async () => {
    try {
      // Validation: If hasAllergies is true, must have at least one allergy
      if (userData.hasAllergies && (!userData.allergies || userData.allergies.length === 0)) {
        setAllergyError('Please add at least one allergy when allergies are checked')
        toast.error('Please add at least one allergy')
        return
      }

      const formData = new FormData()
      formData.append('name', userData.name)
      formData.append('phone', userData.phone)
      formData.append('address', JSON.stringify(userData.address))
      formData.append('gender', userData.gender)
      formData.append('dob', userData.dob)
      formData.append('hasAllergies', userData.hasAllergies.toString())
      formData.append('allergies', JSON.stringify(userData.allergies || []))

      image && formData.append('image', image)

      const { data } = await axios.post(backendUrl + '/api/user/update-profile', formData, { headers: { token } })

      if (data.success) {
        toast.success(data.message)
        await loadUserProfileData()
        setIsEdit(false)
        setImage(false)
        setNewAllergy('')
        setAllergyError('')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  // Function to add a new allergy
  const addAllergy = () => {
    if (newAllergy.trim()) {
      setUserData(prev => ({
        ...prev,
        allergies: [...(prev.allergies || []), newAllergy.trim()]
      }))
      setNewAllergy('')
      setAllergyError('')
    }
  }

  // Function to remove an allergy
  const removeAllergy = (index) => {
    setUserData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }))
    if (userData.hasAllergies && userData.allergies.length === 1) {
      setAllergyError('Please add at least one allergy when allergies are checked')
    }
  }

  // Handle checkbox change
  const handleAllergyCheckboxChange = (e) => {
    const isChecked = e.target.checked
    setUserData(prev => ({
      ...prev,
      hasAllergies: isChecked,
      allergies: !isChecked ? [] : prev.allergies
    }))

    if (isChecked && (!userData.allergies || userData.allergies.length === 0)) {
      setAllergyError('Please add at least one allergy when allergies are checked')
    } else {
      setAllergyError('')
    }
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 bytes'
    if (bytes < 1024) return bytes + ' bytes'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return userData && (
    <div className='max-w-6xl mx-auto p-4'>
      {/* Profile Image */}
      {
        isEdit
          ? <label htmlFor="image">
            <div className='inline-block relative cursor-pointer'>
              <img className='w-36 rounded opacity-75' src={image ? URL.createObjectURL(image) : userData.image} alt="" />
              {!image && <img className='w-10 absolute bottom-12 right-12' src={assets.upload_icon} alt="Upload" />}
            </div>
            <input onChange={(e) => setImage(e.target.files[0])} type="file" id='image' hidden />
          </label>
          : <img className='w-36 rounded' src={userData.image} alt="" />
      }

      {/* Name */}
      {
        isEdit
          ? <input className='bg-gray-100 text-3xl font-medium max-w-60 mt-4 p-2 rounded' type="text" value={userData.name} onChange={e => setUserData(prev => ({ ...prev, name: e.target.value }))} />
          : <p className='text-3xl font-medium text-neutral-800 mt-4'>{userData.name}</p>
      }

      <hr className='bg-zinc-400 h-[1px] border-none' />

      {/* Contact Information */}
      <div>
        <p className='text-neutral-500 underline mt-3'>CONTACT INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className='font-medium'>Email:</p>
          {
            isEdit
              ? <input className='bg-gray-100 max-w-52 p-2 rounded' type="text" value={userData.email} onChange={e => setUserData(prev => ({ ...prev, email: e.target.value }))} />
              : <p className='text-blue-500'>{userData.email}</p>
          }

          <p className='font-medium'>Phone:</p>
          {
            isEdit
              ? <input className='bg-gray-100 max-w-52 p-2 rounded' type="text" value={userData.phone} onChange={e => setUserData(prev => ({ ...prev, phone: e.target.value }))} />
              : <p className='text-blue-400'>{userData.phone}</p>
          }

          <p className='font-medium'>Address:</p>
          {
            isEdit
              ? <div>
                <input
                  className='bg-gray-100 max-w-52 p-2 rounded mb-2'
                  value={userData.address.line1}
                  onChange={(e) => setUserData(prev => ({
                    ...prev,
                    address: {
                      ...prev.address,
                      line1: e.target.value
                    }
                  }))}
                  type="text"
                />
                <br />
                <input
                  className='bg-gray-100 max-w-52 p-2 rounded'
                  value={userData.address.line2}
                  onChange={(e) => setUserData(prev => ({
                    ...prev,
                    address: {
                      ...prev.address,
                      line2: e.target.value
                    }
                  }))}
                  type="text"
                />
              </div>
              : <p className='text-gray-700'>
                {userData.address.line1}
                <br />
                {userData.address.line2}
              </p>
          }
        </div>
      </div>

      {/* Basic Information */}
      <div>
        <p className='text-neutral-500 underline mt-3'>BASIC INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className='font-medium'>Gender:</p>
          {
            isEdit
              ? <select className='max-w-20 bg-gray-100 p-1 rounded' onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))} value={userData.gender}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Not Selected">Not Selected</option>
              </select>
              : <p className='text-gray-700'>{userData.gender}</p>
          }

          <p className='font-medium'>Birthday:</p>
          {
            isEdit
              ? <input className='max-w-28 bg-gray-100 p-1 rounded' type="date" value={userData.dob === "Not Selected" ? "" : userData.dob} onChange={e => setUserData(prev => ({ ...prev, dob: e.target.value || "Not Selected" }))} />
              : <p className='text-gray-700'>{userData.dob}</p>
          }
        </div>
      </div>

      {/* Medical Information */}
      <div>
        <p className='text-neutral-500 underline mt-3'>MEDICAL INFORMATION</p>
        <div className='mt-3 text-neutral-700'>
          {/* Allergies Checkbox */}
          <div className='flex items-center gap-2 mb-4'>
            {
              isEdit
                ? (
                  <>
                    <input
                      type="checkbox"
                      id="hasAllergies"
                      checked={userData.hasAllergies || false}
                      onChange={handleAllergyCheckboxChange}
                      className='h-4 w-4'
                    />
                    <label htmlFor="hasAllergies" className='font-medium'>
                      Do you have any allergies? *
                    </label>
                  </>
                )
                : (
                  <>
                    <p className='font-medium'>Allergies:</p>
                    <p className='text-gray-700'>
                      {userData.hasAllergies ? 'Yes' : 'No'}
                    </p>
                  </>
                )
            }
          </div>

          {/* Show error message */}
          {isEdit && allergyError && (
            <div className='text-red-500 text-sm mb-2 ml-2'>
              {allergyError}
            </div>
          )}

          {/* Allergies List */}
          {isEdit && userData.hasAllergies && (
            <div className='ml-6 mb-4'>
              <div className='flex gap-2 mb-2'>
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => {
                    setNewAllergy(e.target.value)
                    if (allergyError) setAllergyError('')
                  }}
                  placeholder="Add an allergy (e.g., Penicillin, Peanuts) *"
                  className='bg-gray-100 p-2 rounded flex-grow'
                  onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                />
                <button
                  onClick={addAllergy}
                  className='bg-primary text-white px-3 py-2 rounded hover:bg-primary-dark transition-colors'
                >
                  Add
                </button>
              </div>

              {/* List of current allergies */}
              <div className='space-y-2'>
                {(userData.allergies || []).map((allergy, index) => (
                  <div key={index} className='flex items-center justify-between bg-gray-50 p-2 rounded'>
                    <span>{allergy}</span>
                    <button
                      onClick={() => removeAllergy(index)}
                      className='text-red-500 hover:text-red-700 text-sm'
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {(!userData.allergies || userData.allergies.length === 0) && (
                  <div className='flex items-center gap-2 p-2 text-gray-500 text-sm'>
                    <span className='text-yellow-500'>⚠</span>
                    <span className='italic'>No allergies added yet. You must add at least one allergy.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Display allergies when not in edit mode */}
          {!isEdit && userData.hasAllergies && userData.allergies && userData.allergies.length > 0 && (
            <div className='ml-6'>
              <p className='font-medium mb-2'>Allergy List:</p>
              <ul className='list-disc pl-5 space-y-1'>
                {userData.allergies.map((allergy, index) => (
                  <li key={index} className='text-gray-700'>{allergy}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Prescriptions Section */}
      <div className='mt-10'>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-2xl font-bold text-gray-900'>My Prescriptions</h2>
          <button
            onClick={() => setShowPrescriptions(!showPrescriptions)}
            className='text-blue-600 hover:text-blue-800'
          >
            {showPrescriptions ? 'Hide' : 'Show'} Prescriptions
          </button>
        </div>

        {showPrescriptions && (
          <div>
            {loadingPrescriptions ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading prescriptions...</p>
              </div>
            ) : userPrescriptions && userPrescriptions.length > 0 ? (
              <div className="space-y-6">
                {userPrescriptions.map((doctorGroup, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
                    {/* Doctor Header */}
                    <div className="bg-blue-50 p-4 border-b">
                      <div className="flex items-center gap-4">
                        <img
                          src={doctorGroup.doctor.image}
                          alt={doctorGroup.doctor.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white"
                        />
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            Dr. {doctorGroup.doctor.name}
                          </h3>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-1">
                            <span className="bg-white px-2 py-1 rounded">{doctorGroup.doctor.speciality}</span>
                            <span className="bg-white px-2 py-1 rounded">{doctorGroup.doctor.degree}</span>
                            <span className="bg-white px-2 py-1 rounded">
                              {doctorGroup.prescriptions.length} prescription(s)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Prescriptions List */}
                    <div className="p-4">
                      {doctorGroup.prescriptions.map((prescription, idx) => (
                        <div key={idx} className={`mb-4 last:mb-0 p-4 border rounded-lg hover:bg-gray-50 ${idx === 0 ? 'border-l-4 border-blue-500' : ''}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-grow">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-gray-900">{prescription.fileName}</h4>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {formatDate(prescription.uploadedAt)}
                                </span>
                              </div>
                              {prescription.notes && (
                                <div className="mb-3 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                                  <p className="text-sm text-gray-700">
                                    <strong>Doctor's Notes:</strong> {prescription.notes}
                                  </p>
                                </div>
                              )}
                              <div className="text-sm text-gray-500">
                                File size: {formatFileSize(prescription.fileSize)}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <a
                                href={prescription.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
                              >
                                View Prescription
                              </a>
                              <a
                                 href={prescription.downloadUrl}
                                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 text-center"
                              >
                                Download PDF
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="w-20 h-20 mx-auto mb-4 text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescriptions Yet</h3>
                <p className="text-gray-600">
                  You haven't received any prescriptions from doctors yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit/Save buttons */}
      <div className='mt-10'>
        {
          isEdit
            ? (
              <div className='flex gap-4'>
                <button
                  className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                  onClick={updateUserProfileData}
                  disabled={userData.hasAllergies && (!userData.allergies || userData.allergies.length === 0)}
                >
                  Save information
                </button>
                <button
                  className='border border-gray-300 px-8 py-2 rounded-full hover:bg-gray-100 transition-all'
                  onClick={() => {
                    setIsEdit(false)
                    setNewAllergy('')
                    setAllergyError('')
                    loadUserProfileData()
                  }}
                >
                  Cancel
                </button>
              </div>
            )
            : (
              <button
                className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all'
                onClick={() => setIsEdit(true)}
              >
                Edit
              </button>
            )
        }
      </div>
    </div>
  )
}

export default MyProfile