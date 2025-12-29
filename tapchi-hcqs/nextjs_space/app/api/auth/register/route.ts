
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/responses'
import { registerSchema, sanitizeFilename } from '@/lib/validation'
import { uploadFile } from '@/lib/s3'
import {
  sendEmail,
  getRegistrationVerificationEmailTemplate,
  getNewRegistrationNotificationEmailTemplate
} from '@/lib/email'
import crypto from 'crypto'

// Allowed file types for CV/work card
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/jpg'
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    let email: string
    let password: string
    let fullName: string
    let org: string | undefined
    let phone: string | undefined
    let academicTitle: string | undefined
    let academicDegree: string | undefined
    let position: string | undefined
    let rank: string | undefined
    let role: string
    let cvFile: File | null = null
    let workCardFile: File | null = null

    // Handle both JSON and FormData
    if (contentType.includes('application/json')) {
      // JSON format (for backward compatibility)
      const body = await request.json()
      email = body.email
      password = body.password
      fullName = body.fullName
      org = body.org
      phone = body.phone
      academicTitle = body.academicTitle
      academicDegree = body.academicDegree
      position = body.position
      rank = body.rank
      role = body.role || 'AUTHOR'
    } else {
      // FormData format (for file uploads)
      const formData = await request.formData()
      
      email = formData.get('email') as string
      password = formData.get('password') as string
      fullName = formData.get('fullName') as string
      org = formData.get('org') as string || undefined
      phone = formData.get('phone') as string || undefined
      academicTitle = formData.get('academicTitle') as string || undefined
      academicDegree = formData.get('academicDegree') as string || undefined
      position = formData.get('position') as string || undefined
      rank = formData.get('rank') as string || undefined
      role = (formData.get('role') as string) || 'AUTHOR'
      
      // Extract files
      cvFile = formData.get('cvFile') as File | null
      workCardFile = formData.get('workCardFile') as File | null
    }

    // Build body object for validation
    const body: any = {
      email,
      password,
      fullName,
      role
    }

    if (org) body.org = org
    if (phone) body.phone = phone
    if (academicTitle) body.academicTitle = academicTitle
    if (academicDegree) body.academicDegree = academicDegree
    if (position) body.position = position
    if (rank) body.rank = rank
    
    // Validate basic fields
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const validatedData = validation.data

    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return errorResponse('Email đã được sử dụng', 409)
    }

    // Validate and upload CV file
    let cvUrl: string | undefined
    if (cvFile && cvFile.size > 0) {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(cvFile.type)) {
        return errorResponse(
          'File CV không hợp lệ. Chỉ chấp nhận PDF, DOC, DOCX, JPG, PNG',
          400
        )
      }

      // Validate file size
      if (cvFile.size > MAX_FILE_SIZE) {
        return errorResponse(
          `File CV quá lớn. Kích thước tối đa là ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          400
        )
      }

      // Generate unique filename
      const fileExt = cvFile.name.split('.').pop() || 'pdf'
      const sanitizedName = sanitizeFilename(cvFile.name.replace(/\.[^/.]+$/, ''))
      const uniqueId = crypto.randomBytes(8).toString('hex')
      const timestamp = Date.now()
      const fileName = `cv_${sanitizedName}_${timestamp}_${uniqueId}.${fileExt}`

      // Upload to S3
      const buffer = Buffer.from(await cvFile.arrayBuffer())
      const s3Key = await uploadFile(
        buffer,
        `user-documents/cv/${fileName}`,
        cvFile.type
      )
      cvUrl = s3Key
    }

    // Validate and upload work card file
    let workCardUrl: string | undefined
    if (workCardFile && workCardFile.size > 0) {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(workCardFile.type)) {
        return errorResponse(
          'File thẻ công tác không hợp lệ. Chỉ chấp nhận PDF, DOC, DOCX, JPG, PNG',
          400
        )
      }

      // Validate file size
      if (workCardFile.size > MAX_FILE_SIZE) {
        return errorResponse(
          `File thẻ công tác quá lớn. Kích thước tối đa là ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          400
        )
      }

      // Generate unique filename
      const fileExt = workCardFile.name.split('.').pop() || 'pdf'
      const sanitizedName = sanitizeFilename(workCardFile.name.replace(/\.[^/.]+$/, ''))
      const uniqueId = crypto.randomBytes(8).toString('hex')
      const timestamp = Date.now()
      const fileName = `workcard_${sanitizedName}_${timestamp}_${uniqueId}.${fileExt}`

      // Upload to S3
      const buffer = Buffer.from(await workCardFile.arrayBuffer())
      const s3Key = await uploadFile(
        buffer,
        `user-documents/workcard/${fileName}`,
        workCardFile.type
      )
      workCardUrl = s3Key
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password)

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // ✅ Admin accounts don't need approval
    const isAdminRole = validatedData.role === 'SYSADMIN'
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        fullName: validatedData.fullName,
        org: validatedData.org,
        phone: validatedData.phone,
        academicTitle: validatedData.academicTitle,
        academicDegree: validatedData.academicDegree,
        position: validatedData.position,
        rank: validatedData.rank,
        cvUrl,
        workCardUrl,
        requestedRole: validatedData.role as any,
        role: isAdminRole ? validatedData.role as any : 'READER', // Admin gets role immediately
        passwordHash,
        status: isAdminRole ? 'APPROVED' : 'PENDING', // Admin auto-approved
        isActive: isAdminRole, // Admin auto-activated
        emailVerified: isAdminRole, // Admin doesn't need email verification
        verificationToken: isAdminRole ? null : verificationToken,
        verificationTokenExpiry: isAdminRole ? null : verificationTokenExpiry,
        approvedAt: isAdminRole ? new Date() : null
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        org: true,
        phone: true,
        requestedRole: true,
        role: true,
        status: true,
        isActive: true,
        emailVerified: true,
        createdAt: true
      }
    })

    // ✅ Send verification email to user (except admin)
    if (!isAdminRole) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tapchinckhhcqs.abacusai.app'
      const verificationUrl = `${appUrl}/auth/verify-email?token=${verificationToken}`
      
      const verificationEmail = getRegistrationVerificationEmailTemplate(
        user.fullName,
        verificationUrl,
        'vi'
      )

      await sendEmail({
        to: user.email,
        subject: verificationEmail.subject,
        html: verificationEmail.html,
        text: verificationEmail.text
      })

      // Send notification email to admins (for non-admin registrations)
      try {
        const admins = await prisma.user.findMany({
          where: {
            role: { in: ['SYSADMIN', 'MANAGING_EDITOR', 'EIC'] },
            isActive: true
          },
          select: { email: true }
        })

        if (admins.length > 0) {
          const adminEmails = admins.map(admin => admin.email)
          const adminNotification = getNewRegistrationNotificationEmailTemplate(
            user.fullName,
            user.email,
            user.requestedRole || 'AUTHOR',
            user.org,
            'vi'
          )

          await sendEmail({
            to: adminEmails,
            subject: adminNotification.subject,
            html: adminNotification.html,
            text: adminNotification.text
          })
        }
      } catch (emailError) {
        console.error('Error sending admin notification:', emailError)
        // Don't fail registration if admin notification fails
      }
    }

    // Return appropriate message
    const successMessage = isAdminRole 
      ? 'Đăng ký tài khoản Admin thành công! Bạn có thể đăng nhập ngay bây giờ.'
      : 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản. Sau đó, tài khoản của bạn sẽ được Ban biên tập duyệt.'

    return successResponse(user, successMessage)
  } catch (error: any) {
    console.error('Register error:', error)
    return errorResponse(error.message || 'Lỗi server')
  }
}
