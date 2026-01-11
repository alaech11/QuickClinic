import { jest } from '@jest/globals';

// First mock all the dependencies using unstable_mockModule
jest.unstable_mockModule('../../models/questionModel.js', () => ({
  default: class QuestionModel {
    static find = jest.fn();
    static findById = jest.fn();
    
    constructor(data) {
      this.data = data;
      this.save = jest.fn();
    }
  }
}));

jest.unstable_mockModule('../../models/appointmentModel.js', () => ({
  default: {
    findById: jest.fn()
  }
}));

// Now import the controller and models
const { askQuestion, getAppointmentQuestions, getQuestionThread } = await import('../../controllers/questionController.js');
const questionModel = (await import('../../models/questionModel.js')).default;
const appointmentModel = (await import('../../models/appointmentModel.js')).default;

// Mock response
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Question Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('askQuestion success', async () => {
    // Mock appointment
    appointmentModel.findById.mockResolvedValue({
      _id: 'a1',
      isCompleted: true,
      userId: 'u1',
      docId: 'd1',
      toString: () => 'a1'
    });

    // Mock save
    const questionInstance = new questionModel({});
    questionInstance.save.mockResolvedValue({
      _id: 'q1',
      appointmentId: 'a1',
      userId: 'u1',
      question: 'Test question',
      createdAt: new Date()
    });

    const req = {
      body: {
        appointmentId: 'a1',
        userId: 'u1',
        question: 'Test question'
      }
    };

    const res = mockRes();

    await askQuestion(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ 
        success: true,
        message: "Question submitted successfully"
      })
    );
  });

  test('getAppointmentQuestions success', async () => {
    // Mock appointment
    appointmentModel.findById.mockResolvedValue({
      _id: 'a1',
      userId: 'u1',
      toString: () => 'a1'
    });

    // Create a simple chainable mock
    const mockQuestions = [
      {
        _id: 'q1',
        appointmentId: 'a1',
        question: 'Test question',
        userId: { name: 'User Test', image: 'test.jpg' },
        askedAt: new Date()
      }
    ];
    
    questionModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockQuestions)
      })
    });

    const req = {
      body: { userId: 'u1' },
      params: { appointmentId: 'a1' }
    };

    const res = mockRes();

    await getAppointmentQuestions(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  test('getQuestionThread success', async () => {
    const mainQuestion = {
      _id: 'q1',
      threadId: null,
      appointmentId: 'a1'
    };
    
    questionModel.findById.mockResolvedValue(mainQuestion);

    // Create a simple chainable mock
    const threadQuestions = [
      {
        _id: 'q1',
        appointmentId: 'a1',
        question: 'Test question',
        userId: { name: 'User Test', image: 'test.jpg' },
        doctorId: { name: 'Doctor Test', image: 'doctor.jpg' },
        askedAt: new Date()
      }
    ];
    
    questionModel.find.mockReturnValue({
      populate: jest.fn()
        .mockReturnThis()
        .mockReturnThis(),
      sort: jest.fn().mockResolvedValue(threadQuestions)
    });

    const req = {
      params: { questionId: 'q1' }
    };

    const res = mockRes();

    await getQuestionThread(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ 
        success: true,
        appointmentId: 'a1'
      })
    );
  });
});