import React, { useContext, useEffect, useState } from 'react'
import {useParams} from 'react-router-dom'
import {AppContext} from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'

const Appointment = () => {

const {docId} = useParams()

const [docInfo,setDocInfo] = useState(null)

const {doctors,currencySymbole} = useContext(AppContext)

const [docSlots,setDocSlots] = useState([])

const [slotIndex,setSlotIndex] = useState(0)

const [slotTime,setSlotTime] = useState('')

const daysOfWeek = ['SUN','MON','TUE','WED','THU','FRI','SAT']

const fetchDocInfo = async () => {
  const docInfo = doctors.find(doc => doc._id === docId)
  setDocInfo(docInfo)
  console.log(docInfo)
}

const getAvailableSlots = async () => {
  setDocSlots([])
  
  // Getting current date
  let today = new Date()
  
  // Create an array to collect all time slots
  let allTimeSlots = []
  
  for(let i = 0; i < 16; i++){
    // Getting date with index 
    let currentDate = new Date(today)
    currentDate.setDate(today.getDate() + i)
    
    // Setting end time for this day (9 PM)
    let endTime = new Date(currentDate)
    endTime.setHours(21, 0, 0, 0)  // 9 PM
    
    // Setting start time for this day
    if(i === 0){ // Today
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      
      // If it's after 9 PM, skip today
      if(currentHour >= 21) {
        continue // Skip to next day
      }
      
      // If it's before 10 AM, start at 10 AM
      if(currentHour < 10) {
        currentDate.setHours(10, 0, 0, 0)
      } 
      // If it's between 10 AM and 9 PM, start from current time rounded up
      else {
        // Round up to next 30-minute interval
        let nextSlotMinutes = 30
        if(currentMinute > 30) {
          currentDate.setHours(currentHour + 1, 0, 0, 0)
        } else {
          currentDate.setHours(currentHour, 30, 0, 0)
        }
        
        // If rounding up goes past 9 PM, skip today
        if(currentDate >= endTime) {
          continue // Skip to next day
        }
      }
    } else { // Future days
      currentDate.setHours(10, 0, 0, 0) // Start at 10 AM
    }
    
    let timeSlots = []
    
    // Generate slots from start time to end time
    while(currentDate < endTime){
      let formattedTime = currentDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
      
      // Add slot to array
      timeSlots.push({
        datetime: new Date(currentDate),
        time: formattedTime
      })
      
      // Increment current time by 30m
      currentDate.setMinutes(currentDate.getMinutes() + 30)
    }
    
    // Only add if there are slots for this day
    if(timeSlots.length > 0) {
      allTimeSlots.push(timeSlots)
    }
  }
  
  // Set all slots at once
  setDocSlots(allTimeSlots)
}


useEffect(()=>{
fetchDocInfo()
},[doctors,docId])

useEffect(()=>{
getAvailableSlots()
},[docInfo])

useEffect(()=>{
console.log(docSlots)
},[docSlots])

  return docInfo && (
    <div>
      {/**-------------doctor details */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div>
          <img className='bg-primary w-full sm:max-72 rounded-lg' src={docInfo.image} alt="" />
        </div>

        <div className='flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
          {/**--------------doc info name degr experience */}
          <p className='flex items-center gap-2 text-2xl font-medium text-gray-900'>{docInfo.name} 
            <img className='w-5' src={assets.verified_icon} alt="" />
          </p>
          <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
            <p>
              {docInfo.degree} - {docInfo.speciality} 
            </p>
            <button className='py-0.5 px-2 border text-xs rounded-full'>
              {docInfo.experience} 
            </button>
          </div>
          {/**---------doc about */}
          <div>
              <p className='flex items-center gap-1 text-sm font-medium text-gray-900 mt-3'>
                About <img src={assets.info_icon} alt="" />
              </p>
               <p className='text-sm text-gray-500 max-w-[700px] mt-1'>
                  {docInfo.about} 
                </p>
          </div>
          <p className='text-gray-500 font-medium mt-4'>
            Appointment fee: <span className='text-gray-600'> {currencySymbole}{docInfo.fees}</span>
          </p>
        </div>
      </div>
      {/**------boking slots */}
      <div className='sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700'>
        <p>Booking slots</p>
        <div className='flex gap-3 items-center w-full ovrflow-x-scroll mt-4'>
          {
            docSlots.length && docSlots.map((item,index)=>(
            <div onClick={()=> setSlotIndex(index)} className={`text-center py-6 min-w-16 rounded-full cursur-pointer ${slotIndex === index ? 'bg-primary text-withe' : 'border border-gray-200'}`} key={index}>
              <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
              <p>{item[0] && item[0].datetime.getDate()}</p>
            </div>
            ))
          }
        </div>
        <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
          {
            docSlots.length && docSlots[slotIndex].map((item,index)=>(
              <p onClick={()=> setSlotTime(item.time)} className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-primary text-withe' : 'test-gray-400 border border-gray-300'}`} key={index}>{item.time.toLowerCase()}</p>
            ))
          }
        </div>
        <button className='bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6'>
          Book an appointment
        </button>
      </div>
      {/**listing related doctors */}
      <RelatedDoctors docId={docId} speciality={docInfo.speciality}/>
    </div>
  )
}

export default Appointment