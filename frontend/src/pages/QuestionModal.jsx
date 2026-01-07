import React, { useState, useContext, useEffect } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const QuestionModal = ({ appointment, questions, onClose, onQuestionSubmitted }) => {
  const { backendUrl, token } = useContext(AppContext)
  const [newQuestion, setNewQuestion] = useState('')
  const [followUpTo, setFollowUpTo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeThread, setActiveThread] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!newQuestion.trim()) {
      toast.error('Please enter a question')
      return
    }

    setLoading(true)
    try {
      const requestData = {
        appointmentId: appointment._id,
        question: newQuestion
      };

      // If this is a follow-up, include the parent question ID
      if (followUpTo) {
        requestData.parentQuestionId = followUpTo;
      }

      const { data } = await axios.post(
        backendUrl + '/api/user/ask-question',
        requestData,
        { headers: { token } }
      )

      if (data.success) {
        toast.success(data.message)
        setNewQuestion('')
        setFollowUpTo(null)
        onQuestionSubmitted()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message || 'Failed to submit question')
    } finally {
      setLoading(false)
    }
  }

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

  const startFollowUp = (threadId) => {
    setFollowUpTo(threadId)
    setActiveThread(threadId)
    setNewQuestion('') // Clear previous question
  }

  const cancelFollowUp = () => {
    setFollowUpTo(null)
    setActiveThread(null)
    setNewQuestion('')
  }

  // Group questions by thread (already done in backend, but ensure)
  const threads = questions || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Questions for Dr. {appointment.docData.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                You can ask multiple questions about your completed appointment
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">
              <span className="font-medium">Appointment Date:</span> {appointment.slotDate}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Time:</span> {appointment.slotTime}
            </p>
          </div>

          {/* Conversation Threads */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Your Conversations</h3>
            
            {threads.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No questions asked yet. Start a conversation!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {threads.map((thread, threadIndex) => (
                  <div key={thread.threadId} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                          Conversation {threadIndex + 1}
                        </span>
                        {thread.isAnswered ? (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                            Answered
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => startFollowUp(thread.threadId)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Ask Follow-up
                      </button>
                    </div>

                    {/* Messages in this thread */}
                    <div className="space-y-4">
                      {thread.questions.map((q, qIndex) => (
                        <div key={q._id} className={`rounded-lg p-3 ${q.isFollowUp ? 'ml-8' : ''}`}>
                          {/* Question */}
                          <div className="mb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">
                                  {q.isFollowUp ? 'Follow-up' : 'Question'}:
                                </span>
                                <span className="text-xs text-gray-500">{formatDate(q.askedAt)}</span>
                              </div>
                            </div>
                            <p className="text-gray-600 mt-1 bg-gray-50 p-3 rounded">{q.question}</p>
                          </div>

                          {/* Answer */}
                          {q.isAnswered ? (
                            <div className="ml-4 border-l-2 border-blue-200 pl-4">
                              <div className="flex justify-between items-start">
                                <span className="text-sm font-medium text-green-700">Doctor's Response:</span>
                                <span className="text-xs text-gray-500">{formatDate(q.answeredAt)}</span>
                              </div>
                              <p className="text-gray-600 mt-1 bg-green-50 p-3 rounded">{q.answer}</p>
                            </div>
                          ) : qIndex === thread.questions.length - 1 ? (
                            <div className="ml-4 border-l-2 border-yellow-200 pl-4">
                              <p className="text-yellow-600 text-sm italic">Waiting for doctor's response...</p>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* New Question Form */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              {followUpTo ? 'Ask a Follow-up Question' : 'Ask a New Question'}
            </h3>
            
            {followUpTo && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-blue-700">You're asking a follow-up question in an existing conversation.</p>
                  <button
                    onClick={cancelFollowUp}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Start new conversation instead
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  {followUpTo ? 'Your Follow-up Question' : 'Your Question'}
                </label>
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  placeholder={followUpTo 
                    ? "Type your follow-up question here. You can ask for clarification or provide more details."
                    : "Type your question here. Be specific about your concerns so the doctor can provide better guidance."
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  {followUpTo 
                    ? "The doctor will see this as part of the existing conversation."
                    : "Start a new conversation about your appointment."
                  }
                </p>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <p>You can ask multiple questions and have ongoing conversations with the doctor.</p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={loading}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Question'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionModal