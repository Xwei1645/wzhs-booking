import { db } from '../../utils/prisma'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { account, password, name, role, organizationIds } = body

    if (!account || !password || !name) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required fields'
        })
    }

    try {
        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { account }
        })

        if (existingUser) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Account already exists'
            })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await db.user.create({
            data: {
                account,
                password: hashedPassword,
                name,
                role: role || 'user',
                status: true,
                organizations: {
                    connect: organizationIds?.map((id: number) => ({ id })) || []
                }
            }
        })

        return {
            id: user.id,
            account: user.account,
            name: user.name,
            role: user.role,
            status: user.status,
            createTime: user.createTime
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }
})
