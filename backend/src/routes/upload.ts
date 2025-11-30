import { Router, Request, Response } from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import pool from '../database/connection';
import { authenticate, authorize } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Word documents (.doc, .docx) are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

interface ParsedStudent {
  rollNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

// Parse student data from Word document text
function parseStudentData(text: string): ParsedStudent[] {
  const students: ParsedStudent[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log('Parsing document with', lines.length, 'lines');
  
  for (const line of lines) {
    // Skip header lines
    if (line.toLowerCase().includes('roll') && line.toLowerCase().includes('name')) {
      continue;
    }
    if (line.toLowerCase().includes('s.no') || line.toLowerCase().includes('sl.no')) {
      continue;
    }
    
    // Try different parsing patterns
    let parsed: ParsedStudent | null = null;
    
    // Pattern 1: Tab or multiple spaces separated (Roll No, Name, Email, Phone)
    // Example: "21CS1A0101	John Doe	john@email.com	9876543210"
    const tabParts = line.split(/\t+|\s{2,}/);
    if (tabParts.length >= 2) {
      const rollNumber = tabParts[0].trim();
      const fullName = tabParts[1].trim();
      const email = tabParts[2]?.includes('@') ? tabParts[2].trim() : undefined;
      const phone = tabParts.find(p => /^\d{10}$/.test(p.trim()));
      
      if (rollNumber && fullName && /^[A-Z0-9]+$/i.test(rollNumber.replace(/[^A-Z0-9]/gi, ''))) {
        const nameParts = fullName.split(' ');
        parsed = {
          rollNumber: rollNumber.toUpperCase(),
          firstName: nameParts[0] || fullName,
          lastName: nameParts.slice(1).join(' ') || 'Student',
          email,
          phone: phone?.trim(),
        };
      }
    }
    
    // Pattern 2: Comma separated
    // Example: "21CS1A0101, John Doe, john@email.com"
    if (!parsed) {
      const commaParts = line.split(',').map(p => p.trim());
      if (commaParts.length >= 2) {
        const rollNumber = commaParts[0];
        const fullName = commaParts[1];
        const email = commaParts.find(p => p.includes('@'));
        const phone = commaParts.find(p => /^\d{10}$/.test(p));
        
        if (rollNumber && fullName && /^[A-Z0-9]+$/i.test(rollNumber.replace(/[^A-Z0-9]/gi, ''))) {
          const nameParts = fullName.split(' ');
          parsed = {
            rollNumber: rollNumber.toUpperCase(),
            firstName: nameParts[0] || fullName,
            lastName: nameParts.slice(1).join(' ') || 'Student',
            email,
            phone,
          };
        }
      }
    }
    
    // Pattern 3: Roll number at start followed by name
    // Example: "21CS1A0101 John Doe"
    if (!parsed) {
      const match = line.match(/^([A-Z0-9]{6,15})\s+(.+)$/i);
      if (match) {
        const nameParts = match[2].split(' ');
        parsed = {
          rollNumber: match[1].toUpperCase(),
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ') || 'Student',
        };
      }
    }
    
    // Pattern 4: S.No, Roll Number, Name format
    // Example: "1. 21CS1A0101 John Doe" or "1	21CS1A0101	John Doe"
    if (!parsed) {
      const match = line.match(/^\d+[.\s]+([A-Z0-9]{6,15})\s+(.+)$/i);
      if (match) {
        const nameParts = match[2].split(/\s+/);
        parsed = {
          rollNumber: match[1].toUpperCase(),
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ') || 'Student',
        };
      }
    }
    
    if (parsed && parsed.rollNumber.length >= 6) {
      students.push(parsed);
    }
  }
  
  return students;
}

// Upload and import students from Word document
router.post(
  '/students',
  authenticate,
  authorize('admin'),
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const { departmentId, sectionId, defaultPassword } = req.body;

    if (!departmentId || !sectionId) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      res.status(400).json({ success: false, error: 'Department and Section are required' });
      return;
    }

    const connection = await pool.getConnection();

    try {
      // Read and parse Word document
      const result = await mammoth.extractRawText({ path: req.file.path });
      const text = result.value;
      
      console.log('Extracted text from Word document:', text.substring(0, 500));
      
      const students = parseStudentData(text);
      
      if (students.length === 0) {
        fs.unlinkSync(req.file.path);
        res.status(400).json({ 
          success: false, 
          error: 'No valid student data found in the document. Please ensure the format is: RollNumber, FirstName LastName (one per line)',
          hint: 'Example format:\n21CS1A0101, John Doe\n21CS1A0102, Jane Smith'
        });
        return;
      }

      // Hash default password
      const hashedPassword = await bcrypt.hash(defaultPassword || 'password123', 10);

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      await connection.beginTransaction();

      for (const student of students) {
        try {
          const userId = uuidv4();
          // Generate email from roll number if not provided
          const email = student.email || `${student.rollNumber.toLowerCase()}@crrit.edu.in`;
          
          // Check if email or roll number already exists
          const [existingUserRows] = await connection.execute<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
          const [existingRollRows] = await connection.execute<RowDataPacket[]>('SELECT id FROM student_sections WHERE roll_number = ?', [student.rollNumber]);
          
          if (existingUserRows.length > 0 || existingRollRows.length > 0) {
            skipped++;
            continue;
          }

          await connection.execute(
            `INSERT INTO users (id, email, password, first_name, last_name, role, department_id, phone)
             VALUES (?, ?, ?, ?, ?, 'student', ?, ?)`,
            [userId, email, hashedPassword, student.firstName, student.lastName, departmentId, student.phone || null]
          );

          await connection.execute(
            `INSERT INTO student_sections (id, student_id, section_id, roll_number)
             VALUES (?, ?, ?, ?)`,
            [uuidv4(), userId, sectionId, student.rollNumber]
          );

          imported++;
        } catch (err: any) {
          errors.push(`${student.rollNumber}: ${err.message}`);
          skipped++;
        }
      }

      await connection.commit();

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: `Successfully imported ${imported} students`,
        data: {
          total: students.length,
          imported,
          skipped,
          errors: errors.slice(0, 10), // Return first 10 errors
        },
      });
    } catch (error: any) {
      await connection.rollback();
      console.error('Import error:', error);
      // Clean up uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ success: false, error: 'Failed to process document: ' + error.message });
    } finally {
      connection.release();
    }
  }
);

