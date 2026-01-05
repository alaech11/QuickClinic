import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import { toast } from 'react-toastify'
import axios from 'axios'

const Appointment = () => {
  const { docId } = useParams()
  const navigate = useNavigate()

  const [docInfo, setDocInfo] = useState(null)
  const { doctors, currencySymbole, backendUrl, token, getDoctorData } = useContext(AppContext)
  
  // Date selection states
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedDayObj, setSelectedDayObj] = useState(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [timeSlots, setTimeSlots] = useState([])
  const [bookedSlots, setBookedSlots] = useState([]) // NEW: Track booked slots
  const [loading, setLoading] = useState(false)

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const monthsOfYear = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Generate years for dropdown (current year to next 5 years)
  const generateYears = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = 0; i < 15; i++) {
      years.push(currentYear + i)
    }
    return years
  }

  // Convert date from YYYY-MM-DD to day_month_year format
  const convertToSlotDate = (dateString) => {
    if (!dateString) return ''
    const [year, month, day] = dateString.split('-').map(Number)
    return `${day}_${month}_${year}`
  }

  // Format date for display (handles timezone correctly)
  const formatDateDisplay = (dateString) => {
    if (!dateString) return ''
    
    // Parse the date string and add timezone offset
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    
    // Get the day of the week
    const dayOfWeek = daysOfWeek[date.getDay()]
    
    return `${dayOfWeek}, ${day} ${monthsOfYear[month - 1]} ${year}`
  }

  // Check if a date is in the past
  const isPastDate = (day) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(day.year, day.month, day.day)
    return checkDate < today
  }

  // Check if a time slot is in the past for today
  const isPastTimeSlot = (slotTime, dateString) => {
    const now = new Date()
    const [year, month, day] = dateString.split('-').map(Number)
    const selectedDateObj = new Date(year, month - 1, day)
    
    // Parse the time slot
    const [time, modifier] = slotTime.split(' ')
    let [hours, minutes] = time.split(':')
    hours = parseInt(hours)
    minutes = parseInt(minutes)
    
    if (modifier === 'PM' && hours < 12) hours += 12
    if (modifier === 'AM' && hours === 12) hours = 0
    
    const slotDateTime = new Date(selectedDateObj)
    slotDateTime.setHours(hours, minutes, 0, 0)
    
    return slotDateTime <= now
  }

  // Check if a time slot is already booked
  const isBookedSlot = (slotTime) => {
    return bookedSlots.includes(slotTime)
  }

  // Generate days for the selected month and year
  const generateDaysOfMonth = (year, month) => {
    const days = []
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const totalDays = lastDay.getDate()
    
    // Add days before current month (for calendar display - disabled)
    const firstDayOfWeek = firstDay.getDay()
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDay = prevMonthLastDay - i
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year
      
      days.push({
        day: prevDay,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
        isPast: true,
        dateString: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`
      })
    }
    
    // Add days of current month
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 1; i <= totalDays; i++) {
      const currentDateObj = new Date(year, month, i)
      const isPast = currentDateObj < today
      const monthStr = String(month + 1).padStart(2, '0')
      const dayStr = String(i).padStart(2, '0')
      
      days.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true,
        isPast: isPast,
        date: currentDateObj,
        dayOfWeek: daysOfWeek[currentDateObj.getDay()],
        dateString: `${year}-${monthStr}-${dayStr}`,
        monthName: monthsOfYear[month],
        formattedDate: `${daysOfWeek[currentDateObj.getDay()]}, ${i} ${monthsOfYear[month]} ${year}`
      })
    }
    
    // Add days after current month (for calendar display - disabled)
    const lastDayOfWeek = lastDay.getDay()
    const daysToAdd = 42 - days.length // Complete 6 weeks
    
    for (let i = 1; i <= daysToAdd; i++) {
      const nextMonth = month === 11 ? 0 : month + 1
      const nextYear = month === 11 ? year + 1 : year
      
      days.push({
        day: i,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
        isPast: true,
        dateString: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      })
    }
    
    return days
  }

  const fetchDocInfo = async () => {
    const docInfo = doctors.find(doc => doc._id === docId)
    setDocInfo(docInfo)
  }

  // Generate time slots for a specific date
  const generateTimeSlotsForDate = (dateString) => {
    const slots = []
    
    if (!dateString || !docInfo) return slots
    
    const now = new Date()
    const [year, month, day] = dateString.split('-').map(Number)
    const selectedDateObj = new Date(year, month - 1, day)
    
    // Check if the date is today
    const today = new Date()
    const isToday = 
      selectedDateObj.getDate() === today.getDate() &&
      selectedDateObj.getMonth() === today.getMonth() &&
      selectedDateObj.getFullYear() === today.getFullYear()
    
    // Set start and end times (10 AM to 9 PM)
    let startHour = 10
    let endHour = 21
    
    if (isToday) {
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      
      // If it's past 9 PM, no slots for today
      if (currentHour >= 21) {
        return []
      }
      
      // If it's after 10 AM, adjust start time
      if (currentHour >= 10) {
        startHour = currentHour
        // Round up to next 30-minute interval
        if (currentMinute > 30) {
          startHour += 1
          startHour = Math.min(startHour, 20) // Ensure we don't go past 8:30 PM start
        }
      }
    }
    
    // Generate 30-minute slots
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip if it's today and the slot is in the past
        if (isToday) {
          const slotTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute)
          if (slotTime <= now) continue
        }
        
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const formattedTime = new Date(2000, 0, 1, hour, minute).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })
        
        slots.push({
          time24: time24,
          time12: formattedTime,
          hour,
          minute
        })
      }
    }
    
    return slots
  }

  // Handle date selection
  const handleDateSelect = (day) => {
    if (!day.isCurrentMonth || day.isPast) return
    
    setSelectedDate(day.dateString)
    setSelectedDayObj(day)
    setSelectedTime('')
    
    // Generate slots for this date
    const slots = generateTimeSlotsForDate(day.dateString)
    setTimeSlots(slots)
    
    // Get booked slots for this date
    if (docInfo && docInfo.slots_booked) {
      const slotDateKey = convertToSlotDate(day.dateString)
      const bookedForDate = docInfo.slots_booked[slotDateKey] || []
      setBookedSlots(bookedForDate)
    } else {
      setBookedSlots([])
    }
  }

  // Handle month change
  const handleMonthChange = (increment) => {
    let newMonth = selectedMonth + increment
    let newYear = selectedYear
    
    if (newMonth < 0) {
      newMonth = 11
      newYear--
    } else if (newMonth > 11) {
      newMonth = 0
      newYear++
    }
    
    setSelectedMonth(newMonth)
    setSelectedYear(newYear)
    setSelectedDate('')
    setSelectedDayObj(null)
    setSelectedTime('')
    setTimeSlots([])
    setBookedSlots([])
  }

  const bookAppointment = async () => {
    if (!token) {
        toast.warn('Login to book appointment')
        return navigate('/login')
    }
    
    try {
        if (!selectedDate || !selectedTime) {
            toast.error("Please select a date and time slot")
            return
        }
        
        // Check if selected time slot is already booked
        if (isBookedSlot(selectedTime)) {
            toast.error("This time slot is already booked. Please choose another time.")
            return
        }
        
        // Check if selected date is in the past
        const [year, month, day] = selectedDate.split('-').map(Number)
        const selectedDateObj = new Date(year, month - 1, day)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (selectedDateObj < today) {
            toast.error("Cannot book appointment for past dates")
            return
        }
        
        // Check if selected time is in the past for today
        if (selectedDateObj.getTime() === today.getTime()) {
            if (isPastTimeSlot(selectedTime, selectedDate)) {
                toast.error("Cannot book appointment for past time slots")
                return
            }
        }
        
        setLoading(true)
        
        // Format date for backend (day_month_year)
        const slotDate = `${day}_${month}_${year}`
        
        console.log("Booking details:", {
            docId,
            slotDate,
            slotTime: selectedTime,
        })
        
        const { data } = await axios.post(
            backendUrl + '/api/user/book-appointment', 
            { docId, slotDate, slotTime: selectedTime }, 
            { headers: { token } }
        )
        
        if (data.success) {
            toast.success(data.message)
            if (getDoctorData) {
                getDoctorData() // Refresh doctor data
            }
            navigate('/my-appointments')
        } else {
            toast.error(data.message)
            // If it's a "one appointment per day" error, offer to view existing appointment
            if (data.message.includes("already have an appointment")) {
                setTimeout(() => {
                    if (window.confirm("Would you like to view your existing appointments?")) {
                        navigate('/my-appointments')
                    }
                }, 1000)
            }
        }
    } catch (error) {
        console.log(error)
        toast.error(error.response?.data?.message || error.message || "Booking failed")
    } finally {
        setLoading(false)
    }
  }

  // Set today as default selected date
  useEffect(() => {
    if (!selectedDate && docInfo) {
      const today = new Date()
      const todayYear = today.getFullYear()
      const todayMonth = String(today.getMonth() + 1).padStart(2, '0')
      const todayDay = String(today.getDate()).padStart(2, '0')
      const todayString = `${todayYear}-${todayMonth}-${todayDay}`
      
      // Find today's day object
      const days = generateDaysOfMonth(todayYear, today.getMonth())
      const todayObj = days.find(d => 
        d.isCurrentMonth && 
        d.day === today.getDate() && 
        d.month === today.getMonth() && 
        d.year === todayYear
      )
      
      if (todayObj) {
        setSelectedDate(todayString)
        setSelectedDayObj(todayObj)
        const slots = generateTimeSlotsForDate(todayString)
        setTimeSlots(slots)
        
        // Get booked slots for today
        if (docInfo.slots_booked) {
          const slotDateKey = convertToSlotDate(todayString)
          const bookedForDate = docInfo.slots_booked[slotDateKey] || []
          setBookedSlots(bookedForDate)
        }
      }
    }
  }, [docInfo])

  useEffect(() => {
    fetchDocInfo()
  }, [doctors, docId])

  // Get current month days
  const currentMonthDays = generateDaysOfMonth(selectedYear, selectedMonth)

  return docInfo && (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/**-------------doctor details */}
      <div className='flex flex-col lg:flex-row gap-8'>
        <div className='lg:w-1/3'>
          <div className='sticky top-8'>
            <img className='w-full h-64 lg:h-80 object-cover rounded-2xl shadow-lg' src={docInfo.image} alt={docInfo.name} />
            
            <div className='mt-6 bg-white rounded-2xl shadow-lg p-6'>
              <div className='flex items-center gap-3'>
                <div className='flex-1'>
                  <h2 className='text-2xl font-bold text-gray-900'>{docInfo.name}</h2>
                  <div className='flex items-center gap-2 mt-1'>
                    <img className='w-5 h-5' src={assets.verified_icon} alt="Verified" />
                    <span className='text-sm text-green-600'>Verified Doctor</span>
                  </div>
                </div>
              </div>
              
              <div className='mt-4 space-y-3'>
                <div className='flex items-center gap-2'>
                  <span className='text-gray-600'>Speciality:</span>
                  <span className='font-medium'>{docInfo.speciality}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-gray-600'>Degree:</span>
                  <span className='font-medium'>{docInfo.degree}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-gray-600'>Experience:</span>
                  <span className='font-medium'>{docInfo.experience} years</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-gray-600'>Fee:</span>
                  <span className='text-xl font-bold text-primary'>{currencySymbole}{docInfo.fees}</span>
                </div>
              </div>
              
              <div className='mt-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>About Doctor</h3>
                <p className='text-gray-600 text-sm leading-relaxed'>
                  {docInfo.about}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/**------booking section */}
        <div className='lg:w-2/3'>
          <div className='bg-white rounded-2xl shadow-lg p-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>Book Appointment</h2>
            
            {/** Month/Year Selection */}
            <div className='mb-8'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-4'>
                  <select 
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(parseInt(e.target.value))
                      setSelectedDate('')
                      setSelectedDayObj(null)
                      setSelectedTime('')
                      setTimeSlots([])
                      setBookedSlots([])
                    }}
                    className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                  >
                    {generateYears().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  
                  <select 
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(parseInt(e.target.value))
                      setSelectedDate('')
                      setSelectedDayObj(null)
                      setSelectedTime('')
                      setTimeSlots([])
                      setBookedSlots([])
                    }}
                    className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                  >
                    {monthsOfYear.map((month, index) => (
                      <option key={month} value={index}>{month}</option>
                    ))}
                  </select>
                </div>
                
                <div className='flex gap-2'>
                  <button 
                    onClick={() => handleMonthChange(-1)}
                    className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleMonthChange(1)}
                    className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/** Calendar Header */}
              <div className='grid grid-cols-7 gap-2 mb-2'>
                {daysOfWeek.map(day => (
                  <div key={day} className='text-center text-sm font-semibold text-gray-500 py-2'>
                    {day}
                  </div>
                ))}
              </div>
              
              {/** Calendar Days */}
              <div className='grid grid-cols-7 gap-2'>
                {currentMonthDays.map((day, index) => {
                  const isSelected = selectedDate === day.dateString
                  const today = new Date()
                  const isToday = 
                    day.isCurrentMonth && 
                    day.day === today.getDate() && 
                    day.month === today.getMonth() && 
                    day.year === today.getFullYear()
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleDateSelect(day)}
                      disabled={!day.isCurrentMonth || day.isPast}
                      className={`
                        h-12 rounded-lg flex items-center justify-center text-sm font-medium transition-all
                        ${!day.isCurrentMonth ? 'text-gray-300 cursor-default' : ''}
                        ${day.isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                        ${isSelected ? 'bg-primary text-white' : ''}
                        ${day.isCurrentMonth && !day.isPast && !isSelected ? 'hover:bg-gray-100 text-gray-700' : ''}
                        ${isToday && !isSelected && !day.isPast ? 'border-2 border-primary' : ''}
                      `}
                      title={day.isPast ? "Cannot select past dates" : ""}
                    >
                      {day.day}
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/** Time Slots */}
            {selectedDate && selectedDayObj && (
              <div className='mt-8'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Available Time Slots for {selectedDayObj.formattedDate}
                  {bookedSlots.length > 0 && (
                    <span className='text-sm text-gray-500 ml-2'>
                      ({bookedSlots.length} slot{bookedSlots.length !== 1 ? 's' : ''} already booked)
                    </span>
                  )}
                </h3>
                
                {timeSlots.length > 0 ? (
                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3'>
                    {timeSlots.map((slot, index) => {
                      const isPast = isPastTimeSlot(slot.time12, selectedDate)
                      const isBooked = isBookedSlot(slot.time12)
                      const isAvailable = !isPast && !isBooked
                      
                      return (
                        <button
                          key={index}
                          onClick={() => isAvailable && setSelectedTime(slot.time12)}
                          disabled={!isAvailable}
                          className={`
                            py-3 px-4 rounded-lg border transition-all text-sm font-medium relative
                            ${!isAvailable ? 'cursor-not-allowed' : ''}
                            ${selectedTime === slot.time12 
                              ? 'bg-primary text-white border-primary' 
                              : isAvailable ? 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary' : ''
                            }
                            ${isPast ? 'bg-gray-100 text-gray-400' : ''}
                            ${isBooked ? 'bg-red-50 text-gray-400 border-red-200' : ''}
                          `}
                          title={isPast ? "This time slot has passed" : isBooked ? "This slot is already booked" : "Available slot"}
                        >
                          {slot.time12}
                          {isBooked && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              ×
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className='text-center py-8 bg-gray-50 rounded-lg'>
                    <p className='text-gray-500'>No available slots for this date</p>
                    <p className='text-sm text-gray-400 mt-1'>Please select another date</p>
                  </div>
                )}
              </div>
            )}
            
            {/** Appointment Summary */}
            {selectedDate && selectedTime && selectedDayObj && (
              <div className='mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100'>
                <h3 className='text-xl font-bold text-gray-900 mb-4'>Appointment Summary</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <div className='mb-3'>
                      <p className='text-sm text-gray-600'>Doctor</p>
                      <p className='font-semibold'>{docInfo.name}</p>
                    </div>
                    <div className='mb-3'>
                      <p className='text-sm text-gray-600'>Speciality</p>
                      <p className='font-semibold'>{docInfo.speciality}</p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-600'>Date</p>
                      <p className='font-semibold'>{selectedDayObj.formattedDate}</p>
                    </div>
                  </div>
                  <div>
                    <div className='mb-3'>
                      <p className='text-sm text-gray-600'>Time</p>
                      <p className='font-semibold'>{selectedTime}</p>
                    </div>
                    <div className='mb-3'>
                      <p className='text-sm text-gray-600'>Duration</p>
                      <p className='font-semibold'>30 minutes</p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-600'>Total Fee</p>
                      <p className='text-2xl font-bold text-primary'>{currencySymbole}{docInfo.fees}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/** Book Button */}
            <div className='mt-8'>
              <button 
                onClick={bookAppointment}
                disabled={!selectedDate || !selectedTime || loading || isBookedSlot(selectedTime)}
                className={`
                  w-full py-4 rounded-xl text-lg font-semibold transition-all
                  ${selectedDate && selectedTime && !isBookedSlot(selectedTime)
                    ? 'bg-primary hover:bg-primary-dark text-white' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {loading ? (
                  <span className='flex items-center justify-center gap-2'>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : isBookedSlot(selectedTime) ? (
                  'Slot Already Booked'
                ) : (
                  'Confirm Appointment'
                )}
              </button>
              
              <p className='text-sm text-gray-500 text-center mt-4'>
                By booking this appointment, you agree to our Terms of Service
              </p>
            </div>
          </div>
          
          {/** Additional Info */}
          <div className='mt-8 bg-white rounded-2xl shadow-lg p-6'>
            <h3 className='text-xl font-bold text-gray-900 mb-4'>Important Information</h3>
            <ul className='space-y-3 text-gray-600'>
              <li className='flex items-start gap-3'>
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Appointments can be cancelled or rescheduled up to 24 hours before the scheduled time</span>
              </li>
              <li className='flex items-start gap-3'>
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Please arrive 10 minutes before your scheduled appointment time</span>
              </li>
              <li className='flex items-start gap-3'>
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Bring any relevant medical records or prescriptions with you</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/** Related Doctors */}
      <div className='mt-12'>
        <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
      </div>
    </div>
  )
}

export default Appointment