import { jest } from '@jest/globals';

// Mock fs with a default export to match the controller's import
jest.unstable_mockModule('fs', () => {
  const mockFs = {
    unlinkSync: jest.fn(),
    createReadStream: jest.fn(),
    existsSync: jest.fn(() => true),
    promises: {
      unlink: jest.fn()
    }
  };
  
  // Return an object with a default property for default import
  return {
    __esModule: true,
    default: mockFs,
    ...mockFs // Also spread the methods for named imports
  };
});

// Mock cloudinary to match the controller's import: import { v2 as cloudinary } from 'cloudinary'
jest.unstable_mockModule('cloudinary', () => {
  const mockV2 = {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({
        secure_url: 'http://cloudinary/test.pdf',
        public_id: 'prescription123',
        resource_type: 'raw'
      }),
      destroy: jest.fn()
    },
    url: jest.fn().mockReturnValue('http://cloudinary/download.pdf')
  };
  
  // The controller imports { v2 as cloudinary } so we need a named export v2
  return {
    v2: mockV2
  };
});

// Mock models
jest.unstable_mockModule('../../models/prescriptionModel.js', () => ({
  default: class PrescriptionModel {
    static findById = jest.fn();
    static findByIdAndDelete = jest.fn();
    static find = jest.fn();
    
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

// Import after mocking
const { uploadPrescription, deletePrescription, viewPrescription } = await import('../../controllers/prescriptionController.js');

// Get the mocked fs module
const fsModule = await import('fs');
// Since controller imports as default, we need to check both
const fs = fsModule.default || fsModule;

// Get other mocked modules
const prescriptionModel = (await import('../../models/prescriptionModel.js')).default;
const appointmentModel = (await import('../../models/appointmentModel.js')).default;

// Import cloudinary - the controller imports { v2 as cloudinary }
// So we need to get the v2 export
const cloudinaryModule = await import('cloudinary');
const cloudinary = cloudinaryModule.v2;

// Mock response
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

describe('Prescription Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset cloudinary mock
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: 'http://cloudinary/test.pdf',
      public_id: 'prescription123',
      resource_type: 'raw'
    });
  });

  test('uploadPrescription success', async () => {
    // Mock appointment
    appointmentModel.findById.mockResolvedValue({
      _id: 'a1',
      isCompleted: true,
      docId: 'd1',
      userId: 'u1'
    });

    // Mock save
    const prescriptionInstance = new prescriptionModel({});
    prescriptionInstance.save.mockResolvedValue({
      _id: 'p1',
      appointmentId: 'a1',
      fileUrl: 'http://cloudinary/test.pdf',
      downloadUrl: 'http://cloudinary/download.pdf',
      notes: 'Test notes'
    });

    const req = {
      body: {
        appointmentId: 'a1',
        notes: 'Test notes'
      },
      file: {
        path: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        originalname: 'test.pdf'
      }
    };

    const res = mockRes();

    await uploadPrescription(req, res);

    expect(cloudinary.uploader.upload).toHaveBeenCalled();
    expect(fs.unlinkSync).toHaveBeenCalledWith('test.pdf');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ 
        success: true,
        message: 'Prescription uploaded successfully'
      })
    );
  });

  test('deletePrescription success', async () => {
    // Mock prescription
    prescriptionModel.findById.mockResolvedValue({
      _id: 'p1',
      doctorId: { toString: () => 'd1' },
      publicId: 'prescription123'
    });

    prescriptionModel.findByIdAndDelete.mockResolvedValue({
      _id: 'p1'
    });

    const req = {
      body: { prescriptionId: 'p1' },
      doctorId: 'd1'
    };

    const res = mockRes();

    await deletePrescription(req, res);

    expect(prescriptionModel.findById).toHaveBeenCalledWith('p1');
    expect(prescriptionModel.findByIdAndDelete).toHaveBeenCalledWith('p1');
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('prescription123');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ 
        success: true,
        message: 'Prescription deleted successfully'
      })
    );
  });

  test('viewPrescription success', async () => {
    // Mock prescription
    prescriptionModel.findById.mockResolvedValue({
      fileUrl: 'http://cloudinary/test.pdf'
    });

    const req = {
      params: { prescriptionId: 'p1' }
    };

    const res = mockRes();

    await viewPrescription(req, res);

    expect(prescriptionModel.findById).toHaveBeenCalledWith('p1');
    expect(res.redirect).toHaveBeenCalledWith('http://cloudinary/test.pdf');
  });
});