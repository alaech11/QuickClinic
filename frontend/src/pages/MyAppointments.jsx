import React, { useContext } from 'react'
import {AppContext} from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useEffect } from 'react'
import { useState } from 'react'
import QuestionModal from './QuestionModal'

const MyAppointments = () => {

const {backendUrl, token, getDoctorsData} = useContext(AppContext)

const [appointments,setAppointments] = useState([])
const [selectedAppointment, setSelectedAppointment] = useState(null)
const [showQuestionModal, setShowQuestionModal] = useState(false)
const [appointmentQuestions, setAppointmentQuestions] = useState([])
const [loadingQuestions, setLoadingQuestions] = useState(false)

const months = ['','Jan', 'Feb', 'Mar', 'Apr', 'May', 'June','Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const slotDtaeFormat = (slotDate) =>{
const dateArray = slotDate.split('_')
return dateArray[0]+" "+ months[Number(dateArray[1])] + " " + dateArray[2]
}

const getUserAppointmets = async () => {
  try {
    const {data} = await axios.get(backendUrl + '/api/user/appointments', {headers:{token}})
     if (data.success) {
      setAppointments(data.appointments.reverse())
     } else {
    
  }
  } catch (error) {
    console.log(error);
    toast.error(error.message)
  }
}

const cancelAppointment = async (appointmentId)=>{
try {
  const {data} = await axios.post(backendUrl + '/api/user/cancel-appointment', {appointmentId}, {headers:{token}})
  if (data.success) {
    toast.success(data.message)
    getUserAppointmets()
    getDoctorsData()
  }else{
    toast.error(data.message)
  }
  
} catch (error) {
  console.log(error);
    toast.error(error.message)
}
}

const handleQuestionClick = async (appointment) => {
  setSelectedAppointment(appointment)
  setLoadingQuestions(true)
  
  try {
    const {data} = await axios.get(backendUrl + `/api/user/appointment-questions/${appointment._id}`, {headers:{token}})
    if (data.success) {
      setAppointmentQuestions(data.questions)
    }
  } catch (error) {
    console.log(error)
  } finally {
    setLoadingQuestions(false)
  }
  
  setShowQuestionModal(true)
}

const handleQuestionSubmitted = () => {
  // Refresh the questions for this appointment
  if (selectedAppointment) {
    handleQuestionClick(selectedAppointment)
  }
}

// Count unanswered questions for an appointment
const countUnansweredQuestions = async (appointmentId) => {
  try {
    const {data} = await axios.get(backendUrl + `/api/user/appointment-questions/${appointmentId}`, {headers:{token}})
    if (data.success) {
      let unansweredCount = 0;
      data.questions.forEach(thread => {
        if (!thread.isAnswered) {
          unansweredCount++;
        }
      });
      return unansweredCount;
    }
  } catch (error) {
    console.log(error)
  }
  return 0;
}

useEffect(()=>{
if (token) {
  getUserAppointmets()
}
},[])

  return (
    <div>
      <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>My Appointments</p>
      <div>
        {appointments.map((item,index) => (
          <div className='grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 sm:flex sm:gap-6 py-4 border-b' key={index}>
            <div>
              <img className='w-32 h-32 object-cover rounded-lg bg-indigo-50' src={item.docData.image} alt="" />
            </div>
            <div className='flex-1 text-sm text-zinc-600'>
              <p className='text-neutral-800 font-semibold text-lg'>{item.docData.name}</p>
              <p className='text-primary font-medium'>{item.docData.speciality}</p>
              <p className='text-zinc-700 font-medium mt-2'>Address:</p>
              <p className='text-xs'>{item.docData.address.line1}</p>
              <p className='text-xs'>{item.docData.address.line2}</p>
              <p className='text-sm mt-2'>
                <span className='text-neutral-700 font-medium'>Date & Time:</span> {slotDtaeFormat(item.slotDate)} | {item.slotTime}
              </p>
            </div>
            <div className='flex flex-col gap-2 justify-end items-end'>
              {!item.cancelled && !item.isCompleted && (
                <button onClick={()=>cancelAppointment(item._id)} 
                  className='text-sm text-stone-500 text-center sm:min-w-48 py-2 px-4 border rounded hover:bg-red-600 hover:text-white transition-all duration-300'>
                  Cancel Appointment
                </button>
              )}

              {item.cancelled && !item.isCompleted && (
                <button className='sm:min-w-48 py-2 px-4 border border-red-500 rounded text-red-500'>
                  Appointment cancelled
                </button>
              )}

              {item.isCompleted && (
                <div className='flex flex-col gap-3'>
                  <button 
                    onClick={() => handleQuestionClick(item)}
                    className='sm:min-w-48 py-2 px-4 border border-blue-500 rounded text-blue-500 hover:bg-blue-50 transition-all duration-300 flex items-center justify-center gap-2'>
                    <span>Ask Questions</span>
                    {loadingQuestions && selectedAppointment?._id === item._id ? (
                      <span className='animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full'></span>
                    ) : null}
                  </button>
                  <button className='sm:min-w-48 py-2 px-4 border border-green-500 rounded text-green-500'>
                    Appointment Completed
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showQuestionModal && selectedAppointment && (
        <QuestionModal
          appointment={selectedAppointment}
          questions={appointmentQuestions}
          onClose={() => {
            setShowQuestionModal(false)
            setAppointmentQuestions([])
            setSelectedAppointment(null)
          }}
          onQuestionSubmitted={handleQuestionSubmitted}
        />
      )}
    </div>
  )
}

export default MyAppointments