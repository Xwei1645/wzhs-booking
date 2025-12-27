import { db } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
    try {
        const organizations = await db.organization.findMany({
            orderBy: {
                createTime: 'desc'
            },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        account: true
                    }
                }
            }
        })
        return organizations
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }
})
