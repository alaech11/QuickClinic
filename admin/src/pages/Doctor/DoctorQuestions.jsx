import React, { useState, useEffect, useContext } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const DoctorQuestions = () => {
  const { backendUrl, dToken, getAppointments } = useContext(DoctorContext)
  const [questionsData, setQuestionsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState('')
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [viewMode, setViewMode] = useState('all') // 'all' or 'byAppointment'

  const getDoctorQuestions = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(backendUrl + '/api/doctor/questions', {
        headers: { dToken }
      })
      
      if (data.success) {
        // Data now includes questionsByAppointment
        setQuestionsData(data)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSubmit = async (questionId) => {
    if (!answer.trim()) {
      toast.error('Please enter an answer')
      return
    }

    try {
      const { data } = await axios.post(
        backendUrl + '/api/doctor/answer-question',
        {
          questionId,
          answer
        },
        { headers: { dToken } }
      )

      if (data.success) {
        toast.success(data.message)
        setAnswer('')
        setSelectedQuestion(null)
        getDoctorQuestions()
        getAppointments()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const getQuestionThread = async (questionId) => {
    try {
      const { data } = await axios.get(
        backendUrl + `/api/doctor/question-thread/${questionId}`,
        { headers: { dToken } }
      )
      
      if (data.success) {
        return data.threadQuestions
      }
    } catch (error) {
      console.log(error)
    }
    return []
  }

  useEffect(() => {
    if (dToken) {
      getDoctorQuestions()
    }
  }, [dToken])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Count unanswered questions
  const countUnanswered = (questions) => {
    return questions.filter(q => !q.isAnswered).length
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Patient Questions</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-md ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            All Questions
          </button>
          <button
            onClick={() => setViewMode('byAppointment')}
            className={`px-4 py-2 rounded-md ${viewMode === 'byAppointment' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            By Appointment
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : viewMode === 'byAppointment' && questionsData.questionsByAppointment ? (
        // Grouped by appointment view
        <div className="space-y-6">
          {questionsData.questionsByAppointment.map((appointmentGroup, index) => (
            <div key={index} className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Appointment with {appointmentGroup.patient.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {appointmentGroup.appointment.slotDate} at {appointmentGroup.appointment.slotTime}
                  </p>
                </div>
                {appointmentGroup.hasUnanswered && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    {countUnanswered(appointmentGroup.questions)} unanswered
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {appointmentGroup.questions.map((question) => (
                  <div key={question._id} className="border-l-4 border-blue-200 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-700">{question.userId.name}</p>
                        <p className="text-sm text-gray-500">{formatDate(question.askedAt)}</p>
                      </div>
                      {question.isAnswered ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Answered
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {question.question}
                        {question.isFollowUp && (
                          <span className="ml-2 text-xs text-blue-600">(Follow-up)</span>
                        )}
                      </p>
                    </div>

                    {question.isAnswered ? (
                      <div className="ml-4">
                        <p className="font-medium text-gray-700 mb-1">Your Response:</p>
                        <p className="text-gray-600 bg-green-50 p-3 rounded-lg">
                          {question.answer}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Answered on: {formatDate(question.answeredAt)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        {selectedQuestion === question._id ? (
                          <div className="mt-3">
                            <textarea
                              value={answer}
                              onChange={(e) => setAnswer(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows="3"
                              placeholder="Type your response here..."
                            />
                            <div className="flex justify-end space-x-3 mt-3">
                              <button
                                onClick={() => {
                                  setSelectedQuestion(null)
                                  setAnswer('')
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleAnswerSubmit(question._id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                              >
                                Submit Answer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedQuestion(question._id)
                              setAnswer('')
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          >
                            Answer This Question
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // All questions view (flat list)
        <div className="space-y-6">
          {questionsData.questions && questionsData.questions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No questions from patients yet.</p>
            </div>
          ) : (
            questionsData.questions && questionsData.questions.map((question) => (
              <div key={question._id} className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="flex items-start space-x-4">
                  <img
                    src={question.userId?.image || '/default-avatar.png'}
                    alt={question.userId?.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {question.userId?.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Appointment: {question.appointmentId?.slotDate} at {question.appointmentId?.slotTime}
                        </p>
                        <p className="text-sm text-gray-500">
                          Asked on: {formatDate(question.askedAt)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        question.isAnswered 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {question.isAnswered ? 'Answered' : 'Pending'}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-2">Question:</h4>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {question.question}
                        {question.isFollowUp && (
                          <span className="ml-2 text-sm text-blue-600">(Follow-up question)</span>
                        )}
                      </p>
                    </div>

                    {question.isAnswered ? (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700 mb-2">Your Response:</h4>
                        <p className="text-gray-600 bg-blue-50 p-3 rounded-lg">
                          {question.answer}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Answered on: {formatDate(question.answeredAt)}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4">
                        {selectedQuestion === question._id ? (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Your Answer:</h4>
                            <textarea
                              value={answer}
                              onChange={(e) => setAnswer(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows="4"
                              placeholder="Type your response here..."
                            />
                            <div className="flex justify-end space-x-3 mt-3">
                              <button
                                onClick={() => {
                                  setSelectedQuestion(null)
                                  setAnswer('')
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleAnswerSubmit(question._id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                              >
                                Submit Answer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedQuestion(question._id)
                              setAnswer('')
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Answer This Question
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default DoctorQuestions