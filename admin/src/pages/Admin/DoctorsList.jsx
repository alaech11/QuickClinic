import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'

const DoctorsList = () => {
  const {doctors, aToken, getAllDoctors, changeAvailablity, confirmDeleteDoctor} = useContext(AdminContext)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState({}) // Track loading state for each delete button

  useEffect(()=> {
    if (aToken) {
      setLoading(true)
      getAllDoctors()
      setLoading(false)
    } 
  },[aToken])

  // Filter doctors based on search term
  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.speciality.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle delete doctor
  const handleDeleteDoctor = async (docId, doctorName) => {
    setDeleteLoading(prev => ({...prev, [docId]: true}))
    const result = await confirmDeleteDoctor(docId, doctorName)
    setDeleteLoading(prev => ({...prev, [docId]: false}))
  }

  if (loading) {
    return <div className="m-5">Loading doctors...</div>
  }

  return (
    <div className='m-5'>
      <div className='flex justify-between items-center mb-5'>
        <h1 className='text-2xl font-bold text-gray-800'>All Doctors</h1>
        <div className='flex gap-3'>
          <div className='relative'>
            <input
              type="text"
              placeholder="Search doctors..."
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
            Total: {doctors.length} doctors
          </div>
        </div>
      </div>
      
      <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
        { 
          filteredDoctors && filteredDoctors.length > 0 ? (
            filteredDoctors.map((doctor, index)=>(
              <div className='border border-indigo-200 rounded-xl w-full max-w-72 overflow-hidden group hover:shadow-lg transition-shadow relative' key={doctor._id}>
                {/* Doctor Image */}
                <div className='relative overflow-hidden bg-indigo-50'>
                  <img 
                    className='w-full h-45 object-cover group-hover:scale-105 transition-transform duration-300' 
                    src={doctor.image} 
                    alt={doctor.name} 
                  />
                  {/* Availability Badge */}
                  <div className='absolute top-3 right-3'>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${doctor.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {doctor.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
                
                {/* Doctor Info */}
                <div className='p-4'>
                  <div className='flex justify-between items-start mb-2'>
                    <div>
                      <p className='text-neutral-800 text-lg font-medium'>{doctor.name}</p>
                      <p className='text-zinc-600 text-sm'>{doctor.speciality}</p>
                    </div>
                    <div className='text-sm text-gray-500'>
                      ${doctor.fees}
                    </div>
                  </div>
                  
                  <p className='text-gray-600 text-sm mb-3 line-clamp-2'>
                    {doctor.about || 'No description available'}
                  </p>
                  
                  <div className='text-xs text-gray-500 mb-3'>
                    <div className='flex items-center gap-1 mb-1'>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span>{doctor.experience} experience</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span>{doctor.address?.line1 ? doctor.address.line1.substring(0, 20) + '...' : 'No address'}</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className='flex items-center justify-between pt-3 border-t border-gray-100'>
                    <div className='flex items-center gap-2 text-sm'>
                      <label className='flex items-center gap-1 cursor-pointer'>
                        <input 
                          onChange={()=> changeAvailablity(doctor._id)} 
                          type="checkbox" 
                          checked={doctor.available}
                          className='h-4 w-4 text-blue-600 rounded focus:ring-blue-500'
                        />
                        <span className='text-gray-600'>Available</span>
                      </label>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteDoctor(doctor._id, doctor.name)}
                      disabled={deleteLoading[doctor._id]}
                      className='text-red-600 hover:text-red-800 px-3 py-1 text-sm rounded border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1'
                    >
                      {deleteLoading[doctor._id] ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className='w-full text-center py-8'>
              {searchTerm ? (
                <div className='text-gray-500'>
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className='text-lg'>No doctors found matching "{searchTerm}"</p>
                </div>
              ) : (
                <div className='text-gray-500'>
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className='text-lg'>No doctors found</p>
                  <p className='text-sm mt-1'>Add your first doctor to get started</p>
                </div>
              )}
            </div>
          )
        }
      </div>
    </div>
  )
}

export default DoctorsList