// Get sample template info
router.get('/template', authenticate, authorize('admin'), (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      description: 'Upload a Word document (.docx) with student data',
      supportedFormats: [
        'Roll Number, Full Name (comma separated)',
        'Roll Number    Full Name (tab separated)',
        'Roll Number Full Name Email Phone (space/tab separated)',
        'S.No Roll Number Full Name (numbered list)',
      ],
      example: `Example Word Document Content:

21CS1A0101, Rahul Kumar
21CS1A0102, Priya Sharma
21CS1A0103, Amit Singh
21CS1A0104, Sneha Reddy

OR

Roll No    Name           Email              Phone
21CS1A0101 Rahul Kumar    rahul@email.com    9876543210
21CS1A0102 Priya Sharma   priya@email.com    9876543211`,
    },
  });
});

// Upload faculty from Word document
router.post(
  '/faculty',
  authenticate,
  authorize('admin'),
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const { departmentId, defaultPassword } = req.body;

    if (!departmentId) {
      fs.unlinkSync(req.file.path);
      res.status(400).json({ success: false, error: 'Department is required' });
      return;
    }

    const connection = await pool.getConnection();

    try {
      const result = await mammoth.extractRawText({ path: req.file.path });
      const text = result.value;
      
      // Parse faculty data (Name, Email, Phone format)
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const faculty: { name: string; email?: string; phone?: string }[] = [];
      
      for (const line of lines) {
        // Skip headers
        if (line.toLowerCase().includes('name') && line.toLowerCase().includes('email')) continue;
        
        const parts = line.split(/[,\t]+/).map(p => p.trim());
        if (parts.length >= 1 && parts[0].length > 2) {
          faculty.push({
            name: parts[0],
            email: parts.find(p => p.includes('@')),
            phone: parts.find(p => /^\d{10}$/.test(p)),
          });
        }
      }

      if (faculty.length === 0) {
        fs.unlinkSync(req.file.path);
        res.status(400).json({ success: false, error: 'No valid faculty data found' });
        return;
      }

      const hashedPassword = await bcrypt.hash(defaultPassword || 'password123', 10);

      let imported = 0;

      await connection.beginTransaction();

      for (const f of faculty) {
        const nameParts = f.name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || 'Faculty';
        const email = f.email || `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s/g, '')}@crrit.edu.in`;
        
        const [existingRows] = await connection.execute<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
        if (existingRows.length === 0) {
          await connection.execute(
            `INSERT INTO users (id, email, password, first_name, last_name, role, department_id, phone)
             VALUES (?, ?, ?, ?, ?, 'faculty', ?, ?)`,
            [uuidv4(), email, hashedPassword, firstName, lastName, departmentId, f.phone || null]
          );
          imported++;
        }
      }

      await connection.commit();

      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: `Successfully imported ${imported} faculty members`,
        data: { total: faculty.length, imported },
      });
    } catch (error: any) {
      await connection.rollback();
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ success: false, error: 'Failed to process document: ' + error.message });
    } finally {
      connection.release();
    }
  }
);

export default router;
