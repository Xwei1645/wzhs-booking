import { db } from '../../../utils/prisma'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { password } = body

    if (!id || !password) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing user ID or password'
        })
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        await db.user.update({
            where: { id: parseInt(id) },
            data: {
                password: hashedPassword
            }
        })

        return { message: 'Password reset successfully' }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }
})
