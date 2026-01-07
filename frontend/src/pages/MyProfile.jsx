import React, { useState } from 'react'
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import {assets} from '../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyProfile = () => {
  const {userData,setUserData, token, backendUrl, loadUserProfileData} = useContext(AppContext)
  const [isEdit,setIsEdit] = useState(false)
  const [image,setImage] = useState(false)
  const [newAllergy, setNewAllergy] = useState('')
  const [allergyError, setAllergyError] = useState('')

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

      const {data} = await axios.post(backendUrl + '/api/user/update-profile', formData, {headers: {token}})

      if (data.success) {
        toast.success(data.message)
        await loadUserProfileData()
        setIsEdit(false)
        setImage(false)
        setNewAllergy('')
        setAllergyError('') // Clear any error messages
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error);
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
      setAllergyError('') // Clear error when allergy is added
    }
  }

  // Function to remove an allergy
  const removeAllergy = (index) => {
    setUserData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }))
    // Check if we need to show error after removal
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
      // Clear allergies when unchecked
      allergies: !isChecked ? [] : prev.allergies
    }))
    
    // Show error if checked with no allergies
    if (isChecked && (!userData.allergies || userData.allergies.length === 0)) {
      setAllergyError('Please add at least one allergy when allergies are checked')
    } else {
      setAllergyError('')
    }
  }

  return userData && (
    <div className='max-w-lg flex flex-col gap-4 text-sm p-4'>
      {/* Profile Image */}
      {
        isEdit
        ? <label htmlFor="image">
            <div className='inline-block relative cursor-pointer'>
              <img className='w-36 rounded opacity-75' src={image ? URL.createObjectURL(image) : userData.image} alt="" />
              {!image && <img className='w-10 absolute bottom-12 right-12' src={assets.upload_icon} alt="Upload" />}
            </div>
            <input onChange={(e)=>setImage(e.target.files[0])} type="file" id='image' hidden/>
          </label>
        : <img className='w-36 rounded' src={userData.image} alt="" />
      }
      
      {/* Name */}
      {
        isEdit
        ? <input className='bg-gray-100 text-3xl font-medium max-w-60 mt-4 p-2 rounded' type="text" value={userData.name} onChange={e => setUserData(prev => ({...prev,name:e.target.value}))} />
        : <p className='text-3xl font-medium text-neutral-800 mt-4'>{userData.name}</p>
      }

      <hr className='bg-zinc-400 h-[1px] border-none'/>
      
      {/* Contact Information */}
      <div>
        <p className='text-neutral-500 underline mt-3'>CONTACT INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className='font-medium'>Email:</p>
          {
            isEdit
            ? <input className='bg-gray-100 max-w-52 p-2 rounded' type="text" value={userData.email} onChange={e => setUserData(prev => ({...prev,email:e.target.value}))} />
            : <p className='text-blue-500'>{userData.email}</p>
          }
          
          <p className='font-medium'>Phone:</p>
          {
            isEdit
            ? <input className='bg-gray-100 max-w-52 p-2 rounded' type="text" value={userData.phone} onChange={e => setUserData(prev => ({...prev,phone:e.target.value}))} />
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
            ? <select className='max-w-20 bg-gray-100 p-1 rounded' onChange={(e) => setUserData(prev => ({...prev, gender: e.target.value}))} value={userData.gender}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Not Selected">Not Selected</option>
              </select>
            : <p className='text-gray-700'>{userData.gender}</p>
          }
          
          <p className='font-medium'>Birthday:</p>
          {
            isEdit
            ? <input className='max-w-28 bg-gray-100 p-1 rounded' type="date" value={userData.dob === "Not Selected" ? "" : userData.dob} onChange={e => setUserData(prev => ({...prev,dob:e.target.value || "Not Selected"}))} />
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
                    // Clear error when user starts typing
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