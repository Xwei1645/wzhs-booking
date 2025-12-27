import { db } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    try {
        const users = await db.user.findMany({
            orderBy: {
                createTime: 'desc'
            },
            select: {
                id: true,
                account: true,
                name: true,
                role: true,
                status: true,
                createTime: true,
                organizations: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })
        return users
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }
})
