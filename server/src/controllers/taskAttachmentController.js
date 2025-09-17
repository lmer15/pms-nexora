const TaskAttachment = require('../models/TaskAttachment');
const fileUploadService = require('../services/fileUploadService');
const ActivityLoggerService = require('../services/activityLoggerService');
const path = require('path');
const fs = require('fs').promises;

const User = require('../models/User');

exports.getAttachmentsByTask = async (req, res) => {
  try {
    const attachments = await TaskAttachment.findByTask(req.params.taskId);

    // Fetch uploader names for each attachment
    const uploaderIds = [...new Set(attachments.map(att => att.uploaderId))];
    const uploaderProfiles = {};
    for (const id of uploaderIds) {
      const profile = await User.getProfile(id);
      uploaderProfiles[id] = profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'Unknown';
    }

    // Attach uploaderName to each attachment
    const attachmentsWithUploaderName = attachments.map(att => ({
      ...att,
      uploaderName: uploaderProfiles[att.uploaderId] || 'Unknown',
    }));

    res.json(attachmentsWithUploaderName);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ message: 'Server error fetching attachments' });
  }
};

exports.uploadAttachments = async (req, res) => {
  try {
    const uploaderId = req.userId;
    const { taskId } = req.params;

    // Use multer middleware to handle file upload
    fileUploadService.uploadFiles(req, res, async (err) => {
      if (err) {
        console.error('File upload error:', err);
        return res.status(400).json({ 
          message: err.message || 'File upload failed' 
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      try {
        const attachments = [];

        // Process each uploaded file
        for (const file of req.files) {
          const fileInfo = fileUploadService.getFileInfo(file);
          
          const attachmentData = {
            taskId,
            uploaderId,
            fileName: fileInfo.originalName,
            fileType: fileInfo.mimetype,
            fileSize: fileInfo.size,
            filePath: fileInfo.path,
            fileUrl: `/api/attachments/download/${fileInfo.filename}`,
            uploadedAt: new Date()
          };

          const attachment = await TaskAttachment.create(attachmentData);
          attachments.push(attachment);

          // Log activity
          await ActivityLoggerService.logAttachmentAdded(
            taskId, 
            uploaderId, 
            fileInfo.originalName, 
            fileInfo.size
          );
        }

        res.status(201).json({
          message: `${attachments.length} file(s) uploaded successfully`,
          attachments
        });
      } catch (dbError) {
        console.error('Database error after file upload:', dbError);
        
        // Clean up uploaded files if database operation failed
        for (const file of req.files) {
          await fileUploadService.deleteFile(file.filename);
        }
        
        res.status(500).json({ message: 'Server error saving attachment data' });
      }
    });
  } catch (error) {
    console.error('Error uploading attachments:', error);
    res.status(500).json({ message: 'Server error uploading attachments' });
  }
};

exports.downloadAttachment = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads/attachments', filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Get attachment info from database for security check
    const attachment = await TaskAttachment.findByFilename(filename);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Determine if file can be previewed inline (e.g., images, PDFs, text)
    const previewableTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/csv'
    ];

    if (previewableTypes.includes(attachment.fileType)) {
      // Set headers for inline display
      res.setHeader('Content-Disposition', `inline; filename="${attachment.fileName}"`);
      res.setHeader('Content-Type', attachment.fileType);
      res.sendFile(filePath);
    } else {
      // For other types, force download
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.fileName}"`);
      res.setHeader('Content-Type', attachment.fileType);
      res.sendFile(filePath);
    }
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ message: 'Server error downloading attachment' });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.userId;

    // Get attachment info before deletion
    const attachment = await TaskAttachment.findById(attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }



    // Delete file from filesystem
    const fileDeleted = await fileUploadService.deleteFile(attachment.filePath);
    if (!fileDeleted) {
      console.warn(`Failed to delete file: ${attachment.filePath}`);
    }

    // Delete from database
    const deleted = await TaskAttachment.delete(attachmentId);
    if (!deleted) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Log activity
    await ActivityLoggerService.logAttachmentDeleted(
      attachment.taskId,
      userId,
      attachment.fileName
    );

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ message: 'Server error deleting attachment' });
  }
};

exports.getAttachmentInfo = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const attachment = await TaskAttachment.findById(attachmentId);
    
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    res.json(attachment);
  } catch (error) {
    console.error('Error fetching attachment info:', error);
    res.status(500).json({ message: 'Server error fetching attachment info' });
  }
};
