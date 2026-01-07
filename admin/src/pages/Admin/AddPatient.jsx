import React, { useContext, useState } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const AddPatient = () => {
  const [patientImg, setPatientImg] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('Not Selected')
  const [dob, setDob] = useState('')
  const [hasAllergies, setHasAllergies] = useState(false)
  const [allergies, setAllergies] = useState([])
  const [newAllergy, setNewAllergy] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')

  const { backendUrl, aToken, addPatient } = useContext(AdminContext)

  // Function to add a new allergy
  const addAllergy = () => {
    if (newAllergy.trim()) {
      setAllergies([...allergies, newAllergy.trim()])
      setNewAllergy('')
    }
  }

  // Function to remove an allergy
  const removeAllergy = (index) => {
    setAllergies(allergies.filter((_, i) => i !== index))
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    try {
      if (!name || !email || !password || !phone) {
        return toast.error('Please fill all required fields')
      }

      const formData = new FormData()
      formData.append('name', name)
      formData.append('email', email)
      formData.append('password', password)
      formData.append('phone', phone)
      formData.append('gender', gender)
      formData.append('dob', dob || "Not Selected")
      formData.append('hasAllergies', hasAllergies.toString())
      formData.append('allergies', JSON.stringify(allergies))
      formData.append('address', JSON.stringify({ line1: address1, line2: address2 }))
      
      if (patientImg) {
        formData.append('image', patientImg)
      }

      const result = await addPatient(formData)
      
      if (result.success) {
        // Reset form
        setPatientImg(false)
        setName('')
        setEmail('')
        setPassword('')
        setPhone('')
        setGender('Not Selected')
        setDob('')
        setHasAllergies(false)
        setAllergies([])
        setNewAllergy('')
        setAddress1('')
        setAddress2('')
      }
      
    } catch (error) {
      toast.error(error.message)
      console.log(error)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='m-5 w-full'>
      <p className='mb-3 text-lg font-medium'>Add Patient</p>
      <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-auto'>
        {/* Profile Image */}
        <div className='flex items-center gap-4 mb-8 text-gray-500'>
          <label htmlFor="patient-img" className="cursor-pointer">
            <img 
              className='w-16 bg-gray-100 rounded-full cursor-pointer border border-gray-300' 
              src={patientImg ? URL.createObjectURL(patientImg) : assets.upload_area} 
              alt="Patient" 
            />
          </label>
          <input onChange={(e) => setPatientImg(e.target.files[0])} type="file" id='patient-img' hidden/>
          <p>Upload patient <br />picture (optional)</p>
        </div>

        <div className='flex flex-col lg:flex-row items-start gap-10 text-gray-600'>
          {/* Left Column */}
          <div className='w-full lg:flex-1 flex flex-col gap-4'>
            <div className='flex-1 flex flex-col gap-1'>
              <p>Full Name *</p>
              <input 
                onChange={(e) => setName(e.target.value)} 
                value={name} 
                className='border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                type="text" 
                placeholder='Enter full name' 
                required
              />
            </div>

            <div className='flex-1 flex flex-col gap-1'>
              <p>Email Address *</p>
              <input 
                onChange={(e) => setEmail(e.target.value)} 
                value={email} 
                className='border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                type="email" 
                placeholder='Enter email address' 
                required
              />
            </div>

            <div className='flex-1 flex flex-col gap-1'>
              <p>Password *</p>
              <input 
                onChange={(e) => setPassword(e.target.value)} 
                value={password} 
                className='border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                type="password" 
                placeholder='Enter password (min 8 characters)' 
                required
                minLength="8"
              />
            </div>

            <div className='flex-1 flex flex-col gap-1'>
              <p>Phone Number *</p>
              <input 
                onChange={(e) => setPhone(e.target.value)} 
                value={phone} 
                className='border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                type="tel" 
                placeholder='Enter phone number' 
                required
              />
            </div>
          </div>

          {/* Right Column */}
          <div className='w-full lg:flex-1 flex flex-col gap-4'>
            <div className='flex-1 flex flex-col gap-1'>
              <p>Gender</p>
              <select 
                onChange={(e) => setGender(e.target.value)} 
                value={gender} 
                className='border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value="Not Selected">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className='flex-1 flex flex-col gap-1'>
              <p>Date of Birth</p>
              <input 
                onChange={(e) => setDob(e.target.value)} 
                value={dob} 
                className='border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                type="date" 
              />
            </div>

            {/* Allergies Section */}
            <div className='flex-1 flex flex-col gap-1'>
              <div className='flex items-center gap-2 mb-2'>
                <input
                  type="checkbox"
                  id="hasAllergies"
                  checked={hasAllergies}
                  onChange={(e) => setHasAllergies(e.target.checked)}
                  className='h-4 w-4'
                />
                <label htmlFor="hasAllergies" className='font-medium'>
                  Has Allergies?
                </label>
              </div>
              
              {hasAllergies && (
                <div className='space-y-2'>
                  <div className='flex gap-2'>
                    <input
                      type="text"
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      placeholder="Add an allergy (e.g., Penicillin)"
                      className='border rounded px-3 py-2 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500'
                      onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                    />
                    <button
                      type="button"
                      onClick={addAllergy}
                      className='bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors'
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Allergies List */}
                  <div className='space-y-1'>
                    {allergies.map((allergy, index) => (
                      <div key={index} className='flex items-center justify-between bg-gray-50 p-2 rounded'>
                        <span className='text-sm'>{allergy}</span>
                        <button
                          type="button"
                          onClick={() => removeAllergy(index)}
                          className='text-red-500 hover:text-red-700 text-sm font-medium'
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className='flex-1 flex flex-col gap-1'>
              <p>Address</p>
              <input 
                onChange={(e) => setAddress1(e.target.value)} 
                value={address1} 
                className='border rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                type="text" 
                placeholder='Address Line 1'
              />
              <input 
                onChange={(e) => setAddress2(e.target.value)} 
                value={address2} 
                className='border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                type="text" 
                placeholder='Address Line 2'
              />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className='bg-blue-600 hover:bg-blue-700 px-10 py-3 mt-6 text-white rounded-lg font-medium transition-colors'
        >
          Add Patient
        </button>
      </div>
    </form>
  )
}

export default AddPatient